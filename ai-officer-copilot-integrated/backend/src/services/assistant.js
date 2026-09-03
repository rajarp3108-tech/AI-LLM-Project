import { generatePdf } from './pdfGenerator.js';
import { load, save, uid, now } from '../db/store.js';

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

function words(text) { return String(text || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []; }

function chunks(text, size = 1400, overlap = 200) {
  const out = [];
  for (let i = 0; i < text.length; i += Math.max(1, size - overlap)) out.push(text.slice(i, i + size));
  return out;
}

function score(query, text) {
  const q = [...new Set(words(query))];
  if (!q.length) return 0;
  const lower = String(text || '').toLowerCase();
  return q.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0) / q.length;
}

// Rough token estimate so we know how much raw document text we can safely
// stuff into the model's context window without truncation.
function estTokens(str) { return Math.ceil(String(str || '').length / 3.6); }

const MAX_CONTEXT_TOKENS = 90000; // generous budget for full-document analysis

// ---------------------------------------------------------------------------
// Retrieval — for everyday questions we do lightweight keyword-ranked
// retrieval across chunks. But for "analyze / summarize / explain this
// document / form" style requests we deliberately widen this to include
// the FULL text of every relevant document (up to the token budget) instead
// of a handful of short snippets, so nothing in a long form or document gets
// skipped over.
// ---------------------------------------------------------------------------

const FULL_DOC_INTENT_RE = /\b(summar(y|ise|ize)|analy[sz]e|explain|review|go through|walk me through|extract|breakdown|break down|details? (of|in|about)|what does (this|it) (say|mean|contain)|everything (in|about)|full (summary|detail|analysis)|comprehensive|overview of (this|the) (doc|document|form|file|pdf)|read (this|the) (doc|document|form|file|pdf))\b/i;

function wantsFullDocumentCoverage(message, hasDocs) {
  return hasDocs && FULL_DOC_INTENT_RE.test(message);
}

