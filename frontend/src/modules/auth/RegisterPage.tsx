import { useState } from 'react'
import type { FormEvent } from 'react'
import './login.css'

type RegisterPageProps = {
  onRegister: () => void
  onBack: () => void
  onLogin: () => void
}

function RegisterPage({ onRegister, onBack, onLogin }: RegisterPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe contener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, role: 'CUSTOMER' }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || body?.details?.[0] || 'No se pudo crear la cuenta')
      }
      onRegister()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Aplicación de ventas">
        <div className="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <p className="brand-name">VENTAS<span>APP</span></p>
        <div className="brand-copy">
          <p>ÚNETE A NOSOTROS</p>
          <h1>Crea tu cuenta.<br />Empieza a comprar.</h1>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <button type="button" className="back-to-store" onClick={onBack}>← Volver a la tienda</button>
          <div className="login-heading">
            <p>NUEVA CUENTA</p>
            <h2>Registrarse</h2>
          </div>
          {error && <div className="login-error" role="alert">{error}</div>}

          <label>
            Nombre completo
            <input type="text" value={name} onChange={(event) => setName(event.target.value)}
              placeholder="Tu nombre" autoComplete="name" minLength={2} maxLength={100} required />
          </label>
          <label>
            Correo electrónico
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@empresa.com" autoComplete="email" required />
          </label>
          <label>
            Contraseña
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Crea una contraseña" autoComplete="new-password" minLength={6} required />
              <button type="button" className="show-password"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>
          <label>
            Confirmar contraseña
            <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite la contraseña" autoComplete="new-password" minLength={6} required />
          </label>
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <button type="button" className="demo-button" onClick={onLogin}>
            Ya tengo una cuenta
          </button>
        </form>
      </section>
    </main>
  )
}

export default RegisterPage
