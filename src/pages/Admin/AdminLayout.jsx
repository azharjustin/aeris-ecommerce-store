import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { DashboardIcon, OrdersIcon, ProductsIcon, LogOutIcon } from '../../components/common/Icons'
import './Admin.css'

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">AERIS</div>
          <span className="admin-sidebar-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <DashboardIcon /> Dashboard
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <OrdersIcon /> Orders
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <ProductsIcon /> Products
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            {user.photoURL && <img src={user.photoURL} alt="" className="admin-user-avatar" referrerPolicy="no-referrer" />}
            <div className="admin-user-details">
              <span className="admin-user-name">{user.displayName}</span>
              <span className="admin-user-email">{user.email}</span>
            </div>
          </div>
          <button className="admin-signout-btn" onClick={signOut}>
            <LogOutIcon /> Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
