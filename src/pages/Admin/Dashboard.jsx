import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useProducts } from '../../context/ProductContext'
import { OrdersIcon, ProductsIcon, DollarIcon, UsersIcon } from '../../components/common/Icons'

export default function Dashboard() {
  const { products } = useProducts()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    let unsubscribe = () => {}
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      unsubscribe = onSnapshot(q, (snapshot) => {
        const orderData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setOrders(orderData)
        setOrdersLoading(false)
      }, () => {
        // Fallback to localStorage
        const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
        setOrders(local)
        setOrdersLoading(false)
      })
    } catch {
      const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
      setOrders(local)
      setOrdersLoading(false)
    }
    return unsubscribe
  }, [])

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const uniqueCustomers = new Set(orders.map(o => o.userEmail)).size
  const recentOrders = orders.slice(0, 5)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Overview of your store performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <div className="admin-stat-icon"><OrdersIcon /></div>
            <span className="admin-stat-change up">↑ Live</span>
          </div>
          <div className="admin-stat-value">{orders.length}</div>
          <div className="admin-stat-label">Total Orders</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <div className="admin-stat-icon"><DollarIcon /></div>
            <span className="admin-stat-change up">↑ Live</span>
          </div>
          <div className="admin-stat-value">${totalRevenue.toFixed(2)}</div>
          <div className="admin-stat-label">Total Revenue</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <div className="admin-stat-icon"><ProductsIcon /></div>
          </div>
          <div className="admin-stat-value">{products.length}</div>
          <div className="admin-stat-label">Total Products</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <div className="admin-stat-icon"><UsersIcon /></div>
          </div>
          <div className="admin-stat-value">{uniqueCustomers}</div>
          <div className="admin-stat-label">Customers</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-table-container">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Recent Orders</h3>
        </div>
        {ordersLoading ? (
          <div className="admin-empty">
            <div className="admin-loading-spinner" />
            <p>Loading orders...</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📦</div>
            <div className="admin-empty-text">No orders yet</div>
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
              {recentOrders.map(order => (
                <tr key={order.id}>
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
                  <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                  <td style={{ fontSize: '13px' }}>
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
