import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartIcon } from '../common/Icons'
import StarRating from '../common/StarRating'
import './ProductCard.css'

export default function ProductCard({ product, wishlist, onToggleWishlist, style }) {
  const navigate = useNavigate()
  const [ripple, setRipple] = useState(false)

  const handleCardClick = () => {
    navigate(`/product/${product.id}`)
  }

  const handleQuickView = (e) => {
    e.stopPropagation()
    setRipple(true)
    setTimeout(() => setRipple(false), 400)
    navigate(`/product/${product.id}`)
  }

  return (
    <div
      className={`product-card reveal ${ripple ? 'added' : ''}`}
      style={{ ...style, cursor: 'pointer' }}
      onClick={handleCardClick}
    >
      <div className="product-card-image">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && (
          <span className={`product-card-badge ${product.badge}`}>
            {product.badge === 'sale' ? 'Sale' : product.badge === 'new' ? 'New' : 'Limited'}
          </span>
        )}
        <button
          className={`product-card-wishlist ${wishlist?.has(product.id) ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(product.id) }}
          aria-label={`Add ${product.name} to wishlist`}
        >
          <HeartIcon filled={wishlist?.has(product.id)} />
        </button>
        <button className="product-card-quickadd" onClick={handleQuickView}>
          Select Size
        </button>
      </div>
      <div className="product-card-info">
        <div className="product-card-brand">{product.brand || 'AERIS'}</div>
        <div className="product-card-name">{product.name}</div>
        <StarRating rating={product.rating} reviews={product.reviews} />
        <div className="product-card-price">
          <span className="price-current">${Number(product.price).toFixed(2)}</span>
          {product.originalPrice && (
            <span className="price-original">${Number(product.originalPrice).toFixed(2)}</span>
          )}
        </div>
        {product.sizes && (
          <div className="product-card-sizes">
            {product.sizes.map(s => (
              <span key={s} className="product-card-size-pill">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
