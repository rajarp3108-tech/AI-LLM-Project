export default function ChatHero({ chat }) {
  return (
    <div className="chat-hero">
      <p className="chat-hero-eyebrow">Workspace topic — {chat?.title || 'Start a new chat'}</p>
      <h1>{chat?.title || 'How can I assist with today’s work?'}</h1>
      <p>
        Ask about any topic without uploading a file. Add PDFs, TXT or Markdown when you want RAG-grounded answers;
        chat history, sources and tasks stay saved with the topic.
      </p>
    </div>
  )
}
