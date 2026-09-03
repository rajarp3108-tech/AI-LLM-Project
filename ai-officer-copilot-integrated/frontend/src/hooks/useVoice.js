import { useCallback, useEffect, useRef, useState } from 'react'

// Thin wrapper around the browser's built-in Web Speech API. No server or
// API key is required — speech-to-text and text-to-speech both run locally
// in the browser.
//
// IMPORTANT: the SpeechRecognition instance is created ONCE per mount and
// kept in a ref; callbacks (onFinalResult, onInterim, etc.) are also stored
// in a ref and read inside the recognition's event handlers. This avoids
// the classic bug where passing a fresh inline arrow function as a
// dependency recreates the recognition object — and tears down an
// in-progress `.start()` — on every render, which looks exactly like "the
// mic isn't listening".

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isVoiceInputSupported() {
  return !!getRecognitionCtor()
}

export function isVoiceOutputSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * options:
 *  - onFinalResult(text): called once per completed utterance
 *  - onInterim(text): called continuously with the in-progress transcript
 *  - onEnd(): called when recognition fully stops (silence timeout, error,
 *    or manual stop) — not called between auto-restarts in continuous mode
 *  - continuous: if true, recognition restarts itself automatically after
 *    each pause, for a hands-free "keep listening" conversational loop
 *  - lang
 */
export function useSpeechToText({ onFinalResult, onInterim, onEnd, continuous = false, lang = 'en-US' } = {}) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const wantListeningRef = useRef(false) // tracks intent, survives re-renders
  const callbacksRef = useRef({ onFinalResult, onInterim, onEnd })
  callbacksRef.current = { onFinalResult, onInterim, onEnd }

  const isSupported = isVoiceInputSupported()

  useEffect(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return undefined

    const rec = new Ctor()
    rec.continuous = false // we manage our own restart loop for reliability across browsers
    rec.interimResults = true
    rec.lang = lang

    rec.onresult = (event) => {
      let finalText = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += transcript
        else interim += transcript
      }
      if (interim) callbacksRef.current.onInterim?.(interim)
      if (finalText.trim()) callbacksRef.current.onFinalResult?.(finalText.trim())
    }

    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError(event.error === 'not-allowed' ? 'Microphone access was denied.' : 'Voice input failed. Please try again.')
      wantListeningRef.current = false
      setListening(false)
    }

    rec.onend = () => {
      // If we're in continuous mode and still want to be listening (a pause
      // was just the browser's own utterance boundary), restart immediately.
      if (continuous && wantListeningRef.current) {
        try { rec.start() } catch { /* already starting */ }
        return
      }
      setListening(false)
      callbacksRef.current.onEnd?.()
    }

    recognitionRef.current = rec
    return () => {
      wantListeningRef.current = false
      rec.onresult = null; rec.onerror = null; rec.onend = null
      try { rec.stop() } catch { /* noop */ }
    }
  }, [lang, continuous])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setError('')
    wantListeningRef.current = true
    try { recognitionRef.current.start(); setListening(true) }
    catch { /* already started — ignore */ }
  }, [])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    if (!recognitionRef.current) return
    try { recognitionRef.current.stop() } catch { /* noop */ }
    setListening(false)
  }, [])

  return { isSupported, listening, error, start, stop }
}

// Strips markdown-ish symbols so read-aloud doesn't speak "asterisk asterisk"
// or field-table arrows out loud.
function toSpeakableText(raw) {
  return String(raw || '')
    .replace(/[#*_`>]/g, '')
    .replace(/\u2192|->/g, ' to ')
    .replace(/\|/g, ' ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Voice list loads asynchronously in most browsers (esp. Chrome) — the
// first speak() call right after page load can silently produce no sound
// if we hand SpeechSynthesis an utterance before voices are ready. We warm
// the list once and keep it in a module-level cache so every hook instance
// benefits, and we pick an explicit voice rather than leaving it null
// (some browsers stay silent with no voice assigned until the user has
// interacted with native browser UI).
let cachedVoices = []
function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  const list = window.speechSynthesis.getVoices()
  if (list.length) cachedVoices = list
  return cachedVoices
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

function pickVoice(lang = 'en-US') {
  const voices = loadVoices()
  if (!voices.length) return null
  return (
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang?.startsWith(lang.split('-')[0])) ||
    voices.find((v) => /en/i.test(v.lang || '')) ||
    voices[0]
  )
}

export function useTextToSpeech() {
  const [speakingId, setSpeakingId] = useState(null)
  const isSupported = isVoiceOutputSupported()
  const queueRef = useRef(null) // holds { text, id, onEnd } while we wait for voices/engine to be ready
  const retriedRef = useRef(false)

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }, [isSupported])

  const speak = useCallback((text, id, { onEnd } = {}) => {
    if (!isSupported) { onEnd?.(); return }
    const clean = toSpeakableText(text)
    if (!clean) { onEnd?.(); return }

    // Chrome/Edge sometimes leave the synthesis engine in a "paused" or
    // stuck state after rapid cancel()->speak() cycles (common in a
    // back-and-forth voice conversation). Resuming defensively before every
    // utterance avoids the classic "works the first time, silent after" bug.
    window.speechSynthesis.cancel()
    window.speechSynthesis.resume()

    const utter = new SpeechSynthesisUtterance(clean)
    utter.rate = 1
    utter.pitch = 1
    utter.volume = 1
    utter.lang = 'en-US'
    const voice = pickVoice('en-US')
    if (voice) utter.voice = voice

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      setSpeakingId(null)
      onEnd?.()
    }
    utter.onend = finish
    utter.onerror = finish

    // Some browsers (notably Chrome) silently drop an utterance queued
    // immediately after cancel(); a micro-delay before speak() makes the
    // cancel take effect first and fixes "no sound" in that case.
    setTimeout(() => {
      try {
        setSpeakingId(id)
        window.speechSynthesis.speak(utter)
        // Safety net: if the browser never fires onend/onerror (happens
        // occasionally on tab-switch or long silences), don't leave the UI
        // stuck in "speaking" forever.
        const watchdog = setInterval(() => {
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            clearInterval(watchdog)
            finish()
          }
        }, 400)
      } catch {
        finish()
      }
    }, 40)
  }, [isSupported])

  useEffect(() => () => { if (isSupported) window.speechSynthesis.cancel() }, [isSupported])

  return { isSupported, speakingId, speak, stop }
}
