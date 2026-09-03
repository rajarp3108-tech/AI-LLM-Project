const base = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

export const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export const LetterIcon = () => (
  <svg viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M4 4h16v16H4z" /><path d="M4 7l8 6 8-6" />
  </svg>
)

export const SummaryIcon = () => (
  <svg viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
  </svg>
)

export const MinutesIcon = () => (
  <svg viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="14" x2="13" y2="14" /><line x1="8" y1="17" x2="11" y2="17" />
  </svg>
)

export const PendingIcon = () => (
  <svg viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
  </svg>
)

export const SearchIcon = () => (
  <svg viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.6" y2="16.6" />
  </svg>
)

export const SealIcon = () => (
  <svg viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="2">
    <path d="M12 2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 15l-5.2 2.8 1-5.8L3.6 8.1l5.8-.8z" />
  </svg>
)

export const AttachIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 015 5l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.48" />
  </svg>
)

export const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="19" x2="12" y2="22" />
  </svg>
)

export const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base} stroke="white" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

export const SpeakerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <polygon points="4 9 8 9 12 5 12 19 8 15 4 15 4 9" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
)

export const SpeakerMuteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <polygon points="4 9 8 9 12 5 12 19 8 15 4 15 4 9" />
    <line x1="16" y1="9" x2="21" y2="14" />
    <line x1="21" y1="9" x2="16" y2="14" />
  </svg>
)

export const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
  </svg>
)

export const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9C16.66 14.2 17.64 11.9 17.64 9.2z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 009 18z"/>
    <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.16.27-1.7V4.97H.98A9 9 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/>
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
  </svg>
)

export const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <rect x="1" y="1" width="7.5" height="7.5" fill="#F35325"/>
    <rect x="9.5" y="1" width="7.5" height="7.5" fill="#81BC06"/>
    <rect x="1" y="9.5" width="7.5" height="7.5" fill="#05A6F0"/>
    <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFBA08"/>
  </svg>
)

export const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M17.94 17.94A10.94 10.94 0 0112 19.5C5 19.5 1 12 1 12a20.3 20.3 0 015.06-5.94M9.9 4.24A10.6 10.6 0 0112 4.5c7 0 11 7.5 11 7.5a20.3 20.3 0 01-3.22 4.36M14.12 14.12a3 3 0 10-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
  </svg>
)

export const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3v12" /><polyline points="7 11 12 16 17 11" /><path d="M5 21h14" />
  </svg>
)

export const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.6">
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </svg>
)

export const ChatBubbleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
)

export const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" /><polyline points="8 12.5 10.8 15 16 9.5" />
  </svg>
)

export const DatabaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} stroke="currentColor" strokeWidth="1.8">
    <ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
  </svg>
)

export const SpinnerIcon = () => (
  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" opacity="0.25" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)
