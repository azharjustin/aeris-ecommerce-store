import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { SearchIcon, CartIcon, XIcon, MenuIcon, LogOutIcon, UserIcon, DashboardIcon, ChevronDownIcon, TruckIcon, HeartIcon, OrdersIcon } from '../common/Icons'
import './Navbar.css'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const { cartItemCount, badgeBounce, openCart, searchQuery, setSearchQuery } = useCart()
  const { wishlistCount } = useWishlist()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchInputRef = useRef(null)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleSearch = () => {
    setSearchOpen((prev) => {
      if (!prev) setTimeout(() => searchInputRef.current?.focus(), 100)
      else setSearchQuery('')
      return !prev
    })
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
  }

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        AERIS
      </Link>

      <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to="/" onClick={() => setMobileMenuOpen(false)}>Collection</Link>
        <a href="#new-arrivals" onClick={() => setMobileMenuOpen(false)}>New Arrivals</a>
        <a href="#sale" onClick={() => setMobileMenuOpen(false)}>Sale</a>
        <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
        {isAdmin && <Link to="/admin" className="nav-admin-link" onClick={() => setMobileMenuOpen(false)}>Admin</Link>}
      </div>

      <div className="navbar-actions">
        {/* Search */}
        <form className="search-container" onSubmit={handleSearchSubmit}>
          <div className={`search-input-wrapper ${searchOpen ? 'active' : ''}`}>
            <span className="search-icon-inside"><SearchIcon /></span>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search sneakers..."
              value={searchQuery}
              onChange={handleSearchChange}
              onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
              id="search-input"
            />
          </div>
          <button type="button" className="search-toggle" onClick={toggleSearch} aria-label="Toggle search" id="search-toggle">
            {searchOpen ? <XIcon /> : <SearchIcon />}
          </button>
        </form>

        {/* Wishlist */}
        <Link to="/wishlist" className="wishlist-btn-nav" aria-label="View wishlist" id="wishlist-button">
          <HeartIcon />
          {wishlistCount > 0 && (
            <span className="wishlist-badge">
              {wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart */}
        <button onClick={openCart} className="cart-btn" aria-label="Open cart" id="cart-button">
          <CartIcon />
          {cartItemCount > 0 && (
            <span className={`cart-badge ${badgeBounce ? 'bounce' : ''}`}>
              {cartItemCount}
            </span>
          )}
        </button>

        {/* User */}
        {user ? (
          <div className="user-menu-container" ref={userMenuRef}>
            <button className="user-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} id="user-menu-btn">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="user-avatar" referrerPolicy="no-referrer" />
              ) : (
                <div className="user-avatar-placeholder"><UserIcon /></div>
              )}
              <ChevronDownIcon />
            </button>
            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <span className="user-dropdown-name">{user.displayName}</span>
                  <span className="user-dropdown-email">{user.email}</span>
                </div>
                <div className="user-dropdown-divider" />
                {isAdmin && (
                  <Link to="/admin" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <DashboardIcon /> Admin Dashboard
                  </Link>
                )}
                <Link to="/account" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)} id="profile-link">
                  <UserIcon /> My Profile
                </Link>
                <Link to="/account" state={{ activeTab: 'orders' }} className="user-dropdown-item" onClick={() => setUserMenuOpen(false)} id="orders-link">
                  <OrdersIcon /> My Orders
                </Link>
                <Link to="/track-order" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)} id="track-order-link">
                  <TruckIcon /> Track Order
                </Link>
                <button className="user-dropdown-item danger" onClick={handleSignOut}>
                  <LogOutIcon /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="btn btn-sm btn-primary nav-login-btn" id="login-btn">
            Sign In
          </Link>
        )}

        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu" id="mobile-menu">
          {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
    </nav>
  )
}
