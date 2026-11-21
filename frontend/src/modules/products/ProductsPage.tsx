import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { formatPenCurrency } from '../../utils/currency'
import './products.css'

type Product = {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

type ProductForm = {
  name: string
  description: string
  price: string
  stock: string
  imageUrl: string
}

const apiUrl = '/api/v1/products'

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
}

async function getErrorMessage(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string') {
    return body.detail
  }
  if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
    return body.message
  }
  return fallback
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error(await getErrorMessage(response, 'No se pudieron cargar los productos'))
      setProducts(await response.json() as Product[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch(apiUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await getErrorMessage(response, 'No se pudieron cargar los productos'))
        setProducts(await response.json() as Product[])
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(editingId ? `${apiUrl}/${editingId}` : apiUrl, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          price: Number(form.price),
          stock: Number(form.stock),
          imageUrl: form.imageUrl || null,
        }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, 'No se pudo guardar el producto'))
      setForm(emptyForm)
      setEditingId(null)
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const editProduct = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const deleteProduct = async (id: number) => {
    setError('')
    try {
      const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await getErrorMessage(response, 'No se pudo eliminar el producto'))
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto')
    }
  }

  return (
    <section className="layout products-layout">
      <aside className="panel form-panel">
        <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
        <form onSubmit={submit}>
          <label>
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              minLength={2}
              maxLength={150}
            />
          </label>
          <label>
            Descripción
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              maxLength={1000}
              rows={3}
            />
          </label>
          <div className="product-number-fields">
            <label>
              Precio
              <input
                type="number"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
                min="0"
                step="0.01"
              />
            </label>
            <label>
              Inventario
              <input
                type="number"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                required
                min="0"
                step="1"
              />
            </label>
          </div>
          <label>
            Imagen
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                if (file.size > 2 * 1024 * 1024) {
                  setError('La imagen no puede superar los 2 MB')
                  event.target.value = ''
                  return
                }
                const reader = new FileReader()
                reader.onload = () => setForm((current) => ({
                  ...current,
                  imageUrl: typeof reader.result === 'string' ? reader.result : '',
                }))
                reader.readAsDataURL(file)
              }}
            />
          </label>
          {form.imageUrl && (
            <div className="product-image-preview">
              <img src={form.imageUrl} alt="Vista previa del producto" />
              <button type="button" className="secondary" onClick={() => setForm({ ...form, imageUrl: '' })}>
                Quitar imagen
              </button>
            </div>
          )}
          <div className="actions">
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar producto' : 'Crear producto'}
            </button>
            {editingId && (
              <button type="button" className="secondary" onClick={cancelEdit} disabled={saving}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </aside>

      <section className="panel table-panel">
        <div className="table-heading">
          <div>
            <h2>Productos</h2>
            <p className="table-subtitle">{products.length} productos en el catálogo</p>
          </div>
          <button type="button" className="secondary" onClick={() => void loadProducts()} disabled={loading}>
            Actualizar
          </button>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        {loading ? (
          <p className="empty">Cargando productos...</p>
        ) : products.length === 0 ? (
          <p className="empty">Aún no hay productos. Añade el primer producto al catálogo.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Producto</th><th>Descripción</th><th>Precio</th><th>Inventario</th><th></th></tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-table-name">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" />
                        ) : (
                          <span className="product-table-placeholder">{product.name.charAt(0).toUpperCase()}</span>
                        )}
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td className="product-description">{product.description || '—'}</td>
                    <td className="stock-value">{formatPenCurrency(product.price)}</td>
                    <td className="stock-value">{product.stock}</td>
                    <td className="row-actions">
                      <button type="button" onClick={() => editProduct(product)}>Editar</button>
                      <button type="button" className="danger" onClick={() => void deleteProduct(product.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}

export default ProductsPage
