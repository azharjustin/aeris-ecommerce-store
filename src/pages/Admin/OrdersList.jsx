import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function OrdersList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    let unsubscribe = () => {}
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      unsubscribe = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      }, () => {
        const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
        setOrders(local)
        setLoading(false)
      })
    } catch {
      const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
      setOrders(local)
      setLoading(false)
    }
    return unsubscribe
  }, [])

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus })
    } catch {
      // Update locally
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-subtitle">{orders.length} total orders</p>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner" />
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <div className="admin-empty-text">No orders found</div>
            <p style={{ color: 'var(--text-muted)' }}>Orders will appear here when customers checkout</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <>
                  <tr key={order.id} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      #{order.id?.slice(0, 8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {order.userPhoto && <img src={order.userPhoto} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} referrerPolicy="no-referrer" />}
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>{order.userName || 'Customer'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>{order.items?.length || 0} items</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-light)' }}>${order.total?.toFixed(2)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-details`}>
                      <td colSpan="6" style={{ background: 'var(--bg-tertiary)', padding: '20px 24px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Order Items</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border)',
                            }}>
                              <div>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</span>
                                <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '12px' }}>{item.color}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty: {item.qty}</span>
                                <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>${(item.price * item.qty).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Subtotal: ${order.subtotal?.toFixed(2)}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Shipping: {order.shipping === 0 ? 'Free' : `$${order.shipping?.toFixed(2)}`}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Total: ${order.total?.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
