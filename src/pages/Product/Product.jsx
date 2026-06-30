import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProducts } from '../../context/ProductContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import StarRating from '../../components/common/StarRating'
import { HeartIcon, CartIcon, ArrowRightIcon, TruckIcon, ShieldIcon, RefreshIcon } from '../../components/common/Icons'
import './Product.css'

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products } = useProducts()
  const { addToCart, openCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()

  const product = products.find(p => p.id === id)
  const [selectedSize, setSelectedSize] = useState(null)
  const [justAdded, setJustAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)

  // Scroll to top on load
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [id])
  // Reset size when product changes
  useEffect(() => { setSelectedSize(null); setSizeError(false) }, [id])

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="pnf-icon">👟</div>
        <h2>Product not found</h2>
        <p>This sneaker might have sold out or been removed.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Collection</button>
      </div>
    )
  }

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true)
      setTimeout(() => setSizeError(false), 2000)
      return
    }
    addToCart(product, selectedSize)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
    openCart()
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <div className="product-page">
      {/* Breadcrumb */}
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{product.category}</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* Main product area */}
      <div className="product-layout">

        {/* Image */}
        <div className="product-image-section">
          <div className="product-image-wrapper">
            {product.badge && (
              <span className={`product-detail-badge ${product.badge}`}>
                {product.badge === 'sale' ? `Sale ${discount}% OFF` : product.badge === 'new' ? 'New Arrival' : 'Limited Edition'}
              </span>
            )}
            <img src={product.image} alt={product.name} className="product-detail-img" />
          </div>
        </div>

        {/* Info */}
        <div className="product-info-section">
          <div className="product-detail-brand">{product.brand}</div>
          <h1 className="product-detail-name">{product.name}</h1>

          <div className="product-detail-meta">
            <StarRating rating={product.rating} reviews={product.reviews} />
            <span className="product-detail-color">{product.color}</span>
          </div>

          <div className="product-detail-price">
            <span className="product-detail-price-current">${Number(product.price).toFixed(2)}</span>
            {product.originalPrice && (
              <>
                <span className="product-detail-price-original">${Number(product.originalPrice).toFixed(2)}</span>
                <span className="product-detail-price-save">Save ${(product.originalPrice - product.price).toFixed(2)}</span>
              </>
            )}
          </div>

          <p className="product-detail-description">{product.description}</p>

          {/* Size Selector */}
          <div className="product-size-section">
            <div className="product-size-header">
              <span className="product-size-label">
                Select Size (US)
                {selectedSize && <span className="selected-size-indicator"> — Size {selectedSize}</span>}
              </span>
            </div>
            {sizeError && <p className="size-error-msg">⚠ Please select a size before adding to cart</p>}
            <div className="product-size-grid">
              {(product.sizes || [6, 7, 8, 9, 10]).map(size => (
                <button
                  key={size}
                  className={`size-pill ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => { setSelectedSize(size); setSizeError(false) }}
                  aria-label={`Size ${size}`}
                  aria-pressed={selectedSize === size}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="product-ctas">
            <button
              className={`btn-add-to-cart ${justAdded ? 'added' : ''} ${!selectedSize ? 'needs-size' : ''}`}
              onClick={handleAddToCart}
              id="add-to-cart-btn"
            >
              <CartIcon />
              {justAdded ? '✓ Added to Bag!' : selectedSize ? `Add Size ${selectedSize} to Bag` : 'Select a Size'}
            </button>
            <button
              className={`btn-wishlist ${isWishlisted(product.id) ? 'active' : ''}`}
              onClick={() => toggleWishlist(product.id)}
              aria-label="Add to wishlist"
            >
              <HeartIcon filled={isWishlisted(product.id)} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="product-trust-badges">
            <div className="trust-item">
              <TruckIcon />
              <span>Free shipping on orders over $200</span>
            </div>
            <div className="trust-item">
              <ShieldIcon />
              <span>Secure checkout</span>
            </div>
            <div className="trust-item">
              <RefreshIcon />
              <span>30-day easy returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="related-section">
          <div className="related-header">
            <h2 className="related-title">You May Also Like</h2>
            <button className="related-view-all" onClick={() => navigate('/')}>
              View All <ArrowRightIcon />
            </button>
          </div>
          <div className="related-grid">
            {related.map(rel => (
              <div
                key={rel.id}
                className="related-card"
                onClick={() => navigate(`/product/${rel.id}`)}
              >
                <div className="related-card-image">
                  <img src={rel.image} alt={rel.name} loading="lazy" />
                  {rel.badge && (
                    <span className={`product-card-badge ${rel.badge}`}>
                      {rel.badge === 'sale' ? 'Sale' : rel.badge === 'new' ? 'New' : 'Limited'}
                    </span>
                  )}
                </div>
                <div className="related-card-info">
                  <div className="related-card-name">{rel.name}</div>
                  <div className="related-card-price">${Number(rel.price).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
