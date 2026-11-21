import { useState } from 'react'
import type { FormEvent } from 'react'
import './login.css'

type LoginPageProps = {
  onLogin: (email: string, name: string) => void
}

type LoginUser = {
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

const DEMO_EMAIL = 'admin@sales.com'
const DEMO_PASSWORD = 'admin123'

function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const isDemoAccount =
        normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD

      let matchedUser: LoginUser | undefined

      if (!isDemoAccount) {
        const response = await fetch('/api/v1/users')
        if (!response.ok) throw new Error('Could not verify the account')
        const users = await response.json() as LoginUser[]
        matchedUser = users.find(
          (user) => user.email.toLowerCase() === normalizedEmail,
        )
        if (!matchedUser) throw new Error('No account found with that email.')
        if (matchedUser.status !== 'ACTIVE') {
          throw new Error('This account is inactive or suspended.')
        }
      }

      onLogin(normalizedEmail, matchedUser?.name || 'Administrator')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Sales application">
        <div className="brand-mark" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="brand-name">SALES<span>APP</span></p>
        <div className="brand-copy">
          <p>MANAGEMENT SUITE</p>
          <h1>Manage every sale.<br />One clear view.</h1>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-heading">
            <p>WELCOME BACK</p>
            <h2>Sign in</h2>
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="show-password"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <div className="login-options">
            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>
            <button type="button" className="forgot-button">Forgot password?</button>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <button type="button" className="demo-button" onClick={fillDemoAccount}>
            Use demo account
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
