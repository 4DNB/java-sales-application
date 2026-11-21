import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import ProductsPage from './modules/products/ProductsPage'
import LoginPage from './modules/auth/LoginPage'
import RegisterPage from './modules/auth/RegisterPage'
import LandingPage from './modules/landing/LandingPage'
import './App.css'

type User = {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'CUSTOMER' | 'SELLER' | 'MANAGER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

type Session = {
  email: string
  name: string
  role: User['role']
}

const apiUrl = '/api/v1/users'

const emptyForm = {
  name: '',
  email: '',
  role: 'CUSTOMER' as User['role'],
  status: 'ACTIVE' as User['status'],
}

function App() {
  const [publicView, setPublicView] = useState<'landing' | 'login' | 'register' | 'management'>('landing')
  const [currentUser, setCurrentUser] = useState<Session | null>(() => {
    const storedSession = localStorage.getItem('sales-app-session')
    if (!storedSession) return null
    try {
      const session = JSON.parse(storedSession) as Partial<Session>
      if (typeof session.email !== 'string' || typeof session.name !== 'string') return null
      const roles: User['role'][] = ['ADMIN', 'CUSTOMER', 'SELLER', 'MANAGER']
      return {
        email: session.email,
        name: session.name,
        role: roles.includes(session.role as User['role']) ? session.role as User['role'] : 'CUSTOMER',
      }
    } catch {
      localStorage.removeItem('sales-app-session')
      return null
    }
  })
  const [activeModule, setActiveModule] = useState<'users' | 'products'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error('No se pudieron cargar los usuarios')
      setUsers(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!currentUser || currentUser.role === 'CUSTOMER' || publicView !== 'management') {
      return
    }

    const controller = new AbortController()
    fetch(apiUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudieron cargar los usuarios')
        setUsers(await response.json())
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [currentUser, publicView])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch(editingId ? `${apiUrl}/${editingId}` : apiUrl, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'No se pudo guardar el usuario')
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario')
    }
  }

  const editUser = (user: User) => {
    setEditingId(user.id)
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status })
  }

  const deleteUser = async (id: number) => {
    setError('')
    try {
      const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('No se pudo eliminar el usuario')
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario')
    }
  }

  const login = (email: string, name: string, role: User['role']) => {
    const session = { email, name, role }
    localStorage.setItem('sales-app-session', JSON.stringify(session))
    setCurrentUser(session)
    setPublicView('landing')
  }

  const logout = () => {
    localStorage.removeItem('sales-app-session')
    setCurrentUser(null)
    setPublicView('landing')
  }

  if (!currentUser) {
    if (publicView === 'login') {
      return <LoginPage onLogin={login} onBack={() => setPublicView('landing')} onRegister={() => setPublicView('register')} />
    }
    if (publicView === 'register') {
      return <RegisterPage onRegister={() => setPublicView('landing')} onBack={() => setPublicView('landing')} onLogin={() => setPublicView('login')} />
    }
    return <LandingPage onLogin={() => setPublicView('login')} onRegister={() => setPublicView('register')} />
  }

  if (publicView === 'landing' || currentUser.role === 'CUSTOMER') {
    return (
      <LandingPage
        onLogin={() => setPublicView('login')}
        onRegister={() => setPublicView('register')}
        currentUser={currentUser}
        onManage={currentUser.role === 'CUSTOMER' ? undefined : () => setPublicView('management')}
        onLogout={logout}
      />
    )
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Aplicación de ventas</p>
          <h1>{activeModule === 'users' ? 'Gestión de usuarios' : 'Gestión de productos'}</h1>
        </div>
        <div className="header-actions">
          {activeModule === 'users' && <span className="count">{users.length} usuarios</span>}
          <button type="button" className="logout-button" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <nav className="module-nav" aria-label="Módulos de la aplicación">
        <button
          type="button"
          className={activeModule === 'users' ? 'module-tab active' : 'module-tab'}
          aria-pressed={activeModule === 'users'}
          onClick={() => setActiveModule('users')}
        >
          Usuarios
        </button>
        <button
          type="button"
          className={activeModule === 'products' ? 'module-tab active' : 'module-tab'}
          aria-pressed={activeModule === 'products'}
          onClick={() => setActiveModule('products')}
        >
          Productos
        </button>
      </nav>

      {activeModule === 'users' ? <section className="layout">
        <aside className="panel form-panel">
          <h2>{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <form onSubmit={submit}>
            <label>Nombre
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} maxLength={100} />
            </label>
            <label>Correo electrónico
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
            <label>Rol
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as User['role'] })}>
                <option value="CUSTOMER">Cliente</option>
                <option value="SELLER">Vendedor</option>
                <option value="MANAGER">Gerente</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            {editingId && (
              <label>Estado
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as User['status'] })}>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                  <option value="SUSPENDED">Suspendido</option>
                </select>
              </label>
            )}
            <div className="actions">
              <button type="submit" className="primary">{editingId ? 'Actualizar usuario' : 'Crear usuario'}</button>
              {editingId && (
                <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancelar</button>
              )}
            </div>
          </form>
        </aside>

        <section className="panel table-panel">
          <div className="table-heading">
            <h2>Usuarios</h2>
            <button type="button" className="secondary" onClick={() => void loadUsers()}>Actualizar</button>
          </div>
          {error && <div className="error">{error}</div>}
          {loading ? (
            <p className="empty">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="empty">Aún no hay usuarios. Crea el primero.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Nombre</th><th>Correo electrónico</th><th>Rol</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.name}</strong></td>
                      <td>{user.email}</td>
                      <td><span className="badge">{{ ADMIN: 'Administrador', CUSTOMER: 'Cliente', SELLER: 'Vendedor', MANAGER: 'Gerente' }[user.role]}</span></td>
                      <td><span className={`status ${user.status.toLowerCase()}`}>{({ ACTIVE: 'Activo', INACTIVE: 'Inactivo', SUSPENDED: 'Suspendido' } as const)[user.status]}</span></td>
                      <td className="row-actions">
                        <button type="button" onClick={() => editUser(user)}>Editar</button>
                        <button type="button" className="danger" onClick={() => void deleteUser(user.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section> : <ProductsPage />}
    </main>
  )
}

export default App
