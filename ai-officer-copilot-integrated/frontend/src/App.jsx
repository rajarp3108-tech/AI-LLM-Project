import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Letterhead from './components/Letterhead.jsx'
import Sidebar from './components/Sidebar.jsx'
import Composer from './components/Composer.jsx'
import Message, { TypingMessage } from './components/Message.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import VoiceMode from './components/VoiceMode.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { api } from './services/api.js'
import { createChatSocket } from './services/socket.js'

function timeLabel(value) {
  if (!value) return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const ACTION_PROMPTS = {
  letter: 'Draft a professional document for the current topic. Ask me for any missing details before finalizing it.',
  summary: 'Summarize the relevant saved sources for this topic. Clearly separate source-grounded points from general knowledge.',
  minutes: 'Create structured meeting minutes for this topic with decisions, owners, deadlines and pending actions.',
  search: 'Search the relevant saved RAG sources and explain what they say about this topic. If nothing relevant is found, tell me clearly.',
}

export default function App() {
  const { user, initializing, logout } = useAuth()
  const [chats, setChats] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [stream, setStream] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [online, setOnline] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [notice, setNotice] = useState('')
  const [panel, setPanel] = useState(null) // tasks | sources
  const [tasks, setTasks] = useState([])
  const [documents, setDocuments] = useState([])
  const [uploadScope, setUploadScope] = useState('chat')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const streamEndRef = useRef(null)
  const currentRef = useRef(null)
  const voiceSpeakRef = useRef(null) // set by VoiceMode via registerSpeak; call to speak a reply aloud
  const socket = useMemo(() => createChatSocket(), [user?.id])

  useEffect(() => { currentRef.current = currentChat }, [currentChat])

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, stream])

  const refreshChats = useCallback(async () => {
    const data = await api.chats()
    setChats(data.chats || [])
    return data.chats || []
  }, [])

  const refreshDocuments = useCallback(async () => {
    const data = await api.documents()
    setDocuments(data.documents || [])
  }, [])

  const refreshTasks = useCallback(async (chatId = currentRef.current?.id) => {
    const data = await api.tasks(chatId)
    setTasks(data.tasks || [])
  }, [])

  const openChat = useCallback(async (chat) => {
    if (!chat) return
    setLoadingChat(true)
    setStream('')
    try {
      const data = await api.chatMessages(chat.id)
      setCurrentChat(data.chat || chat)
      currentRef.current = data.chat || chat
      setMessages(data.messages || [])
      await refreshTasks(chat.id)
    } catch (error) {
      setNotice(error.message)
    } finally {
      setLoadingChat(false)
    }
  }, [refreshTasks])

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    async function boot() {
      try {
        const [list] = await Promise.all([refreshChats(), refreshDocuments()])
        if (!cancelled && list.length) await openChat(list[0])
      } catch (error) {
        if (!cancelled) setNotice(error.message)
      }
    }
    boot()
    return () => { cancelled = true }
  }, [user, refreshChats, refreshDocuments, openChat])

  useEffect(() => {
    if (!user) return undefined

    const onConnect = () => setOnline(true)
    const onDisconnect = () => setOnline(false)
    const onStart = ({ chatId }) => {
      if (chatId === currentRef.current?.id) setStream('')
    }
    const onToken = ({ chatId, token }) => {
      if (chatId === currentRef.current?.id) setStream((s) => s + (token || ''))
    }
    const onDone = async ({ chatId }) => {
      setStream('')
      await refreshChats()
      if (chatId === currentRef.current?.id) {
        const data = await api.chatMessages(chatId)
        setCurrentChat(data.chat)
        currentRef.current = data.chat
        setMessages(data.messages || [])
        if (voiceSpeakRef.current) {
          const lastAssistant = [...(data.messages || [])].reverse().find((m) => m.role === 'assistant')
          if (lastAssistant?.text) voiceSpeakRef.current(lastAssistant.text)
        }
      }
      await refreshTasks(chatId)
    }
    const onError = ({ message }) => {
      setStream('')
      setNotice(message || 'Could not generate response')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('chat:start', onStart)
    socket.on('chat:token', onToken)
    socket.on('chat:done', onDone)
    socket.on('chat:error', onError)
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('chat:start', onStart)
      socket.off('chat:token', onToken)
      socket.off('chat:done', onDone)
      socket.off('chat:error', onError)
      socket.disconnect()
    }
  }, [socket, user, refreshChats, refreshTasks])

  const handleNewChat = async () => {
    const title = window.prompt('Topic name for this chat:', 'New Chat')
    if (title === null) return
    try {
      const chat = await api.newChat(title.trim() || 'New Chat')
      await refreshChats()
      await openChat(chat)
      setSidebarOpen(false)
    } catch (error) { setNotice(error.message) }
  }

  const sendMessage = useCallback((text) => {
    const clean = text.trim()
    if (!clean || !currentRef.current) return
    const optimistic = {
      id: `local-${Date.now()}`,
      role: 'user',
      text: clean,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setInput('')
    setStream('')
    socket.emit('chat:message', { message: clean, chatId: currentRef.current.id })
  }, [socket])

  const handleAction = (key) => {
    if (!currentChat) return handleNewChat()
    sendMessage(ACTION_PROMPTS[key])
  }

  const handleAttach = async (file) => {
    if (!currentChat && uploadScope === 'chat') {
      setNotice('Start or select a chat before attaching a chat-specific source.')
      return
    }
    try {
      const out = await api.upload(file, currentChat?.id, uploadScope)
      setNotice(`Uploaded “${out.name}” as ${out.scope === 'global' ? 'reusable' : 'chat'} RAG source.`)
      await refreshDocuments()
      setPanel('sources')
    } catch (error) { setNotice(error.message) }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!taskTitle.trim() || !currentChat) return
    try {
      await api.addTask({ chatId: currentChat.id, title: taskTitle.trim(), deadline: taskDeadline, status: 'Pending' })
      setTaskTitle('')
      setTaskDeadline('')
      await refreshTasks(currentChat.id)
    } catch (error) { setNotice(error.message) }
  }

  const toggleTask = async (task) => {
    try {
      await api.updateTask(task.id, { status: task.status === 'Done' ? 'Pending' : 'Done' })
      await refreshTasks(currentChat?.id)
    } catch (error) { setNotice(error.message) }
  }

  const deleteTask = async (task) => {
    try { await api.deleteTask(task.id); await refreshTasks(currentChat?.id) }
    catch (error) { setNotice(error.message) }
  }

  const deleteDocument = async (doc) => {
    try { await api.deleteDocument(doc.id); await refreshDocuments() }
    catch (error) { setNotice(error.message) }
  }

  const renameCurrentChat = async () => {
    if (!currentChat) return
    const title = window.prompt('Rename topic:', currentChat.title)
    if (!title?.trim()) return
    try {
      const updated = await api.renameChat(currentChat.id, title.trim())
      setCurrentChat(updated)
      currentRef.current = updated
      await refreshChats()
    } catch (error) { setNotice(error.message) }
  }

  const deleteCurrentChat = async () => {
    if (!currentChat || !window.confirm(`Delete “${currentChat.title}” and its chat-specific tasks/sources?`)) return
    try {
      await api.deleteChat(currentChat.id)
      setCurrentChat(null)
      setMessages([])
      const list = await refreshChats()
      await refreshDocuments()
      if (list.length) await openChat(list[0])
    } catch (error) { setNotice(error.message) }
  }

  if (initializing) return <div className="app-loading">Loading AI Copilot…</div>
  if (!user) return <AuthScreen />

  return (
    <div className="app">
      <Letterhead onMenuClick={() => setSidebarOpen((v) => !v)} user={user} onLogout={logout} online={online} />

      <div className="layout">
        <Sidebar
          open={sidebarOpen}
          user={user}
          chats={chats}
          activeChatId={currentChat?.id}
          onNewChat={handleNewChat}
          onSelectChat={(chat) => { openChat(chat); setSidebarOpen(false) }}
          onAction={handleAction}
          onLogout={logout}
          onOpenTasks={() => { refreshTasks(); setPanel('tasks') }}
          onOpenSources={() => { refreshDocuments(); setPanel('sources') }}
          online={online}
        />

        <section className="chat-col">
          <div className="workspace-toolbar">
            <div className="topic-toolbar-copy">
              <strong>{currentChat?.title || 'No topic selected'}</strong>
              <span>{currentChat ? `${messages.length} messages · ${tasks.filter((t) => t.status !== 'Done').length} pending tasks` : 'Create a chat to begin'}</span>
            </div>

            <div className="stats-strip">
              <div className="stat-pill"><span className="stat-value">{chats.length}</span><span className="stat-label">Topics</span></div>
              <div className="stat-pill"><span className="stat-value">{documents.length}</span><span className="stat-label">Sources</span></div>
              <div className="stat-pill"><span className="stat-value">{tasks.filter((t) => t.status !== 'Done').length}</span><span className="stat-label">Pending</span></div>
              <div className="stat-pill"><span className="stat-value">{messages.length}</span><span className="stat-label">Msgs</span></div>
            </div>

            <div className="topic-toolbar-actions">
              <button onClick={() => { refreshDocuments(); setPanel('sources') }}>Knowledge sources</button>
              <button onClick={() => { refreshTasks(); setPanel('tasks') }}>Tasks</button>
              <button onClick={renameCurrentChat} disabled={!currentChat}>Rename</button>
              <button className="danger-lite" onClick={deleteCurrentChat} disabled={!currentChat}>Delete</button>
            </div>
          </div>

          {notice && <div className="notice-bar"><span>{notice}</span><button onClick={() => setNotice('')}>×</button></div>}

          <div className="stream-wrap">
            <div className="stream">
              {!currentChat && (
                <div className="empty-chat-state">
                  <div className="empty-seal">AI</div>
                  <h2>How can I help today?</h2>
                  <p>Start a conversation on any topic — no files required. Attach PDFs, TXT or Markdown only when you want grounded, source-backed answers.</p>
                  <button className="new-file-btn compact" onClick={handleNewChat}>Start new chat</button>
                </div>
              )}
              {loadingChat && <TypingMessage />}
              {!loadingChat && messages.map((m) => (
                <Message
                  key={m.id}
                  id={m.id}
                  role={m.role}
                  text={m.text}
                  sources={m.sources || []}
                  file={m.file}
                  meta={timeLabel(m.createdAt)}
                  userInitials={user.initials}
                  userName={user.name}
                />
              ))}
              {stream && <TypingMessage text={stream} />}
              <div ref={streamEndRef} />
            </div>
          </div>

          <Composer value={input} onChange={setInput} onSend={sendMessage} onAttach={handleAttach} disabled={!currentChat} onOpenVoice={() => setVoiceMode(true)} />
        </section>
      </div>

      {panel && (
        <div className="panel-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setPanel(null) }}>
          <aside className="workspace-panel">
            <div className="panel-head">
              <div>
                <p className="panel-eyebrow">{panel === 'tasks' ? 'Topic workflow' : 'RAG knowledge base'}</p>
                <h2>{panel === 'tasks' ? 'Tasks' : 'Knowledge sources'}</h2>
              </div>
              <button className="panel-close" onClick={() => setPanel(null)}>×</button>
            </div>

            {panel === 'tasks' ? (
              <>
                <p className="panel-help">Tasks are stored with the current chat/topic.</p>
                <form className="task-form" onSubmit={addTask}>
                  <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" disabled={!currentChat} />
                  <input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} disabled={!currentChat} />
                  <button type="submit" disabled={!currentChat || !taskTitle.trim()}>Add task</button>
                </form>
                <div className="panel-list">
                  {tasks.length === 0 && <div className="panel-empty">No tasks for this topic yet.</div>}
                  {tasks.map((task) => (
                    <div className={`panel-item task-item${task.status === 'Done' ? ' done' : ''}`} key={task.id}>
                      <button className="task-check" onClick={() => toggleTask(task)}>{task.status === 'Done' ? '✓' : ''}</button>
                      <div className="panel-item-copy"><strong>{task.title}</strong><span>{task.deadline || 'No deadline'} · {task.status}</span></div>
                      <button className="item-delete" onClick={() => deleteTask(task)}>Delete</button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="panel-help">Chat sources belong only to this topic. Reusable sources can be fetched by RAG from every topic.</p>
                <div className="scope-switch">
                  <button className={uploadScope === 'chat' ? 'active' : ''} onClick={() => setUploadScope('chat')}>This chat</button>
                  <button className={uploadScope === 'global' ? 'active' : ''} onClick={() => setUploadScope('global')}>Reusable</button>
                </div>
                <label className="panel-upload">
                  <input type="file" accept=".pdf,.txt,.md" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAttach(f); e.target.value = '' }} />
                  + Upload PDF / TXT / MD
                </label>
                <div className="panel-list">
                  {documents.length === 0 && <div className="panel-empty">No RAG sources uploaded yet. Uploads are optional.</div>}
                  {documents.map((doc) => (
                    <div className="panel-item" key={doc.id}>
                      <div className="source-badge">{doc.scope === 'global' ? 'ALL' : 'CHAT'}</div>
                      <div className="panel-item-copy"><strong>{doc.name}</strong><span>{doc.scope === 'global' ? 'Reusable across topics' : (doc.chatId === currentChat?.id ? 'Current topic' : 'Another topic')}</span></div>
                      <button className="item-delete" onClick={() => deleteDocument(doc)}>Delete</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {voiceMode && currentChat && (
        <VoiceMode
          userName={user.name}
          onClose={() => setVoiceMode(false)}
          onSend={(text) => sendMessage(text)}
          registerSpeak={(fn) => { voiceSpeakRef.current = fn }}
        />
      )}
    </div>
  )
}
