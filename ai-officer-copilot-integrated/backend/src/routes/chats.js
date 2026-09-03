import { Router } from 'express';
import { load, save, uid, now } from '../db/store.js';
const r = Router();

r.get('/', (req, res) => {
  const db = load();
  const chats = db.chats.filter(c => c.userId === req.user.id).sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''));
  res.json({ chats });
});

r.post('/', (req, res) => {
  const db = load();
  const title = String(req.body?.title || 'New Chat').trim().slice(0, 100) || 'New Chat';
  const chat = { id: uid(), userId: req.user.id, title, createdAt: now(), updatedAt: now() };
  db.chats.push(chat); save(db); res.status(201).json(chat);
});

r.get('/:id/messages', (req, res) => {
  const db = load();
  const chat = db.chats.find(c => c.id === req.params.id && c.userId === req.user.id);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  res.json({ chat, messages: db.messages.filter(m => m.chatId === chat.id).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)) });
});

r.patch('/:id', (req, res) => {
  const db = load(); const chat = db.chats.find(c => c.id === req.params.id && c.userId === req.user.id);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (req.body?.title) chat.title = String(req.body.title).trim().slice(0,100) || chat.title;
  chat.updatedAt = now(); save(db); res.json(chat);
});

r.delete('/:id', (req, res) => {
  const db = load(); const chat = db.chats.find(c => c.id === req.params.id && c.userId === req.user.id);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  db.chats = db.chats.filter(c => c.id !== chat.id);
  db.messages = db.messages.filter(m => m.chatId !== chat.id);
  db.documents = db.documents.filter(d => d.chatId !== chat.id);
  db.tasks = db.tasks.filter(t => t.chatId !== chat.id);
  save(db); res.json({ ok: true });
});

export default r;
