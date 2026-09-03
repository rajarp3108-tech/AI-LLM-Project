# AI Copilot — Multi-topic RAG Workspace

A React/Vite + Express/Socket.IO workspace with a professional AI Copilot interface, built for any-topic conversations — not tied to any single domain.

## Features
- Start and store separate chats/topics.
- Reopen saved chat history later.
- Ask general questions without uploading anything when an LLM is configured.
- Optional chat-specific RAG sources.
- Optional reusable RAG sources available to all chats.
- Per-topic tasks with deadlines and completion state.
- Streaming responses over Socket.IO WebSockets.
- Email/password JWT authentication.
- Rename and delete chats.
- Voice assistant: speak your message instead of typing (speech-to-text), and have any AI reply read back aloud (text-to-speech). Runs entirely in the browser via the Web Speech API — no extra backend setup or API key required. See "Voice assistant" below for browser support notes.

## Voice assistant
A full-screen, hands-free voice mode (in the spirit of Gemini Live / ChatGPT voice mode), implemented with the browser-native Web Speech API in `frontend/src/hooks/useVoice.js` and `frontend/src/components/VoiceMode.jsx`. No server or API key is required for the voice layer itself.
- **Launch:** tap the mic icon in the composer to open the full-screen voice overlay.
- **The orb:** a single large animated orb is the entire interface — it visibly changes between four states so you always know what's happening: **idle** (gentle breathing, waiting for you to tap), **listening** (pulsing brass rings, actively transcribing), **thinking** (fast amber pulse while the reply is generated), **speaking** (slow warm wave synced to the reply being read aloud).
- **Hands-free loop:** voice mode auto-starts listening on open. When you pause, it sends what you said, shows "Thinking…", then automatically speaks the reply aloud and starts listening again — no button presses needed between turns. Tap the orb any time to mute/resume, or tap again while it's speaking to interrupt.
- Live interim transcript and the last thing you said/heard are shown as captions under the orb; press **Esc** or the **×** to exit back to the normal chat, where the full text conversation is already saved.
- **Browser support:** speech-to-text needs `SpeechRecognition`/`webkitSpeechRecognition` (Chrome, Edge, Safari — not currently supported in Firefox desktop); the mic button is disabled with an explanatory tooltip where unsupported. Text-to-speech needs `speechSynthesis`, supported in effectively all modern browsers.
- No audio ever leaves the browser; voice mode reuses the same chat/socket pipeline as typed messages, so it doesn't change how `LLM_API_URL`/`LLM_API_KEY` are used on the backend.

## Backend
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```
Backend: `http://localhost:4000`

## Frontend
In a second terminal:
```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```
Frontend: `http://localhost:5173`

## Connecting a real AI model
Set these three values in `backend/.env`. Both **native Anthropic (Claude)** and **OpenAI-compatible** chat-completions endpoints are supported automatically — detected from the URL / model name, no extra config needed:

```env
# Anthropic (native)
LLM_API_URL=https://api.anthropic.com/v1/messages
LLM_MODEL=claude-sonnet-4-5-20250929
LLM_API_KEY=sk-ant-...

# or OpenAI
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o
LLM_API_KEY=sk-...
```

Without a key configured, the app still runs (chats, tasks, uploads, auth all work) but answers fall back to raw extracted text instead of full AI analysis — configure the key above for real, in-depth responses.

## Document analysis quality
Uploads are optional. When relevant files exist:
- For everyday questions, the backend retrieves the most relevant passages (RAG) and passes them to the model as workspace context.
- For requests like "summarize this document / form", "analyze this", "explain this file", etc., the backend automatically switches to **full-document mode** — it sends the *entire* extracted text of the relevant document(s) to the model (not just a few short snippets), so nothing in a form, contract, report, or long document gets skipped. The system prompt instructs the model to produce a field-by-field, section-by-section professional analysis rather than a one-paragraph summary.
