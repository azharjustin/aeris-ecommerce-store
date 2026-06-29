import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { XIcon, MinusIcon, PlusIcon, TrashIcon } from '../common/Icons'
import './CartDrawer.css'

export default function CartDrawer({ open, onClose }) {
  const { cart, updateQty, removeFromCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!open) return null

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = subtotal > 200 ? 0 : 12.99
  const total = subtotal + shipping

  const handleCheckout = () => {
    onClose()
    if (!user) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-header">
          <div className="cart-title">
            Shopping Bag
            <span className="cart-count">{cart.reduce((s, i) => s + i.qty, 0)}</span>
          </div>
          <button className="cart-close" onClick={onClose} aria-label="Close cart">
            <XIcon />
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <div className="cart-empty-text">Your bag is empty</div>
              <div className="cart-empty-subtext">Add some kicks to get started</div>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div className="cart-item" key={item.key} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <div>
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-variant">
                      {item.color}
                      {item.size && <span className="cart-item-size"> · Size {item.size}</span>}
                    </div>
                  </div>
                  <div className="cart-item-bottom">
                    <span className="cart-item-price">${(item.price * item.qty).toFixed(2)}</span>
                    <div className="cart-item-controls">
                      <button className="qty-btn" onClick={() => updateQty(item.key, -1)} aria-label="Decrease quantity">
                        <MinusIcon />
                      </button>
                      <span className="cart-item-qty">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.key, 1)} aria-label="Increase quantity">
                        <PlusIcon />
                      </button>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item.key)} aria-label="Remove item">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span className="cart-subtotal-label">Subtotal</span>
              <span className="cart-subtotal-value">${subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-subtotal">
              <span className="cart-subtotal-label">Shipping</span>
              <span className="cart-subtotal-value">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">${total.toFixed(2)}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              {user ? `Checkout — $${total.toFixed(2)}` : 'Sign in to Checkout'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
