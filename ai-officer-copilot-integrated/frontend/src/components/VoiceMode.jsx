import { useEffect, useRef, useState } from 'react'
import { CloseIcon, MicIcon } from './Icons.jsx'
import { useSpeechToText, useTextToSpeech, isVoiceInputSupported, isVoiceOutputSupported } from '../hooks/useVoice.js'

// Full-screen conversational voice mode, in the spirit of Gemini Live /
// ChatGPT voice mode: a single large animated orb communicates state
// (idle / listening / thinking / speaking) instead of a small mic icon.
// Flow: mount -> auto-start listening -> user pauses -> onSend(transcript)
// -> caller streams a reply -> caller calls speakReply(text) when it's
// ready -> orb speaks it aloud -> automatically starts listening again.

const STATE_LABEL = {
  idle: 'Tap the orb to start talking',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
  denied: 'Microphone access is blocked',
  unsupported: 'Voice isn\'t supported in this browser',
}

export default function VoiceMode({ onClose, onSend, registerSpeak, userName = 'You' }) {
  const [phase, setPhase] = useState('idle') // idle | listening | thinking | speaking | denied | unsupported
  const [liveTranscript, setLiveTranscript] = useState('')
  const [lastHeard, setLastHeard] = useState('')
  const [lastReply, setLastReply] = useState('')
  const phaseRef = useRef('idle')
  phaseRef.current = phase

  const inputSupported = isVoiceInputSupported()
  const outputSupported = isVoiceOutputSupported()

  const { speak, stop: stopSpeaking } = useTextToSpeech()

  const { listening, error, start, stop } = useSpeechToText({
    continuous: false,
    onInterim: (text) => setLiveTranscript(text),
    onFinalResult: (text) => {
      setLiveTranscript('')
      setLastHeard(text)
      setPhase('thinking')
      onSend(text)
    },
    onEnd: () => {
      if (phaseRef.current === 'listening') setPhase('idle')
    },
  })

  // Let the parent (App.jsx) push the assistant's reply in here to be
  // spoken, once it has finished streaming.
  useEffect(() => {
    if (!registerSpeak) return undefined
    registerSpeak((replyText) => {
      setLastReply(replyText)
      if (!outputSupported) { setPhase('idle'); return }
      setPhase('speaking')
      speak(replyText, 'voice-mode-reply', {
        onEnd: () => {
          setPhase('listening')
          start()
        },
      })
    })
    return () => registerSpeak(null)
  }, [registerSpeak, outputSupported, speak, start])

  useEffect(() => {
    if (!inputSupported) { setPhase('unsupported'); return }
    setPhase('listening')
    start()
    return () => { stop(); stopSpeaking() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (error) setPhase(error.includes('denied') ? 'denied' : 'idle')
  }, [error])

  useEffect(() => {
    if (listening && phase !== 'listening' && phase !== 'thinking') setPhase('listening')
  }, [listening]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrbClick = () => {
    if (phase === 'speaking') { stopSpeaking(); setPhase('listening'); start(); return }
    if (phase === 'listening') { stop(); setPhase('idle'); return }
    if (phase === 'idle' || phase === 'denied') { setPhase('listening'); start() }
  }

  const handleClose = () => {
    stop()
    stopSpeaking()
    onClose()
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="voice-mode-overlay" role="dialog" aria-modal="true" aria-label="Voice assistant">
      <button className="voice-mode-close" onClick={handleClose} aria-label="Close voice mode">
        <CloseIcon />
      </button>

      <div className={`voice-orb-stage phase-${phase}`}>
        <div className="voice-orb-rings" aria-hidden="true">
          <span className="ring ring-1" />
          <span className="ring ring-2" />
          <span className="ring ring-3" />
        </div>
        <button
          className="voice-orb"
          onClick={handleOrbClick}
          aria-label={phase === 'listening' ? 'Stop listening' : 'Start talking'}
        >
          <span className="voice-orb-core" />
          {(phase === 'idle' || phase === 'denied' || phase === 'unsupported') && (
            <span className="voice-orb-icon"><MicIcon /></span>
          )}
        </button>
      </div>

      <p className="voice-mode-status">{STATE_LABEL[phase]}</p>

      <div className="voice-mode-transcript">
        {liveTranscript && <p className="voice-mode-live">“{liveTranscript}”</p>}
        {!liveTranscript && lastHeard && (
          <p className="voice-mode-heard"><span>{userName}</span> {lastHeard}</p>
        )}
        {!liveTranscript && lastReply && phase !== 'thinking' && (
          <p className="voice-mode-reply-text">{lastReply}</p>
        )}
      </div>

      {error && <p className="voice-mode-error">{error}</p>}
      {phase === 'unsupported' && (
        <p className="voice-mode-error">Try Chrome, Edge, or Safari for voice input.</p>
      )}

      <p className="voice-mode-hint">Tap the orb to mute · Esc or × to exit voice mode</p>
    </div>
  )
}
