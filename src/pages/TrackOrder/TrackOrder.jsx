import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import './TrackOrder.css'

// ── Status config ────────────────────────────────────────────
const STATUSES = ['confirmed', 'processing', 'shipped', 'delivered']

const STATUS_INFO = {
  confirmed: {
    label: 'Order Confirmed',
    icon: '✓',
    color: 'var(--success)',
    desc: 'Your order has been placed and confirmed.',
  },
  processing: {
    label: 'Processing',
    icon: '⚙',
    color: '#f59e0b',
    desc: 'We are preparing your items for shipment.',
  },
  shipped: {
    label: 'Shipped',
    icon: '🚚',
    color: '#3b82f6',
    desc: 'Your order is on its way to you.',
  },
  delivered: {
    label: 'Delivered',
    icon: '📦',
    color: '#22c55e',
    desc: 'Your order has been delivered. Enjoy!',
  },
  cancelled: {
    label: 'Cancelled',
    icon: '✕',
    color: '#ef4444',
    desc: 'This order has been cancelled.',
  },
  pending: {
    label: 'Pending',
    icon: '⏳',
    color: '#94a3b8',
    desc: 'Your order is pending confirmation.',
  },
}

function getStatusIndex(status) {
  return STATUSES.indexOf(status)
}

export default function TrackOrder() {
  const navigate = useNavigate()
  const { state } = useLocation()

  // Pre-fill the input if navigated from the Order Success page
  const [inputVal, setInputVal] = useState(state?.prefill || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setVisible(true), 80)
  }, [])

  // Auto-search if pre-filled from Order Success
  useEffect(() => {
    if (state?.prefill) {
      handleSearch(state.prefill)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (id) => {
    const trimmed = (id !== undefined ? id : inputVal).trim().toUpperCase()
    if (!trimmed) {
      setError('Please enter your Order ID.')
      return
    }
    setLoading(true)
    setError('')
    setOrder(null)

    try {
      // Search Firestore by the orderCode field
      const q = query(
        collection(db, 'orders'),
        where('orderCode', '==', trimmed)
      )
      const snap = await getDocs(q)

      if (!snap.empty) {
        const docSnap = snap.docs[0]
        setOrder({ _docId: docSnap.id, ...docSnap.data() })
        return
      }

      // Fallback: localStorage (offline orders)
      const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
      const localOrder = local.find(o =>
        o.orderCode?.toUpperCase() === trimmed
      )

      if (localOrder) {
        setOrder(localOrder)
        return
      }

      setError('No order found with that ID. Please double-check and try again.')
    } catch (err) {
      console.error('Track order error:', err)
      // Fallback to localStorage on network errors
      const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
      const localOrder = local.find(o =>
        o.orderCode?.toUpperCase() === trimmed
      )
      if (localOrder) {
        setOrder(localOrder)
      } else {
        setError('Unable to retrieve order. Check your Order ID and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const statusIndex = order ? getStatusIndex(order.status) : -1
  const isCancelled = order?.status === 'cancelled'

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const estimatedDelivery = () => {
    if (!order) return ''
    const base = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now())
    const d = new Date(base)
    let count = 0
    while (count < 7) {
      d.setDate(d.getDate() + 1)
      if (d.getDay() !== 0 && d.getDay() !== 6) count++
    }
    return d.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const resetSearch = () => {
    setOrder(null)
    setInputVal('')
    setError('')
  }

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)

    try {
      if (order._docId) {
        await updateDoc(doc(db, 'orders', order._docId), { status: 'cancelled' })
        setOrder(prev => ({ ...prev, status: 'cancelled' }))
      } else {
        const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
        const idx = local.findIndex(o => o.orderCode === order.orderCode)
        if (idx !== -1) {
          local[idx].status = 'cancelled'
          localStorage.setItem('aeris_orders', JSON.stringify(local))
          setOrder(prev => ({ ...prev, status: 'cancelled' }))
        }
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      alert('Failed to cancel order. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className={`track-page ${visible ? 'visible' : ''}`}>
      <div className="track-container">

        {/* ── Header ── */}
        <div className="track-header">
          <div className="track-header-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <h1 className="track-title">Track Your Order</h1>
          <p className="track-subtitle">
            Enter your Order ID to get real-time tracking updates and delivery status.
          </p>
        </div>

        {/* ── Search Box ── */}
        <div className="track-search-card">
          <div className="track-search-inner">
            <div className="track-search-field">
              <label className="track-search-label" htmlFor="order-id-input">Order ID</label>
              <div className="track-input-wrap">
                <span className="track-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <input
                  id="order-id-input"
                  className={`track-search-input ${error ? 'input-error' : ''}`}
                  type="text"
                  value={inputVal}
                  onChange={e => { setInputVal(e.target.value); setError('') }}
                  placeholder="e.g. AER-20260626-A4F2"
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              {error && (
                <span className="track-search-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </span>
              )}
            </div>
            <button
              className="track-search-btn"
              onClick={() => handleSearch()}
              disabled={loading}
              id="track-search-btn"
            >
              {loading
                ? <span className="track-spinner" />
                : (
                  <>
                    Track Order
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )
              }
            </button>
          </div>
          <p className="track-search-hint">
            💡 Your Order ID looks like <strong>AER-YYYYMMDD-XXXX</strong> — find it on your order confirmation screen.
          </p>
        </div>

        {/* ── Order Result ── */}
        {order && (
          <div className="track-result">

            {/* ── Order Meta ── */}
            <div className="track-meta-grid">
              <div className="track-meta-card">
                <span className="track-meta-label">Order ID</span>
                <span className="track-meta-value mono">{order.orderCode || '—'}</span>
              </div>
              <div className="track-meta-card">
                <span className="track-meta-label">Date Placed</span>
                <span className="track-meta-value">{formatDate(order.createdAt)}</span>
              </div>
              <div className="track-meta-card">
                <span className="track-meta-label">Payment</span>
                <span className="track-meta-value">{
                  order.paymentMethod === 'cod' ? '💵 Cash on Delivery' :
                  order.paymentMethod === 'upi' ? '📱 UPI' :
                  order.paymentMethod === 'card' ? '💳 Card' :
                  order.paymentMethod || '—'
                }</span>
              </div>
              <div className="track-meta-card">
                <span className="track-meta-label">Order Total</span>
                <span className="track-meta-value accent">${order.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* ── Current Status Banner ── */}
            <div
              className="track-status-banner"
              style={{ '--status-color': STATUS_INFO[order.status]?.color || 'var(--accent)' }}
            >
              <div className="track-status-icon-wrap">
                <span className="track-status-icon-char">{STATUS_INFO[order.status]?.icon || '?'}</span>
              </div>
              <div className="track-status-text">
                <div className="track-status-badge">{STATUS_INFO[order.status]?.label || order.status}</div>
                <div className="track-status-desc">{STATUS_INFO[order.status]?.desc}</div>
              </div>
              {!isCancelled && order.status !== 'delivered' && (
                <div className="track-eta">
                  <span className="track-eta-label">Est. Delivery</span>
                  <span className="track-eta-date">{estimatedDelivery()}</span>
                </div>
              )}
            </div>

            {/* ── Progress Timeline ── */}
            {!isCancelled && (
              <div className="track-timeline-card">
                <h3 className="track-section-title">Delivery Progress</h3>
                <div className="track-timeline">
                  {STATUSES.map((s, i) => {
                    const isDone = statusIndex >= i
                    const isActive = statusIndex === i
                    const info = STATUS_INFO[s]
                    return (
                      <div key={s} className="track-timeline-item">
                        <div className="track-tl-left">
                          <div
                            className={`track-tl-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                            style={isDone ? { background: info.color, borderColor: info.color } : {}}
                          >
                            {isDone ? info.icon : i + 1}
                          </div>
                          {i < STATUSES.length - 1 && (
                            <div className={`track-tl-line ${isDone ? 'done' : ''}`}
                              style={isDone ? { background: info.color } : {}}
                            />
                          )}
                        </div>
                        <div className="track-tl-content">
                          <div className={`track-tl-label ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                            {info.label}
                          </div>
                          <div className="track-tl-desc">{info.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="track-cancelled-banner">
                <span className="track-cancelled-icon">✕</span>
                <div>
                  <strong>Order Cancelled</strong>
                  <p>This order has been cancelled. If you need help, please contact our support team.</p>
                </div>
              </div>
            )}

            {/* ── Order Items ── */}
            <div className="track-items-card">
              <h3 className="track-section-title">Items in This Order ({order.items?.length || 0})</h3>
              <div className="track-items-list">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="track-item">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="track-item-img" />
                    )}
                    <div className="track-item-info">
                      <div className="track-item-name">{item.name}</div>
                      <div className="track-item-meta">
                        {item.color && <span>{item.color}</span>}
                        {item.size && <span>· Size {item.size}</span>}
                        <span>· Qty {item.qty}</span>
                      </div>
                    </div>
                    <div className="track-item-price">${(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="track-items-totals">
                <div className="track-total-row">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="track-total-row">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? <span className="track-free">Free</span> : `$${order.shipping?.toFixed(2)}`}</span>
                </div>
                <div className="track-total-row track-grand-total">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order.address && (
              <div className="track-address-card">
                <h3 className="track-section-title">Delivery Address</h3>
                <div className="track-address">
                  <span className="track-address-pin">📍</span>
                  <div className="track-address-lines">
                    {order.userName && <div className="track-address-name">{order.userName}</div>}
                    <div>{order.address.line1}</div>
                    {order.address.line2 && <div>{order.address.line2}</div>}
                    <div>{order.address.city}, {order.address.state}–{order.address.pincode}</div>
                    <div>{order.address.country}</div>
                    {order.userPhone && <div className="track-address-phone">📞 {order.userPhone}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="track-actions">
              <button className="track-btn-primary" onClick={() => navigate('/')} id="track-continue-shopping">
                Continue Shopping
              </button>
              {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'shipped' && (
                <button
                  className="track-btn-cancel"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  id="cancel-order-btn"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              <button className="track-btn-secondary" onClick={resetSearch} id="track-another-btn">
                Track Another Order
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
