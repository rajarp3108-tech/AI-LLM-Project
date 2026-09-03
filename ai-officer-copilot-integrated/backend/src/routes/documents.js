import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { PDFParse } from 'pdf-parse'
import { load, save, uid, now } from '../db/store.js'

const upload = multer({ dest: 'uploads/', limits: { fileSize: 15 * 1024 * 1024 } })
const r = Router()

async function extractText(file) {
  const ext = path.extname(file.originalname || '').toLowerCase()
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    const parser = new PDFParse({ data: fs.readFileSync(file.path) })
    try {
      const result = await parser.getText()
      return result.text || ''
    } finally {
      await parser.destroy()
    }
  }
  if (file.mimetype === 'text/plain' || ext === '.txt' || ext === '.md') {
    return fs.readFileSync(file.path, 'utf8')
  }
  throw new Error('Unsupported file type. Upload PDF, TXT or MD.')
}

r.get('/', (req, res) => {
  const db = load()
  res.json({ documents: db.documents.filter((d) => d.userId === req.user.id).map(({ text, ...d }) => d) })
})

r.post('/', upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'document is required' })
  let text = ''
  try {
    text = await extractText(req.file)
    if (!text.trim()) return res.status(400).json({ message: 'No readable text found in document' })
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Could not read this document type' })
  } finally {
    try { fs.unlinkSync(req.file.path) } catch {}
  }

  const scope = req.body?.scope === 'global' ? 'global' : 'chat'
  const chatId = scope === 'global' ? null : req.body?.chatId || null
  if (scope === 'chat' && !chatId) return res.status(400).json({ message: 'chatId is required for chat-specific sources' })

  const db = load()
  const d = { id: uid(), userId: req.user.id, chatId, scope, name: req.file.originalname, text, uploadedAt: now() }
  db.documents.push(d)
  save(db)
  res.status(201).json({ id: d.id, name: d.name, scope: d.scope, chatId: d.chatId, chunks: Math.max(1, Math.ceil(text.length / 840)) })
})

r.delete('/:id', (req, res) => {
  const db = load()
  const d = db.documents.find((x) => x.id === req.params.id && x.userId === req.user.id)
  if (!d) return res.status(404).json({ message: 'Document not found' })
  db.documents = db.documents.filter((x) => x.id !== d.id)
  save(db)
  res.json({ ok: true })
})

export default r
