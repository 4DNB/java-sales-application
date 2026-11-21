import { useState } from 'react'
import type { FormEvent } from 'react'
import './login.css'

type LoginPageProps = {
  onLogin: (email: string, name: string, role: LoginUser['role']) => void
  onBack?: () => void
  onRegister?: () => void
}

type LoginUser = {
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  role: 'ADMIN' | 'CUSTOMER' | 'SELLER' | 'MANAGER'
}

const DEMO_EMAIL = 'admin@sales.com'
const DEMO_PASSWORD = 'admin123'

function LoginPage({ onLogin, onBack, onRegister }: LoginPageProps) {
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
      setError('La contraseña debe contener al menos 6 caracteres.')
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
        if (!response.ok) throw new Error('No se pudo verificar la cuenta')
        const users = await response.json() as LoginUser[]
        matchedUser = users.find(
          (user) => user.email.toLowerCase() === normalizedEmail,
        )
        if (!matchedUser) throw new Error('No se encontró ninguna cuenta con ese correo electrónico.')
        if (matchedUser.status !== 'ACTIVE') {
          throw new Error('Esta cuenta está inactiva o suspendida.')
        }
      }

      onLogin(normalizedEmail, matchedUser?.name || 'Administrador', matchedUser?.role || 'ADMIN')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
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
      <section className="login-brand" aria-label="Aplicación de ventas">
        <div className="brand-mark" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="brand-name">VENTAS<span>APP</span></p>
        <div className="brand-copy">
          <p>SUITE DE GESTIÓN</p>
          <h1>Gestiona cada venta.<br />Una vista clara.</h1>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          {onBack && (
            <button type="button" className="back-to-store" onClick={onBack}>
              ← Volver a la tienda
            </button>
          )}
          <div className="login-heading">
            <p>BIENVENIDO DE NUEVO</p>
            <h2>Iniciar sesión</h2>
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@empresa.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Contraseña
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Introduce tu contraseña"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="show-password"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
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
              Recordarme
            </label>
            <button type="button" className="forgot-button">¿Olvidaste tu contraseña?</button>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          <button type="button" className="demo-button" onClick={fillDemoAccount}>
            Usar cuenta de demostración
          </button>
          {onRegister && (
            <button type="button" className="register-link" onClick={onRegister}>
              ¿No tienes cuenta? <strong>Regístrate</strong>
            </button>
          )}
        </form>
      </section>
    </main>
  )
}

export default LoginPage
