import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProducts } from '../../context/ProductContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import useScrollReveal from '../../hooks/useScrollReveal'
import StarRating from '../../components/common/StarRating'
import { HeartIcon, CartIcon, ArrowRightIcon, TruckIcon, ShieldIcon, RefreshIcon } from '../../components/common/Icons'
import './Product.css'

export default function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products } = useProducts()
  const { addToCart, openCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { user } = useAuth()

  const product = products.find(p => p.id === id)
  const [selectedSize, setSelectedSize] = useState(null)
  const [justAdded, setJustAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  // Reviews States
  const [dbReviews, setDbReviews] = useState([])
  const [localReviews, setLocalReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [formRating, setFormRating] = useState(5)
  const [formComment, setFormComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [ratingHover, setRatingHover] = useState(0)

  // Scroll to top on load
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [id])
  // Reset states when product changes
  useEffect(() => {
    setSelectedSize(null)
    setSizeError(false)
    setActiveImageIdx(0)
    setFormComment('')
    setFormRating(5)
  }, [id])

  // Subscribe to reviews in Firestore and load local reviews
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`reviews_${id}`)
      setLocalReviews(saved ? JSON.parse(saved) : [])
    } catch {
      setLocalReviews([])
    }

    setLoadingReviews(true)
    const reviewsRef = collection(db, 'products', id, 'reviews')
    const unsubscribe = onSnapshot(
      reviewsRef,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Sort reviews by date descending
        list.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
          return dateB - dateA
        })
        setDbReviews(list)
        setLoadingReviews(false)
      },
      (error) => {
        console.warn('Reviews collection not available, using local:', error.message)
        setLoadingReviews(false)
      }
    )

    return unsubscribe
  }, [id])

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user || !formComment.trim()) return
    setSubmittingReview(true)

    const reviewData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userPhoto: user.photoURL || '',
      rating: formRating,
      comment: formComment.trim(),
      createdAt: new Date().toISOString(),
    }

    try {
      const reviewsRef = collection(db, 'products', id, 'reviews')
      await addDoc(reviewsRef, {
        ...reviewData,
        createdAt: serverTimestamp(),
      })
      setFormComment('')
      setFormRating(5)
    } catch (err) {
      console.warn('Saving review locally as fallback:', err.message)
      const updated = [{ ...reviewData, id: `local_rev_${Date.now()}` }, ...localReviews]
      localStorage.setItem(`reviews_${id}`, JSON.stringify(updated))
      setLocalReviews(updated)
      setFormComment('')
      setFormRating(5)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Combine and de-duplicate reviews
  const combinedReviews = [...dbReviews]
  localReviews.forEach((lr) => {
    if (!combinedReviews.some((r) => r.userId === lr.userId && r.comment === lr.comment)) {
      combinedReviews.push(lr)
    }
  })

  // Recalculate average rating & review count based on baseline + custom reviews
  const initialCount = product?.reviews || 0
  const initialRating = product?.rating || 0
  const totalReviewsCount = initialCount + combinedReviews.length
  const totalPoints = initialRating * initialCount + combinedReviews.reduce((sum, r) => sum + r.rating, 0)
  const avgRating = totalReviewsCount > 0 ? Number((totalPoints / totalReviewsCount).toFixed(1)) : 0

  // Scroll reveal hookup
  useScrollReveal([id, dbReviews, localReviews, activeImageIdx])

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

  const getRatingBarPercentage = (stars) => {
    if (combinedReviews.length > 0) {
      const count = combinedReviews.filter((r) => r.rating === stars).length
      return Math.round((count / combinedReviews.length) * 100)
    }
    if (product.rating >= 4.8) {
      if (stars === 5) return 80
      if (stars === 4) return 15
      if (stars === 3) return 5
    } else {
      if (stars === 5) return 65
      if (stars === 4) return 25
      if (stars === 3) return 8
      if (stars === 2) return 2
    }
    return 0
  }

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
            <img src={product.images?.[activeImageIdx] || product.image} alt={product.name} className="product-detail-img" />
          </div>
          
          {/* Thumbnails */}
          {product.images && product.images.length > 0 && (
            <div className="product-image-thumbnails">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumb-btn ${activeImageIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View image angle ${idx + 1}`}
                >
                  <img src={img} alt={`${product.name} detail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info-section">
          <div className="product-detail-brand">{product.brand}</div>
          <h1 className="product-detail-name">{product.name}</h1>

          <div className="product-detail-meta">
            <StarRating rating={avgRating} reviews={totalReviewsCount} />
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
              {(product.sizes || [6, 7, 8, 9, 10]).map(size => {
                const disabled = product.stock && product.stock[size] === 0
                const stockQty = product.stock?.[size]
                return (
                  <button
                    key={size}
                    className={`size-pill ${selectedSize === size ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => { if (!disabled) { setSelectedSize(size); setSizeError(false) } }}
                    disabled={disabled}
                    title={disabled ? 'Sold Out' : stockQty <= 3 ? `Only ${stockQty} left!` : ''}
                    aria-label={`Size ${size} ${disabled ? '(Sold Out)' : ''}`}
                    aria-pressed={selectedSize === size}
                  >
                    {size}
                    {disabled && <span className="size-pill-strike" />}
                  </button>
                )
              })}
            </div>
            {selectedSize && product.stock && product.stock[selectedSize] > 0 && product.stock[selectedSize] <= 3 && (
              <p className="low-stock-alert-text">
                ⚠️ Only {product.stock[selectedSize]} pairs left in Size {selectedSize}! Buy now before it sells out.
              </p>
            )}
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

      {/* Reviews & Ratings Section */}
      <section className="reviews-section" id="reviews">
        <div className="reviews-header">
          <h2 className="reviews-title">Customer Reviews</h2>
        </div>

        <div className="reviews-grid">
          {/* Left Column: Ratings Overview */}
          <div className="reviews-overview-card">
            <span className="overview-avg-num">{avgRating}</span>
            <div className="overview-stars-wrap">
              <StarRating rating={avgRating} />
            </div>
            <span className="overview-count">Based on {totalReviewsCount} reviews</span>

            <div className="rating-bars-chart">
              {[5, 4, 3, 2, 1].map((stars) => {
                const pct = getRatingBarPercentage(stars)
                return (
                  <div key={stars} className="rating-bar-row">
                    <span className="rating-bar-num">{stars}</span>
                    <span>★</span>
                    <div className="rating-bar-bg">
                      <div className="rating-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="rating-bar-percent">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Reviews List & Write Review */}
          <div className="reviews-list-col">
            
            {/* Write a Review */}
            <div className="write-review-form-card">
              <h3 className="write-review-title">Write a Customer Review</h3>
              {user ? (
                <form onSubmit={handleSubmitReview} className="profile-form">
                  <div className="stars-input-row">
                    <span className="stars-input-label">Your Rating:</span>
                    <div className="stars-interactive">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = ratingHover ? star <= ratingHover : star <= formRating
                        return (
                          <button
                            type="button"
                            key={star}
                            className={`star-interactive-btn ${active ? 'filled' : ''}`}
                            onClick={() => setFormRating(star)}
                            onMouseEnter={() => setRatingHover(star)}
                            onMouseLeave={() => setRatingHover(0)}
                            aria-label={`Rate ${star} stars`}
                          >
                            ★
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Review Details</label>
                    <textarea
                      rows="4"
                      className="form-input"
                      style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                      placeholder="What did you like or dislike? How does it fit?"
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary profile-save-btn"
                    style={{ padding: '10px 24px', height: '40px', fontSize: '14px' }}
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <div className="write-review-login-note">
                  Please <Link to="/login">Sign In</Link> to share your review and rating with other customers.
                </div>
              )}
            </div>

            {/* List of Reviews */}
            {loadingReviews ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading reviews...</p>
            ) : combinedReviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: 'var(--space-md) 0' }}>
                No reviews yet. Be the first to share your thoughts!
              </p>
            ) : (
              combinedReviews.map((rev) => (
                <div key={rev.id} className="review-item-card reveal">
                  <div className="review-avatar-wrapper">
                    {rev.userPhoto ? (
                      <img src={rev.userPhoto} alt={rev.userName} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="review-avatar-fallback">👤</div>
                    )}
                  </div>
                  <div className="review-content-area">
                    <div className="review-meta-row">
                      <div>
                        <div className="review-user-name">{rev.userName}</div>
                        <StarRating rating={rev.rating} />
                      </div>
                      <span className="review-date">
                        {rev.createdAt?.toDate 
                          ? rev.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        }
                      </span>
                    </div>
                    <p className="review-comment">{rev.comment}</p>
                  </div>
                </div>
              ))
            )}

          </div>
        </div>
      </section>

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
