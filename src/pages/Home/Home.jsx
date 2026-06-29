import { useState, useCallback } from 'react'
import { useProducts } from '../../context/ProductContext'
import { useCart } from '../../context/CartContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import Hero from '../../components/Hero/Hero'
import Categories from '../../components/Categories/Categories'
import ProductCard from '../../components/ProductCard/ProductCard'
import FeaturedBanner from '../../components/FeaturedBanner/FeaturedBanner'
import Newsletter from '../../components/Newsletter/Newsletter'
import Footer from '../../components/Footer/Footer'
import { TruckIcon, ShieldIcon, RefreshIcon } from '../../components/common/Icons'

export default function Home() {
  const { products } = useProducts()
  const { searchQuery } = useCart()
  const [activeCategory, setActiveCategory] = useState('All')
  const [wishlist, setWishlist] = useState(new Set())

  const toggleWishlist = useCallback((id) => {
    setWishlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.color || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  useScrollReveal([activeCategory, searchQuery])

  return (
    <>
      <Hero />

      <Categories
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        productCount={filteredProducts.length}
      />

      {/* Product Grid */}
      <section className="products-section" id="new-arrivals">
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="products-empty">
              <div className="products-empty-icon">🔍</div>
              <div className="products-empty-text">No sneakers found</div>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                style={{ transitionDelay: `${idx * 0.05}s` }}
              />
            ))
          )}
        </div>
      </section>

      <FeaturedBanner />

      {/* Trust Badges */}
      <section className="newsletter-section" id="about" style={{ paddingBottom: '0' }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap',
          position: 'relative', maxWidth: '900px', margin: '0 auto', paddingBottom: 'var(--space-2xl)',
        }}>
          {[
            { icon: <TruckIcon />, title: 'Free Shipping', desc: 'On orders over $200' },
            { icon: <ShieldIcon />, title: 'Secure Payment', desc: '256-bit SSL encryption' },
            { icon: <RefreshIcon />, title: 'Easy Returns', desc: '30-day return policy' },
          ].map((item, idx) => (
            <div key={idx} className="reveal" style={{
              textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
              transitionDelay: `${idx * 0.1}s`,
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-full)',
                background: 'var(--accent-subtle)', border: '1px solid var(--border-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)',
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Newsletter />
      <Footer />
    </>
  )
}
