import { PlusIcon, LetterIcon, SummaryIcon, MinutesIcon, PendingIcon, SearchIcon, LogoutIcon } from './Icons.jsx'

const ACTIONS = [
  { key: 'letter', label: 'Draft a professional document', desc: 'Letters, emails, reports and notes', Icon: LetterIcon },
  { key: 'summary', label: 'Summarize saved sources', desc: 'Use files attached to this topic', Icon: SummaryIcon },
  { key: 'minutes', label: 'Generate meeting minutes', desc: 'Turn notes into structured minutes', Icon: MinutesIcon },
  { key: 'pending', label: 'Track topic tasks', desc: 'Open the saved task panel', Icon: PendingIcon },
  { key: 'search', label: 'Search saved knowledge', desc: 'Ask across chat + reusable sources', Icon: SearchIcon },
]

export default function Sidebar({ open, user, chats, activeChatId, onNewChat, onSelectChat, onAction, onLogout, onOpenTasks, onOpenSources, online }) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div>
        <button className="new-file-btn" onClick={onNewChat}>
          <PlusIcon /> Start new chat
        </button>
      </div>

      <div>
        <p className="sidebar-block-title">Quick actions</p>
        <div className="action-grid">
          {ACTIONS.map(({ key, label, desc, Icon }) => (
            <button key={key} className="action-item" onClick={() => key === 'pending' ? onOpenTasks() : onAction(key)}>
              <span className="icon-badge"><Icon /></span>
              <span>
                <div className="label">{label}</div>
                <div className="desc">{desc}</div>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="sidebar-title-row">
          <p className="sidebar-block-title">Saved topics</p>
          <button className="mini-link" onClick={onOpenSources}>Sources</button>
        </div>
        <div className="file-history">
          {chats.length === 0 && <div className="sidebar-empty">No topics yet. Start a new chat.</div>}
          {chats.map((chat, i) => (
            <button
              key={chat.id}
              className={`file-row topic-row${chat.id === activeChatId ? ' active' : ''}`}
              onClick={() => onSelectChat(chat)}
              title={chat.title}
            >
              <span className="tag">#{String(i + 1).padStart(3, '0')}</span>
              <span className="name">{chat.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="officer-avatar">{user?.initials || 'U'}</div>
        <div className="sidebar-user-copy">
          <div className="officer-name">{user?.name || 'User'}</div>
          <div className="officer-role">{online ? 'WebSocket connected' : 'Connecting…'}</div>
        </div>
        <button className="sidebar-logout" onClick={onLogout} aria-label="Sign out" title="Sign out">
          <LogoutIcon />
        </button>
      </div>
    </aside>
  )
}
