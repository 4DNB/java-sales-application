import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import ProductsPage from './modules/products/ProductsPage'
import './App.css'

type User = {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'CUSTOMER' | 'SELLER' | 'MANAGER'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

const apiUrl = '/api/v1/users'

const emptyForm = {
  name: '',
  email: '',
  role: 'CUSTOMER' as User['role'],
  status: 'ACTIVE' as User['status'],
}

function App() {
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
      if (!response.ok) throw new Error('Could not load users')
      setUsers(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch(apiUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load users')
        setUsers(await response.json())
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Could not load users')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

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
        throw new Error(body?.message || 'Could not save user')
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save user')
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
      if (!response.ok) throw new Error('Could not delete user')
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete user')
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">Sales application</p>
          <h1>{activeModule === 'users' ? 'User management' : 'Product management'}</h1>
        </div>
        {activeModule === 'users' && <span className="count">{users.length} users</span>}
      </header>

      <nav className="module-nav" aria-label="Application modules">
        <button
          type="button"
          className={activeModule === 'users' ? 'module-tab active' : 'module-tab'}
          aria-pressed={activeModule === 'users'}
          onClick={() => setActiveModule('users')}
        >
          Users
        </button>
        <button
          type="button"
          className={activeModule === 'products' ? 'module-tab active' : 'module-tab'}
          aria-pressed={activeModule === 'products'}
          onClick={() => setActiveModule('products')}
        >
          Products
        </button>
      </nav>

      {activeModule === 'users' ? <section className="layout">
        <aside className="panel form-panel">
          <h2>{editingId ? 'Edit user' : 'New user'}</h2>
          <form onSubmit={submit}>
            <label>Name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} maxLength={100} />
            </label>
            <label>Email
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
            <label>Role
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as User['role'] })}>
                <option value="CUSTOMER">Customer</option>
                <option value="SELLER">Seller</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            {editingId && (
              <label>Status
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as User['status'] })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </label>
            )}
            <div className="actions">
              <button type="submit" className="primary">{editingId ? 'Update user' : 'Create user'}</button>
              {editingId && (
                <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancel</button>
              )}
            </div>
          </form>
        </aside>

        <section className="panel table-panel">
          <div className="table-heading">
            <h2>Users</h2>
            <button type="button" className="secondary" onClick={() => void loadUsers()}>Refresh</button>
          </div>
          {error && <div className="error">{error}</div>}
          {loading ? (
            <p className="empty">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="empty">No users yet. Create the first one.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.name}</strong></td>
                      <td>{user.email}</td>
                      <td><span className="badge">{user.role}</span></td>
                      <td><span className={`status ${user.status.toLowerCase()}`}>{user.status}</span></td>
                      <td className="row-actions">
                        <button type="button" onClick={() => editUser(user)}>Edit</button>
                        <button type="button" className="danger" onClick={() => void deleteUser(user.id)}>Delete</button>
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
