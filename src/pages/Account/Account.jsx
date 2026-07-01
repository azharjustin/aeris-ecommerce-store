import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../../config/firebase'
import useScrollReveal from '../../hooks/useScrollReveal'
import MyOrders from '../MyOrders/MyOrders'
import { UserIcon, OrdersIcon, TruckIcon, TrashIcon, PlusIcon } from '../../components/common/Icons'
import './Account.css'

export default function Account() {
  const { user, signOut } = useAuth()
  const { wishlistCount } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'profile')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  useScrollReveal([activeTab, addresses, showAddForm])
  const [newAddress, setNewAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  })

  // Sync tab selection with location state updates (e.g. navigation clicks)
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab)
    }
  }, [location.state])



  // Fetch addresses from firestore
  const fetchAddresses = useCallback(async () => {
    if (!user) return
    setLoadingAddresses(true)
    try {
      const docRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists() && docSnap.data().addresses) {
        setAddresses(docSnap.data().addresses)
      } else {
        setAddresses([])
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
    } finally {
      setLoadingAddresses(false)
    }
  }, [user])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  // Update profile display name
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) return
    setUpdating(true)
    setMsg({ type: '', text: '' })
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
        })
        
        // Also update name in the user document in firestore
        const userDocRef = doc(db, 'users', user.uid)
        await setDoc(userDocRef, { displayName: displayName.trim() }, { merge: true })
        
        setMsg({ type: 'success', text: 'Profile updated successfully!' })
      }
    } catch (err) {
      console.error('Profile update error:', err)
      setMsg({ type: 'error', text: 'Failed to update profile. Try again.' })
    } finally {
      setUpdating(false)
    }
  }

  // Add new address
  const handleAddAddress = async (e) => {
    e.preventDefault()
    if (!newAddress.line1.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pincode.trim()) {
      alert('Please fill all required fields')
      return
    }

    const updated = [...addresses, { ...newAddress, id: `addr_${Date.now()}` }]
    try {
      const docRef = doc(db, 'users', user.uid)
      await setDoc(docRef, { addresses: updated }, { merge: true })
      setAddresses(updated)
      setShowAddForm(false)
      setNewAddress({
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      })
    } catch (err) {
      console.error('Error saving address:', err)
      alert('Failed to save address')
    }
  }

  // Delete address
  const handleDeleteAddress = async (id) => {
    const updated = addresses.filter(addr => addr.id !== id)
    try {
      const docRef = doc(db, 'users', user.uid)
      await setDoc(docRef, { addresses: updated }, { merge: true })
      setAddresses(updated)
    } catch (err) {
      console.error('Error deleting address:', err)
      alert('Failed to delete address')
    }
  }

  if (!user) {
    return (
      <div className="account-page">
        <div className="account-container login-required-container">
          <div className="login-required-card reveal">
            <div className="login-required-icon-wrap">
              <span className="login-required-icon">🔒</span>
            </div>
            <h2 className="login-required-title">Profile Access Restricted</h2>
            <p className="login-required-desc">
              Please sign in to access your profile settings, view saved addresses, and manage your account details.
            </p>
            <button 
              className="btn btn-primary login-required-btn"
              onClick={() => navigate('/login', { state: { from: '/account' } })}
              id="account-login-btn"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="account-page">
      <div className="account-container">
        
        {/* Profile Card Header */}
        <div className="account-hero-card">
          <div className="account-hero-left">
            <div className="account-avatar-wrapper">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
              ) : (
                <div className="account-avatar-fallback"><UserIcon /></div>
              )}
            </div>
            <div className="account-hero-meta">
              <h2>{user.displayName || 'Aeris Customer'}</h2>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="account-hero-stats">
            <div className="stat-box">
              <span className="stat-val">{wishlistCount}</span>
              <span className="stat-lbl">Wishlist</span>
            </div>
            <button className="btn btn-sm btn-secondary signout-btn" onClick={() => signOut()}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Layout: Sidebar + Content */}
        <div className="account-layout">
          
          {/* Navigation Sidebar */}
          <div className="account-sidebar">
            {[
              { id: 'profile', label: 'Profile Settings', icon: <UserIcon /> },
              { id: 'orders', label: 'My Orders', icon: <OrdersIcon /> },
              { id: 'addresses', label: 'Saved Addresses', icon: <TruckIcon /> },
            ].map(tab => (
              <button
                key={tab.id}
                className={`sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panel */}
          <div className="account-content">
            
            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <div className="account-panel reveal">
                <h3 className="panel-title">Account Details</h3>
                <form onSubmit={handleUpdateProfile} className="profile-form">
                  <div className="form-field">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input disabled"
                      value={user.email}
                      disabled
                      title="Email cannot be changed (Google Auth)"
                    />
                    <span className="field-hint">Managed via Google Sign-In</span>
                  </div>

                  {msg.text && (
                    <div className={`form-msg ${msg.type}`}>
                      {msg.text}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary profile-save-btn" disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: ORDERS */}
            {activeTab === 'orders' && (
              <div className="account-orders-embedded">
                <MyOrders />
              </div>
            )}

            {/* TAB 3: ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="account-panel reveal">
                <div className="panel-header-row">
                  <h3 className="panel-title">Saved Delivery Addresses</h3>
                  {!showAddForm && (
                    <button className="btn btn-xs btn-primary add-addr-toggle" onClick={() => setShowAddForm(true)}>
                      <PlusIcon /> Add Address
                    </button>
                  )}
                </div>

                {showAddForm ? (
                  <form onSubmit={handleAddAddress} className="address-form reveal">
                    <div className="form-field">
                      <label className="form-label">Address Line 1</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Street, building, area"
                        value={newAddress.line1}
                        onChange={e => setNewAddress(p => ({ ...p, line1: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Apartment, floor, landmark"
                        value={newAddress.line2}
                        onChange={e => setNewAddress(p => ({ ...p, line2: e.target.value }))}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Mumbai"
                          value={newAddress.city}
                          onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Maharashtra"
                          value={newAddress.state}
                          onChange={e => setNewAddress(p => ({ ...p, state: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label className="form-label">PIN Code</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="400001"
                          value={newAddress.pincode}
                          onChange={e => setNewAddress(p => ({ ...p, pincode: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newAddress.country}
                          onChange={e => setNewAddress(p => ({ ...p, country: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="address-form-actions">
                      <button type="submit" className="btn btn-sm btn-primary">
                        Save Address
                      </button>
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : loadingAddresses ? (
                  <p className="addr-loading">Loading saved addresses...</p>
                ) : addresses.length === 0 ? (
                  <div className="addr-empty">
                    <p>No saved addresses found. Add an address to make your checkouts faster!</p>
                  </div>
                ) : (
                  <div className="addresses-grid">
                    {addresses.map(addr => (
                      <div key={addr.id} className="address-card">
                        <div className="addr-details">
                          <p className="addr-main">{addr.line1}</p>
                          {addr.line2 && <p className="addr-sub">{addr.line2}</p>}
                          <p className="addr-sub">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="addr-country">{addr.country}</p>
                        </div>
                        <button className="addr-delete-btn" onClick={() => handleDeleteAddress(addr.id)} title="Delete address">
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}