export function retrieveContext(message, chatId, userId) {
  const db = load();
  const docs = db.documents.filter(d => d.userId === userId && (d.chatId === chatId || d.scope === 'global'));
  if (!docs.length) return [];

  if (wantsFullDocumentCoverage(message, true)) {
    // Include full text of every applicable document, largest-relevance first,
    // trimmed only if the combined budget is exceeded.
    const ranked = [...docs].sort((a, b) => score(message, b.text) - score(message, a.text));
    const out = [];
    let used = 0;
    for (const d of ranked) {
      const budgetLeft = MAX_CONTEXT_TOKENS - used;
      if (budgetLeft <= 500) break;
      const allowedChars = Math.floor(budgetLeft * 3.6);
      const text = d.text.length > allowedChars ? d.text.slice(0, allowedChars) : d.text;
      used += estTokens(text);
      out.push({ documentId: d.id, name: d.name, chunk: 'full', text, score: 1, full: true, truncated: text.length < d.text.length });
    }
    return out;
  }

  // Standard question — targeted retrieval across chunks, but with a larger
  // top-K and larger chunk size than before so answers have real substance.
  const hits = [];
  for (const d of docs) {
    for (const [i, c] of chunks(d.text).entries()) {
      const s = score(message, c);
      if (s > 0) hits.push({ documentId: d.id, name: d.name, chunk: i, text: c, score: s });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 8);
}

function recentHistory(db, chatId) {
  return db.messages.filter(m => m.chatId === chatId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-20);
}

// ---------------------------------------------------------------------------
// LLM call — supports both OpenAI-compatible chat-completions endpoints AND
// Anthropic's native Messages API (auto-detected from LLM_API_URL / model
// name so no extra config is required beyond the standard three env vars).
// ---------------------------------------------------------------------------

function isAnthropicEndpoint(url, model) {
  return /anthropic\.com/i.test(url || '') || /^claude-/i.test(model || '');
}

async function callConfiguredLLM({ message, history, context, chatTitle, fullDoc, userName }) {
  const url = process.env.LLM_API_URL;
  const key = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!url || !key || !model) return null;

  const contextBlock = context.length
    ? `\n\n---\nRETRIEVED WORKSPACE SOURCE MATERIAL (this is the authoritative content of the uploaded document(s); treat it as ground truth and do not omit information from it):\n${context.map((c, i) => `\n[Source ${i + 1}: "${c.name}"${c.full ? ' — FULL DOCUMENT TEXT' : ` — excerpt ${c.chunk}`}${c.truncated ? ', truncated due to length' : ''}]\n${c.text}`).join('\n')}\n---`
    : '';

  const nameLine = userName ? `\n\nThe person you are talking to is named "${userName}". Address them by their first name naturally where it reads well — for example, in greetings ("Hi ${userName.split(' ')[0]}, how can I help?") or when opening a fresh answer — but do not force it into every sentence.` : '';

  const isGreeting = !context.length && /^\s*(hi|hii+|hello|hey|hey there|yo|good\s*(morning|afternoon|evening)|namaste|greetings)[\s!.,]*$/i.test(message);

  const greetingLine = isGreeting
    ? `\n\nIMPORTANT — THIS MESSAGE IS JUST A GREETING (e.g. "hi", "hello"): reply with ONLY a short, single-sentence greeting and an offer to help (for example: "Hi${userName ? ' ' + userName.split(' ')[0] : ''}! How can I help you today?"). Do NOT add any extra paragraphs, explanations, capability lists, or follow-up context. Save the long, comprehensive answer style for when the user actually asks a real question or task.`
    : '';

  const system = `You are AI Copilot, a knowledgeable, precise, and professional AI assistant. You help with any topic or task the user brings — document analysis, research, writing, planning, coding, analysis, general questions, and everyday professional or personal work. Your job is to produce work a professional could rely on directly — precise, complete, well-organized, and free of vague generalities.

Current topic/chat: "${chatTitle || 'New Chat'}".${nameLine}${greetingLine}

CORE STANDARDS YOU MUST FOLLOW:
1. Be COMPREHENSIVE, not superficial — and default to writing LONG, THOROUGH answers. When asked to explain, summarize, or analyze an uploaded document, treat brevity as a failure mode: cover it thoroughly, section by section, do not skip any field, clause, number, date, name, condition, or requirement present in the source, and do not compress multiple distinct points into a single throwaway sentence. A one-paragraph or bullet-only summary is considered a failure for this use case — write full paragraphs of explanation under each heading, not just a list of fragments.
2. When source material is provided below, ground every factual claim in it. Organize your answer with headings appropriate to the document's actual content (for example: Purpose, Key Points/Fields, Conditions or Requirements, Dates/Deadlines, Parties Involved, Risks or Open Questions, Next Steps) — include only the sections genuinely relevant to the document at hand, and add others if it calls for them. Under each heading, explain in full sentences what it means and why it matters, not just what it says.
3. If the document is a form or structured document, extract it as a field list (Field name -> Value) in addition to narrative explanation, so it can be scanned quickly.
4. Distinguish clearly between what is stated in the source ("According to the source...") and any general knowledge or judgment you are adding ("For context...").
5. Never invent facts, figures, names or dates that are not present in the source. If something is illegible, ambiguous, or missing, say so explicitly rather than guessing.
6. Write in clear, professional English suited to the task — formal where the context calls for it, more conversational for casual questions. No filler, no hedging padding, no emojis unless the user's tone invites them. Depth and length should come from substance (more analysis, more sections, more specifics), never from padding, repetition, or generic filler sentences.
7. For general (non-document) questions on any topic, still give a thorough, well-developed answer with concrete specifics, examples, and multiple angles considered — not a one-line reply. Use headings/bullets where they aid clarity, but always accompany them with real explanatory prose.
8. Where helpful, proactively flag risks, inconsistencies, missing information, or follow-up actions the user should consider.
9. You are a general-purpose assistant, not limited to any one domain (e.g. not government-only) — adapt your framing and vocabulary naturally to whatever the user is working on: business, education, personal projects, technical work, creative writing, and so on.
10. Unless the user explicitly asks for something short (e.g. "in one sentence", "briefly", "just the answer") OR the message is just a greeting/small talk with no real question or task in it (e.g. "hi", "hello", "thanks", "ok"), assume they want the fullest, most useful version of the answer you can produce — err on the side of writing more, not less. Match your reply length to what was actually asked: a greeting gets a one-line greeting back, a real question or task gets the full, thorough treatment.${contextBlock}`;

  const messages = [...history.map(x => ({ role: x.role, content: x.text })), { role: 'user', content: message }];

  if (isAnthropicEndpoint(url, model)) {
    const body = {
      model,
      max_tokens: fullDoc ? 8192 : 4096,
      system,
      messages,
    };
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      throw new Error(`LLM request failed (${r.status}): ${errText.slice(0, 300)}`);
    }
    const d = await r.json();
    return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n') || null;
  }

  // OpenAI-compatible fallback
  const body = {
    model,
    messages: [{ role: 'system', content: system }, ...messages],
    temperature: 0.2,
    max_tokens: fullDoc ? 8192 : 4096,
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    throw new Error(`LLM request failed (${r.status}): ${errText.slice(0, 300)}`);
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || d.output_text || d.output?.[0]?.content?.[0]?.text || null;
}

