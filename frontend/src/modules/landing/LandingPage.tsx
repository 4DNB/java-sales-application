import { useEffect, useRef, useState } from 'react'
import { formatPenCurrency } from '../../utils/currency'
import './landing.css'

type Product = {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  imageUrl: string | null
}

type CustomerSession = {
  email: string
  name: string
  role: 'ADMIN' | 'CUSTOMER' | 'SELLER' | 'MANAGER'
  userId: number | null
}

type LandingPageProps = {
  onLogin: () => void
  onRegister: () => void
  currentUser?: CustomerSession
  onManage?: () => void
  onLogout?: () => void
}

function LandingPage({ onLogin, onRegister, currentUser, onManage, onLogout }: LandingPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState<Record<number, number>>({})
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)
  const checkoutKey = useRef<string | null>(null)
  const isCustomer = currentUser?.role === 'CUSTOMER'
  const cartItems = products.filter((product) => (cart[product.id] ?? 0) > 0)
  const cartTotal = cartItems.reduce(
    (total, product) => total + product.price * cart[product.id],
    0,
  )

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/v1/products', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo cargar el catálogo')
        setProducts(await response.json() as Product[])
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  const scrollToCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }

  const addToCart = (product: Product) => {
    checkoutKey.current = null
    setCheckoutError('')
    setCheckoutMessage('')
    setCart((current) => {
      const quantity = current[product.id] ?? 0
      if (quantity >= product.stock) return current
      return { ...current, [product.id]: quantity + 1 }
    })
  }

  const changeCartQuantity = (product: Product, change: number) => {
    checkoutKey.current = null
    setCheckoutError('')
    setCheckoutMessage('')
    setCart((current) => {
      const quantity = (current[product.id] ?? 0) + change
      if (quantity <= 0) {
        const next = { ...current }
        delete next[product.id]
        return next
      }
      if (quantity > product.stock) return current
      return { ...current, [product.id]: quantity }
    })
  }

  const checkout = async () => {
    if (!currentUser || !isCustomer || cartItems.length === 0) return
    setCheckingOut(true)
    setCheckoutError('')
    setCheckoutMessage('')
    checkoutKey.current ??= crypto.randomUUID()
    try {
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': checkoutKey.current,
        },
        body: JSON.stringify({
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          userId: currentUser.userId,
          items: cartItems.map((product) => ({
            productId: product.id,
            quantity: cart[product.id],
          })),
        }),
      })
      if (!response.ok) {
        if (response.status < 500) checkoutKey.current = null
        const body: unknown = await response.json().catch(() => null)
        const message =
          typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string'
            ? body.detail
            : 'No se pudo completar la compra. Inténtalo de nuevo.'
        throw new Error(message)
      }
      const order = await response.json() as { id: string }
      checkoutKey.current = null
      setProducts((current) => current.map((product) => ({
        ...product,
        stock: product.stock - (cart[product.id] ?? 0),
      })))
      setCart({})
      setCheckoutMessage(`Compra confirmada. Número de pedido: ${order.id}.`)
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'No se pudo completar la compra')
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="#" aria-label="Inicio">
          <span className="landing-brand-mark" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
          <span>VENTAS<span>APP</span></span>
        </a>
        <nav className="landing-nav" aria-label="Navegación principal">
          <button type="button" onClick={scrollToCatalog}>Catálogo</button>
          {currentUser ? (
            <>
              <span className="landing-user">Hola, {currentUser.name}</span>
              {onManage && <button type="button" onClick={onManage}>Panel de gestión</button>}
              <button type="button" className="landing-login" onClick={onLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onRegister}>Registrarse</button>
              <button type="button" className="landing-login" onClick={onLogin}>
                Iniciar sesión
              </button>
            </>
          )}
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="landing-eyebrow">NUESTRA TIENDA</p>
          <h1>Productos seleccionados para tu día a día.</h1>
          <p className="hero-description">
            Descubre una selección práctica, moderna y preparada para acompañarte en cada momento.
          </p>
          <button type="button" className="hero-button" onClick={scrollToCatalog}>
            Explorar catálogo
          </button>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit orbit-one"></div>
          <div className="hero-orbit orbit-two"></div>
          <div className="hero-card">
            <span>Selección</span>
            <strong>Premium</strong>
          </div>
          <div className="hero-shape shape-one"></div>
          <div className="hero-shape shape-two"></div>
        </div>
      </section>

      <section className="catalog-section" id="catalogo">
        <div className="catalog-heading">
          <div>
            <p className="landing-eyebrow">CATÁLOGO</p>
            <h2>Conoce nuestros productos</h2>
          </div>
          <span>{loading ? 'Cargando...' : `${products.length} productos`}</span>
        </div>

        {error && <div className="landing-error" role="alert">{error}</div>}
        {loading ? (
          <p className="catalog-empty">Cargando productos...</p>
        ) : products.length === 0 ? (
          <p className="catalog-empty">Todavía no hay productos disponibles.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-art">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} loading="lazy" />
                  ) : (
                    <span>{product.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="product-card-copy">
                  <div className="product-card-heading">
                    <h3>{product.name}</h3>
                    <strong>{formatPenCurrency(product.price)}</strong>
                  </div>
                  <p>{product.description || 'Producto disponible en nuestro catálogo.'}</p>
                  <span className={product.stock > 0 ? 'stock available' : 'stock unavailable'}>
                    {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                  </span>
                  {isCustomer ? (
                    <button
                      type="button"
                      className="product-buy-button"
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= (cart[product.id] ?? 0)}
                    >
                      {product.stock <= (cart[product.id] ?? 0) ? 'Máximo disponible' : 'Añadir al carrito'}
                    </button>
                  ) : !currentUser ? (
                    <button type="button" className="product-buy-button" onClick={onLogin}>
                      Inicia sesión para comprar
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        {isCustomer && (
          <section className="cart-panel" aria-label="Carrito de compra">
            <div className="cart-heading">
              <div>
                <p className="landing-eyebrow">TU COMPRA</p>
                <h2>Carrito ({cartItems.reduce((count, product) => count + cart[product.id], 0)})</h2>
              </div>
              <strong>{formatPenCurrency(cartTotal)}</strong>
            </div>
            {cartItems.length === 0 ? (
              <p className="cart-empty">Añade productos para empezar tu compra.</p>
            ) : (
              <ul className="cart-items">
                {cartItems.map((product) => (
                  <li key={product.id}>
                    <span className="cart-product-name">{product.name}</span>
                    <div className="cart-quantity">
                      <button type="button" aria-label={`Quitar una unidad de ${product.name}`} onClick={() => changeCartQuantity(product, -1)}>−</button>
                      <span>{cart[product.id]}</span>
                      <button
                        type="button"
                        aria-label={`Añadir una unidad de ${product.name}`}
                        onClick={() => changeCartQuantity(product, 1)}
                        disabled={cart[product.id] >= product.stock}
                      >+</button>
                    </div>
                    <strong>{formatPenCurrency(product.price * cart[product.id])}</strong>
                  </li>
                ))}
              </ul>
            )}
            {checkoutError && <div className="landing-error" role="alert">{checkoutError}</div>}
            {checkoutMessage && <div className="checkout-success" role="status">{checkoutMessage}</div>}
            <button
              type="button"
              className="checkout-button"
              onClick={() => void checkout()}
              disabled={cartItems.length === 0 || checkingOut}
            >
              {checkingOut ? 'Procesando...' : 'Confirmar compra'}
            </button>
            <p className="checkout-note">El pago no se procesa en esta versión.</p>
          </section>
        )}
      </section>
    </main>
  )
}

export default LandingPage
