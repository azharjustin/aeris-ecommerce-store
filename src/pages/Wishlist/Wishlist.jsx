import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../../context/WishlistContext'
import { useProducts } from '../../context/ProductContext'
import { useCart } from '../../context/CartContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import ProductCard from '../../components/ProductCard/ProductCard'
import { CartIcon, TrashIcon, ArrowRightIcon } from '../../components/common/Icons'
import './Wishlist.css'

export default function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist()
  const { products } = useProducts()
  const { addToCart, openCart } = useCart()

  // Track size selection modal or inline selector for a product
  const [sizeSelectorProduct, setSizeSelectorProduct] = useState(null)

  // Filter products that are in the wishlist
  const wishlistedProducts = products.filter((p) => wishlist.has(p.id))

  useScrollReveal([wishlist])

  const handleMoveToCart = (product) => {
    setSizeSelectorProduct(product)
  }

  const handleConfirmAddToCart = (product, size) => {
    addToCart(product, size)
    setSizeSelectorProduct(null)
    openCart()
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        {/* Header */}
        <div className="wishlist-header">
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-subtitle">
            {wishlistedProducts.length === 0
              ? 'Your saved sneakers will appear here.'
              : `You have ${wishlistedProducts.length} ${
                  wishlistedProducts.length === 1 ? 'sneaker' : 'sneakers'
                } saved.`}
          </p>
        </div>

        {/* Empty State */}
        {wishlistedProducts.length === 0 ? (
          <div className="wishlist-empty reveal">
            <div className="wishlist-empty-icon">❤️</div>
            <h2>Your wishlist is empty</h2>
            <p>Explore our premium collection and save your favorite kicks for later!</p>
            <Link to="/" className="btn btn-primary wishlist-shop-btn">
              Explore Collection <ArrowRightIcon />
            </Link>
          </div>
        ) : (
          /* Products Grid */
          <div className="wishlist-grid">
            {wishlistedProducts.map((product) => {
              const isSelectingSize = sizeSelectorProduct?.id === product.id

              return (
                <div key={product.id} className="wishlist-card-wrapper">
                  <div className="wishlist-card-inner">
                    <ProductCard
                      product={product}
                      wishlist={wishlist}
                      onToggleWishlist={toggleWishlist}
                    />

                    <div className="wishlist-actions">
                      {isSelectingSize ? (
                        <div className="wishlist-size-selector">
                          <span className="size-selector-title">Select Size:</span>
                          <div className="wishlist-sizes-grid">
                            {(product.sizes || [6, 7, 8, 9, 10]).map((size) => (
                              <button
                                key={size}
                                className="wishlist-size-btn"
                                onClick={() => handleConfirmAddToCart(product, size)}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                          <button
                            className="wishlist-cancel-btn"
                            onClick={() => setSizeSelectorProduct(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="wishlist-btn-row">
                          <button
                            className="btn btn-sm btn-primary wishlist-add-btn"
                            onClick={() => handleMoveToCart(product)}
                            id={`wishlist-add-btn-${product.id}`}
                          >
                            <CartIcon /> Move to Bag
                          </button>
                          <button
                            className="wishlist-remove-btn"
                            onClick={() => toggleWishlist(product.id)}
                            title="Remove from wishlist"
                            aria-label={`Remove ${product.name} from wishlist`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