// ---------------------------------------------------------------------------
// PDF-generation requests ("make a pdf about X", "create a pdf of this", etc.)
// ---------------------------------------------------------------------------

const PDF_REQUEST_RE = /\b(pdf|as a pdf|pdf file|pdf document)\b/i;

function isPdfRequest(message) {
  return PDF_REQUEST_RE.test(message);
}

function extractPdfTopic(message) {
  return message
    .replace(/\b(make|create|generate|build|prepare|write|draft)\b/gi, '')
    .replace(/\b(a|an|the)\b/gi, '')
    .replace(/\bpdf\b(\s+file|\s+document)?/gi, '')
    .replace(/\bfor me\b/gi, '')
    .replace(/\bcontaining\b/gi, '')
    .replace(/\b(information|info|details|data)\s+(for|about|on|regarding)\b/gi, '')
    .replace(/\b(information|info|details)\b/gi, '')
    .replace(/\b(for|about|on|regarding|of)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || 'Document';
}

async function handlePdfRequest(message, { chat, context, userId }) {
  const topic = extractPdfTopic(message);

  let docContent;
  try {
    docContent = await callConfiguredLLM({
      message: `Write clear, comprehensive, well-organized informational content suitable for a standalone official document about: ${topic}. Cover the subject thoroughly with concrete specifics, not generalities. Use plain paragraphs (no markdown symbols like # or **); short section headings on their own lines are fine where helpful.`,
      history: [],
      context,
      chatTitle: chat.title,
      fullDoc: true,
    });
  } catch (e) { console.error(e.message); }

  if (!docContent) {
    docContent = context.length
      ? context.map(c => c.text).join('\n\n')
      : `Configure LLM_API_URL, LLM_API_KEY and LLM_MODEL in backend/.env to generate full document content automatically. For now, here is a placeholder document about: ${topic}.`;
  }

  let file = null;
  try {
    file = await generatePdf({ title: topic, content: docContent });
  } catch (e) {
    console.error('PDF generation failed:', e.message);
  }

  const replyText = file
    ? `I've created a PDF titled "${topic}" — you can download it below.`
    : `I tried to generate a PDF but something went wrong on the server. Here's the content instead:\n\n${docContent}`;

  const db2 = load();
  const storedChat = db2.chats.find(c => c.id === chat.id);
  if (storedChat) storedChat.updatedAt = now();
  db2.messages.push({
    id: uid(), chatId: chat.id, userId, role: 'assistant',
    text: replyText, createdAt: now(), sources: [], file,
  });
  save(db2);

  return { reply: replyText, chatId: chat.id, chatTitle: storedChat?.title || chat.title, sources: [], file };
}

// ---------------------------------------------------------------------------
// Local fallback (used only when no LLM key is configured)
// ---------------------------------------------------------------------------

function localFallback(message, context, tasks, userName) {
  const first = userName ? userName.split(' ')[0] : '';
  const greet = first ? `Hi ${first}! ` : 'Hi! ';
  const m = message.toLowerCase();
  if (!context.length && /^\s*(hi|hii+|hello|hey|hey there|yo|good\s*(morning|afternoon|evening)|namaste|greetings)[\s!.,]*$/i.test(message)) {
    return `${greet}How can I help you today?`;
  }
  if (m.includes('pending') || m.includes('task')) {
    const active = tasks.filter(t => String(t.status).toLowerCase() !== 'done');
    return active.length
      ? `Current tasks:\n${active.map((t, i) => `${i + 1}. ${t.title}${t.deadline ? ` — ${t.deadline}` : ''} [${t.status}]`).join('\n')}`
      : 'There are no active tasks in this chat yet. You can add one from the Tasks panel.';
  }
  if (context.length) {
    const combined = context.map(c => c.text).join('\n\n');
    return `An LLM API key is not yet configured, so I can only show you the extracted source text rather than a full analytical summary.\n\nSource: "${context[0].name}"\n\n${combined.slice(0, 3000)}${combined.length > 3000 ? '\n\n[Content truncated — configure LLM_API_URL, LLM_API_KEY and LLM_MODEL in backend/.env for a complete, field-by-field analysis of the full document.]' : ''}`;
  }
  return `${greet}I'm your AI Copilot — I can help with document analysis, research, writing, planning, and general questions on any topic. This chat is saved and can be used for anything, no upload required. To get comprehensive, professional-grade answers and document analysis, configure LLM_API_URL, LLM_API_KEY and LLM_MODEL in backend/.env (both OpenAI-compatible and native Anthropic endpoints are supported automatically). You can still create chats, store topics, upload optional reference material, and manage tasks without an LLM key.`;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function answer(message, { chatId, userId = 'demo', userName = '' } = {}) {
  const db = load();
  let chat = db.chats.find(c => c.id === chatId && c.userId === userId);
  if (!chat) { chat = { id: chatId || uid(), userId, title: 'New Chat', createdAt: now(), updatedAt: now() }; db.chats.push(chat); }
  const existing = recentHistory(db, chat.id);
  const firstUser = existing.find(x => x.role === 'user');
  if (!firstUser && chat.title === 'New Chat') chat.title = message.trim().slice(0, 55) || 'New Chat';
  const userMsg = { id: uid(), chatId: chat.id, userId, role: 'user', text: message, createdAt: now() };
  db.messages.push(userMsg); chat.updatedAt = now(); save(db);

  const context = retrieveContext(message, chat.id, userId);
  const fullDoc = context.some(c => c.full);
  const tasks = load().tasks.filter(t => t.userId === userId && t.chatId === chat.id);
  if (isPdfRequest(message)) {
    return handlePdfRequest(message, { chat, context, userId });
  }
  let reply;
  try { reply = await callConfiguredLLM({ message, history: existing, context, chatTitle: chat.title, fullDoc, userName }); }
  catch (e) { console.error(e.message); }
  if (!reply) reply = localFallback(message, context, tasks, userName);

  const db2 = load(); const storedChat = db2.chats.find(c => c.id === chat.id); if (storedChat) storedChat.updatedAt = now();
  db2.messages.push({ id: uid(), chatId: chat.id, userId, role: 'assistant', text: reply, createdAt: now(), sources: context.map(x => ({ documentId: x.documentId, name: x.name, score: Number((x.score || 0).toFixed(2)) })) });
  save(db2);
  return { reply, chatId: chat.id, chatTitle: storedChat?.title || chat.title, sources: context.map(x => ({ name: x.name, score: Number((x.score || 0).toFixed(2)) })) };
}
