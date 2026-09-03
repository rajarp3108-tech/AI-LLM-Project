<div align="center">

# 🧠 AI Officer Copilot

### Intelligent Workspace Assistant & Enterprise RAG Platform

A full-stack AI workspace platform featuring Retrieval-Augmented Generation (RAG), document parsing, automated task tracking, and interactive real-time voice operations.

</div>

---

## 📋 Overview

**AI Officer Copilot** is a modern, role-based workspace assistant designed to streamline enterprise workflows. It combines grounded document intelligence with automated quick actions—allowing users to upload reference files, query complex multi-source knowledge bases, generate meeting notes, and interact seamlessly via a real-time voice interface.

## ✨ Features

- 🔐 **Secure Workspace Auth** — authenticated login portals with protected routing and session management
- 📄 **Grounded RAG Engine** — ingest PDF, TXT, and Markdown documents to restrict LLM responses strictly to verified sources
- 🎙️ **Interactive Voice Mode** — real-time speech interaction featuring a live visual waveform orb and instant transcript rendering
- ⚡ **Automated Quick Actions** — one-click workflows for professional document drafting, file summarization, and meeting minutes
- 📋 **Topic Task Tracking** — embedded task management panel to monitor progress and action items per topic
- 🗂️ **Dual Knowledge Scope** — organize reference documents under "This chat" for localized context or save them as reusable global assets
- 🔄 **Real-Time Synchronization** — WebSocket-powered backend connectivity for live status updates and responsive UI interactions
- 📊 **Workspace Dashboard** — sleek dark-mode UI with topic metrics, source counts, and activity logs

## 🖥️ Screenshots

### Login Portal
![Login Portal](Screenshot%202026-08-17%20134814.png)

### Start New Chat
![Start New Chat](Screenshot%202026-08-17%20134848.png)

### Conversation View
![Conversation View](Screenshot%202026-08-17%20134909.png)

### Knowledge Sources Panel
![Knowledge Sources Panel](Screenshot%202026-08-17%20134925.png)

### Workspace Dashboard & RAG Chat
![Dashboard](Screenshot%202026-08-17%20134945.png)

### Voice Interaction Mode
![Voice Mode](Screenshot%202026-08-17%20135000.png)

### Topic Media Explanation
![Topic Media Explanation](Screenshot%202026-08-17%20135018.png)

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS / Custom Dark UI |
| State Management | React Context API |
| Real-Time Communication | WebSockets |
| Backend | Node.js, Express.js |
| Document Processing | `pdf-parse`, `@napi-rs/canvas` |
| Security / Auth | JWT, bcrypt |

## 🚀 Getting Started

### Project Structure
```bash
ai-officer-copilot-integrated/
├── backend/                      # Node.js + Express REST & WebSocket API
│   ├── generated/                # Output directory for compiled documents
│   ├── node_modules/             # Dependencies (pdf-parse, bcrypt, canvas)
│   ├── .env                      # Local environment configuration
│   ├── .env.example              # Environment variable template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                 # Main Express & WebSocket entry point
├── frontend/                     # React + Vite client application
│   ├── public/
│   ├── src/
│   ├── .gitignore
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── README                        # Project documentation
├── Screenshot 2026-08-17 134814.png
├── Screenshot 2026-08-17 134848.png
├── Screenshot 2026-08-17 134909.png
├── Screenshot 2026-08-17 134925.png
├── Screenshot 2026-08-17 134945.png
├── Screenshot 2026-08-17 135000.png
└── Screenshot 2026-08-17 135018.png
