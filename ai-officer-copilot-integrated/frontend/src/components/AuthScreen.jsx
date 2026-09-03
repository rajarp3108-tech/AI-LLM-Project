import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { GoogleIcon, MicrosoftIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from './Icons.jsx'

export default function AuthScreen() {
  const { login, register, loginWithProvider } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)     // 'email' submit
  const [providerLoading, setProviderLoading] = useState('') // 'google' | 'microsoft'

  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' })

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password })
      } else {
        await register(form)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleProvider = async (provider) => {
    setError('')
    setProviderLoading(provider)
    try {
      await loginWithProvider(provider)
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.')
    } finally {
      setProviderLoading('')
    }
  }

  const anyLoading = loading || !!providerLoading

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="auth-brand-overlay">
          <img src="/assets/emblem.svg" alt="" className="auth-emblem" width="52" height="52" />
          <p className="auth-brand-eyebrow">Your AI-powered workspace</p>
          <h1>AI Copilot</h1>
          <p className="auth-brand-copy">
            Draft documents, summarize reports, answer questions, and
            track pending tasks — grounded in your own uploaded files, for any topic or workflow.
          </p>
          <ul className="auth-brand-list">
            <li>Secure, private workspace access</li>
            <li>Every reply traceable to a source file</li>
            <li>Built for any team, role, or use case</li>
          </ul>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab${mode === 'login' ? ' active' : ''}`}
              onClick={() => { setMode('login'); setError('') }}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`auth-tab${mode === 'register' ? ' active' : ''}`}
              onClick={() => { setMode('register'); setError('') }}
              type="button"
            >
              Create account
            </button>
          </div>

          <h2 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Register for access'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Sign in with your email or an approved identity provider.'
              : 'Set up your account to start using the copilot.'}
          </p>

          <div className="auth-providers">
            <button
              type="button"
              className="provider-btn"
              onClick={() => handleProvider('google')}
              disabled={anyLoading}
            >
              {providerLoading === 'google' ? <SpinnerIcon /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              type="button"
              className="provider-btn"
              onClick={() => handleProvider('microsoft')}
              disabled={anyLoading}
            >
              {providerLoading === 'microsoft' ? <SpinnerIcon /> : <MicrosoftIcon />}
              Continue with Microsoft
            </button>
          </div>

          <div className="auth-divider"><span>or continue with email</span></div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="field-group">
                <label htmlFor="name">Full name</label>
                <input
                  id="name" type="text" placeholder="Jane Smith"
                  value={form.name} onChange={update('name')} required
                />
              </div>
            )}

            <div className="field-group">
              <label htmlFor="email">Work email</label>
              <input
                id="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={update('email')} required
              />
            </div>

            {mode === 'register' && (
              <div className="field-group">
                <label htmlFor="role">Role (optional)</label>
                <input
                  id="role" type="text" placeholder="e.g. Product Manager, Teacher, Analyst"
                  value={form.role} onChange={update('role')}
                />
              </div>
            )}

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className="pw-wrap">
                <input
                  id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={update('password')} required minLength={6}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password visibility">
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={anyLoading}>
              {loading ? <SpinnerIcon /> : null}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? (
              <>Don't have an account? <button type="button" onClick={() => setMode('register')}>Create one</button></>
            ) : (
              <>Already registered? <button type="button" onClick={() => setMode('login')}>Sign in</button></>
            )}
          </p>

          <p className="auth-fineprint">Local development build — email/password sign-in is handled by the connected backend. Configure production identity providers before deployment.</p>
        </div>
      </div>
    </div>
  )
}
