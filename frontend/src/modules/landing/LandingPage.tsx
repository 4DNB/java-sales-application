import { useEffect, useState } from 'react'
import './landing.css'

type Product = {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
}

type LandingPageProps = {
  onLogin: () => void
}

function LandingPage({ onLogin }: LandingPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          <button type="button" className="landing-login" onClick={onLogin}>
            Iniciar sesión
          </button>
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
                <div className="product-art" aria-hidden="true">
                  <span>{product.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="product-card-copy">
                  <div className="product-card-heading">
                    <h3>{product.name}</h3>
                    <strong>{product.price.toFixed(2)} €</strong>
                  </div>
                  <p>{product.description || 'Producto disponible en nuestro catálogo.'}</p>
                  <span className={product.stock > 0 ? 'stock available' : 'stock unavailable'}>
                    {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default LandingPage
