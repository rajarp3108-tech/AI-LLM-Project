import { SealIcon, FileTextIcon, DownloadIcon, DatabaseIcon, SpeakerIcon, SpeakerMuteIcon } from './Icons.jsx'
import Markdown from './Markdown.jsx'
import { useTextToSpeech } from '../hooks/useVoice.js'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function FileCard({ file }) {
  if (!file?.url) return null
  const name = file.fileId || 'document.pdf'
  return (
    <a className="file-card" href={`${API}${file.url}`} target="_blank" rel="noopener noreferrer" download={name}>
      <span className="file-card-icon"><FileTextIcon /></span>
      <span className="file-card-info">
        <span className="file-card-name">{name}</span>
        <span className="file-card-action">Click to download</span>
      </span>
      <span className="file-card-download"><DownloadIcon /></span>
    </a>
  )
}

export default function Message({ id, role, text, meta, sources = [], file, userInitials = 'U', userName = 'You' }) {
  const isAI = role === 'assistant' || role === 'ai'
  const { isSupported: voiceOutSupported, speakingId, speak } = useTextToSpeech()
  const isSpeaking = speakingId === id

  return (
    <div className={`msg ${isAI ? 'ai' : 'user'}`}>
      <div className="avatar">{isAI ? 'AI' : userInitials}</div>
      <div className="bubble-col">
        <div className="bubble-meta-row">
          <div className="bubble-meta">{isAI ? 'AI Copilot' : userName} · {meta}</div>
          {isAI && voiceOutSupported && text && (
            <button
              className={`speak-btn${isSpeaking ? ' active' : ''}`}
              onClick={() => speak(text, id)}
              aria-label={isSpeaking ? 'Stop reading aloud' : 'Read reply aloud'}
              title={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
            >
              {isSpeaking ? <SpeakerMuteIcon /> : <SpeakerIcon />}
              {isSpeaking ? 'Stop' : 'Listen'}
            </button>
          )}
        </div>
        <div className="bubble">
          {isAI && <span className="seal"><SealIcon /></span>}
          {isAI ? <Markdown text={text} /> : <p className="message-text">{text}</p>}
          {isAI && file && <FileCard file={file} />}
          {isAI && sources?.length > 0 && (
            <div className="source-citations">
              <strong><DatabaseIcon /> Grounded in {sources.length} source{sources.length > 1 ? 's' : ''}</strong>
              <div className="source-chip-row">
                {sources.map((s, i) => <span className="source-chip" key={`${s.documentId || s.name}-${i}`}>{s.name || 'Saved source'}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TypingMessage({ text = '' }) {
  return (
    <div className="msg ai">
      <div className="avatar">AI</div>
      <div className="bubble-col">
        <div className="bubble-meta">AI Copilot · streaming…</div>
        <div className="bubble">
          {text ? <Markdown text={text + ' ▋'} /> : <div className="typing"><span></span><span></span><span></span></div>}
        </div>
      </div>
    </div>
  )
}
