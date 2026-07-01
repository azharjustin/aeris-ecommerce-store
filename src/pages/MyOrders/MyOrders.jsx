import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import { ArrowRightIcon, TruckIcon } from '../../components/common/Icons'
import './MyOrders.css'

const STATUS_BADGES = {
  pending: { label: 'Pending', class: 'badge-pending' },
  confirmed: { label: 'Confirmed', class: 'badge-confirmed' },
  processing: { label: 'Processing', class: 'badge-processing' },
  shipped: { label: 'Shipped', class: 'badge-shipped' },
  delivered: { label: 'Delivered', class: 'badge-delivered' },
  cancelled: { label: 'Cancelled', class: 'badge-cancelled' },
}

export default function MyOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useScrollReveal([loading, activeTab])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchOrders = async () => {
      setLoading(true)
      setError('')
      try {
        // Query firestore for user orders
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        )
        const snap = await getDocs(q)
        
        let fetchedOrders = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Sort orders client-side by date descending to avoid index requirements
        fetchedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
          return dateB - dateA
        })

        // Merge offline/local orders for this user if any exist
        const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
        const localUserOrders = local.filter(o => o.userId === user.uid)

        // Combine and de-duplicate by orderCode
        const combined = [...fetchedOrders]
        localUserOrders.forEach(localOrder => {
          if (!combined.some(o => o.orderCode === localOrder.orderCode)) {
            combined.push(localOrder)
          }
        })

        // Sort combined list again
        combined.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
          return dateB - dateA
        })

        setOrders(combined)
      } catch (err) {
        console.error('Error fetching orders:', err)
        // Fallback entirely to local storage
        const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
        const localUserOrders = local.filter(o => o.userId === user.uid)
        localUserOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setOrders(localUserOrders)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, navigate])

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') {
      return ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
    }
    if (activeTab === 'completed') return order.status === 'delivered'
    if (activeTab === 'cancelled') return order.status === 'cancelled'
    return true
  })

  const handleTrackOrder = (orderCode) => {
    navigate('/track-order', { state: { prefill: orderCode } })
  }

  if (!user) {
    return (
      <div className="my-orders-page">
        <div className="my-orders-container login-required-container">
          <div className="login-required-card reveal">
            <div className="login-required-icon-wrap">
              <span className="login-required-icon">📦</span>
            </div>
            <h2 className="login-required-title">Order History Restricted</h2>
            <p className="login-required-desc">
              Please sign in to view your complete order history, track active delivery status, and manage returns.
            </p>
            <button 
              className="btn btn-primary login-required-btn"
              onClick={() => navigate('/login', { state: { from: '/my-orders' } })}
              id="orders-login-btn"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-orders-page">
      <div className="my-orders-container">
        
        {/* Header */}
        <div className="my-orders-header">
          <h1 className="my-orders-title">My Orders</h1>
          <p className="my-orders-subtitle">Track and manage your purchases</p>
        </div>

        {/* Navigation Tabs */}
        <div className="orders-tabs">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'active', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="orders-loading">
            <div className="orders-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="orders-error-state">
            <p>{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="orders-empty reveal">
            <div className="orders-empty-icon">📦</div>
            <h2>No orders found</h2>
            <p>
              {activeTab === 'all'
                ? "You haven't placed any orders yet."
                : `You don't have any ${activeTab} orders at the moment.`}
            </p>
            <Link to="/" className="btn btn-primary orders-shop-btn">
              Start Shopping <ArrowRightIcon />
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="orders-list">
            {filteredOrders.map(order => (
              <div key={order.id || order.orderCode} className="order-card">
                
                {/* Card Header */}
                <div className="order-card-header">
                  <div className="header-info">
                    <span className="order-id-label">Order Code</span>
                    <span className="order-id-val mono">{order.orderCode}</span>
                  </div>
                  <div className="header-info">
                    <span className="order-id-label">Placed On</span>
                    <span className="order-id-val">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="header-info">
                    <span className="order-id-label">Total</span>
                    <span className="order-id-val price">${order.total?.toFixed(2)}</span>
                  </div>
                  <div className="header-status">
                    <span className={`status-badge ${STATUS_BADGES[order.status]?.class || 'badge-pending'}`}>
                      {STATUS_BADGES[order.status]?.label || order.status}
                    </span>
                  </div>
                </div>

                {/* Card Items */}
                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="order-item-thumb">
                        <div className="item-thumb-wrapper">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <div className="item-thumb-fallback">👟</div>
                          )}
                          <span className="item-thumb-qty">{item.qty}</span>
                        </div>
                        <div className="item-thumb-details">
                          <div className="item-thumb-name">{item.name}</div>
                          <div className="item-thumb-meta">Size {item.size} · {item.color}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="order-card-actions">
                    <button
                      className="btn btn-sm btn-secondary track-action-btn"
                      onClick={() => handleTrackOrder(order.orderCode)}
                      id={`track-btn-${order.orderCode}`}
                    >
                      <TruckIcon /> Track Order
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
