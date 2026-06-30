import { useState, useCallback } from 'react'
import { useProducts } from '../../context/ProductContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import Hero from '../../components/Hero/Hero'
import Categories from '../../components/Categories/Categories'
import FilterBar from '../../components/FilterBar/FilterBar'
import ProductCard from '../../components/ProductCard/ProductCard'
import FeaturedBanner from '../../components/FeaturedBanner/FeaturedBanner'
import Newsletter from '../../components/Newsletter/Newsletter'
import Footer from '../../components/Footer/Footer'
import { TruckIcon, ShieldIcon, RefreshIcon } from '../../components/common/Icons'

export default function Home() {
  const { products } = useProducts()
  const { searchQuery } = useCart()
  const { wishlist, toggleWishlist } = useWishlist()
  
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState([0, 500])
  const [selectedSizes, setSelectedSizes] = useState(new Set())

  const handleClearFilters = useCallback(() => {
    setPriceRange([0, 500])
    setSelectedSizes(new Set())
  }, [])

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.color || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPrice = Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]
    const matchesSize = selectedSizes.size === 0 ||
      (p.sizes || [6, 7, 8, 9, 10]).some(size => selectedSizes.has(size))
      
    return matchesCategory && matchesSearch && matchesPrice && matchesSize
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'newest') {
      if (a.badge === 'new' && b.badge !== 'new') return -1
      if (b.badge === 'new' && a.badge !== 'new') return 1
      return 0
    }
    return 0 // default 'featured'
  })

  useScrollReveal([activeCategory, searchQuery, sortBy, priceRange, selectedSizes])

  return (
    <>
      <Hero />

      <Categories
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        productCount={sortedProducts.length}
      />

      <FilterBar
        sortBy={sortBy}
        setSortBy={setSortBy}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        onClearAll={handleClearFilters}
      />

      {/* Product Grid */}
      <section className="products-section" id="new-arrivals">
        <div className="products-grid">
          {sortedProducts.length === 0 ? (
            <div className="products-empty">
              <div className="products-empty-icon">🔍</div>
              <div className="products-empty-text">No sneakers found</div>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            sortedProducts.map((product, idx) => (
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
