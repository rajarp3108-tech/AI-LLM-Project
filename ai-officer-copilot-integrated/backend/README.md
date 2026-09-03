# Backend

Express + Socket.IO backend for persistent chats, messages, optional RAG documents and per-chat tasks.

## Run
```bash
cp .env.example .env
npm install
npm run dev
```

## Important routes
- `GET/POST /api/chats`
- `GET /api/chats/:id/messages`
- `PATCH/DELETE /api/chats/:id`
- `POST /api/chat`
- `GET/POST/DELETE /api/documents`
- `GET/POST/PATCH/DELETE /api/tasks`
- Socket events: `chat:message`, `chat:start`, `chat:token`, `chat:done`, `chat:error`
