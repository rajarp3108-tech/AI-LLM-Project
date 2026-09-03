import { useEffect, useRef } from 'react'
import { AttachIcon, MicIcon, SendIcon } from './Icons.jsx'
import { isVoiceInputSupported } from '../hooks/useVoice.js'

const CHIPS = [
  { label: 'Explain a topic', fill: 'Explain this topic in a simple way with examples.' },
  { label: 'Summarize my sources', fill: 'Summarize the relevant information from the files saved in this chat.' },
  { label: 'Pending tasks', fill: 'What tasks are currently pending in this chat?' },
  { label: 'Draft a document', fill: 'Help me draft a professional document for this topic.' },
]

export default function Composer({ value, onChange, onSend, onAttach, onOpenVoice, disabled }) {
  const textareaRef = useRef(null)
  const fileRef = useRef(null)
  const voiceSupported = isVoiceInputSupported()

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [value])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled) onSend(value)
    }
  }

  return (
    <div className="composer-wrap">
      <div className="composer">
        <div className="suggestion-row">
          {CHIPS.map((c) => (
            <button key={c.label} className="chip" onClick={() => onChange(c.fill)} disabled={disabled}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="input-row">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,text/plain,application/pdf,text/markdown"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onAttach(file)
              e.target.value = ''
            }}
          />
          <button className="icon-btn" aria-label="Attach file" title="Attach a document" onClick={() => fileRef.current?.click()} disabled={disabled}>
            <AttachIcon />
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={disabled ? 'Start or select a chat first…' : 'Ask anything, or use your saved RAG sources…'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={4000}
            disabled={disabled}
          />
          <button
            className="icon-btn voice-launch-btn"
            aria-label="Start voice assistant"
            title={voiceSupported ? 'Talk to your AI Copilot' : 'Voice input is not supported in this browser'}
            onClick={onOpenVoice}
            disabled={disabled || !voiceSupported}
          >
            <MicIcon />
          </button>
          <button className="send-btn" aria-label="Send message" onClick={() => onSend(value)} disabled={disabled || !value.trim()}>
            <SendIcon />
          </button>
        </div>
        <div className="composer-foot">
          <span>Uploads are optional. Relevant chat/global sources are used through RAG when available.</span>
          <span>{value.length} / 4000</span>
        </div>
      </div>
    </div>
  )
}
