import { MenuIcon, LogoutIcon } from './Icons.jsx'

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Letterhead({ onMenuClick, user, onLogout, online }) {
  return (
    <header className="letterhead">
      <div className="letterhead-inner">
        <button className="menu-btn icon-btn" aria-label="Toggle menu" onClick={onMenuClick}>
          <MenuIcon />
        </button>
        <img src="/assets/emblem.svg" alt="AI Copilot emblem" className="emblem" width="40" height="40" />
        <div>
          <p className="letterhead-title">AI Copilot</p>
          <p className="letterhead-sub">Your intelligent workspace assistant</p>
        </div>
        <div className="letterhead-meta">
          <div className="field"><span>Dated</span>{todayLabel()}</div>
          <div className={`status-pill${online ? '' : ' offline'}`}><span className="dot"></span> {online ? 'Assistant Online' : 'Connecting…'}</div>
          {user && (
            <div className="user-chip">
              <span className="avatar-sm">{user.initials}</span>
              <span className="name">{user.name}</span>
              <button className="logout-btn" onClick={onLogout} aria-label="Sign out" title="Sign out">
                <LogoutIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
