import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import './Checkout.css'

// ── Generate a human-readable order code ────────────────────
function generateOrderCode() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `AER-${date}-${rand}`
}

const STEPS = ['Your Details', 'Delivery Address', 'Payment']

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { cart, cartTotal, clearCart, showToast } = useCart()
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [placing, setPlacing] = useState(false)

  // Step 1 — Details
  const [details, setDetails] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
  })

  // Step 2 — Address
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  })

  // Step 3 — Payment
  const [payment, setPayment] = useState({
    method: 'cod',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    upiId: '',
  })

  const [errors, setErrors] = useState({})

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(-1)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (!user) navigate('/login')
    if (cart.length === 0) navigate('/')
  }, [])

  // Load user's saved addresses from Firestore (with localStorage fallback)
  useEffect(() => {
    if (!user) return
    const fetchSavedAddresses = async () => {
      setLoadingAddresses(true)
      try {
        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists() && docSnap.data().addresses) {
          setSavedAddresses(docSnap.data().addresses)
        } else {
          setSavedAddresses([])
        }
      } catch (err) {
        console.warn('Addresses not available from firestore checkout, using local fallback:', err.message)
        try {
          const local = JSON.parse(localStorage.getItem(`addresses_${user.uid}`) || '[]')
          setSavedAddresses(local)
        } catch {
          setSavedAddresses([])
        }
      } finally {
        setLoadingAddresses(false)
      }
    }
    fetchSavedAddresses()
  }, [user])

  const handleSelectSavedAddress = (idx) => {
    setSelectedAddressIdx(idx)
    if (idx === -1) {
      setAddress({
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      })
    } else {
      const selected = savedAddresses[idx]
      setAddress({
        line1: selected.line1 || '',
        line2: selected.line2 || '',
        city: selected.city || '',
        state: selected.state || '',
        pincode: selected.pincode || '',
        country: selected.country || 'India',
      })
    }
    // Clear validation errors
    setErrors(prev => ({
      ...prev,
      line1: undefined,
      city: undefined,
      state: undefined,
      pincode: undefined,
    }))
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal > 200 ? 0 : 12.99
  const total = subtotal + shipping

  // ── Validation ──────────────────────────────────────────
  const validateStep = () => {
    const e = {}
    if (step === 0) {
      if (!details.name.trim()) e.name = 'Full name is required'
      if (!details.email.trim() || !/\S+@\S+\.\S+/.test(details.email)) e.email = 'Valid email is required'
      if (!details.phone.trim() || !/^\d{10}$/.test(details.phone)) e.phone = 'Enter a valid 10-digit mobile number'
    }
    if (step === 1) {
      if (!address.line1.trim()) e.line1 = 'Address is required'
      if (!address.city.trim()) e.city = 'City is required'
      if (!address.state.trim()) e.state = 'State is required'
      if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode)) e.pincode = 'Enter a valid 6-digit PIN code'
    }
    if (step === 2) {
      if (payment.method === 'card') {
        if (!payment.cardNumber.replace(/\s/g, '') || payment.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number'
        if (!payment.cardExpiry || !/^\d{2}\/\d{2}$/.test(payment.cardExpiry)) e.cardExpiry = 'Enter expiry as MM/YY'
        if (!payment.cardCvv || !/^\d{3,4}$/.test(payment.cardCvv)) e.cardCvv = 'Enter a valid CVV'
      }
      if (payment.method === 'upi') {
        if (!payment.upiId.trim() || !payment.upiId.includes('@')) e.upiId = 'Enter a valid UPI ID (e.g. name@upi)'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1)
  }

  const handleBack = () => {
    setErrors({})
    setStep(s => s - 1)
  }

  // ── Place Order ─────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validateStep()) return
    setPlacing(true)
    const orderCode = generateOrderCode()
    const order = {
      userId: user.uid,
      userEmail: user.email,
      userName: details.name,
      userPhone: details.phone,
      address,
      paymentMethod: payment.method,
      items: cart.map(item => ({
        id: item.id,
        key: item.key,
        name: item.name,
        price: item.price,
        qty: item.qty,
        size: item.size,
        color: item.color,
        image: item.image,
      })),
      subtotal,
      shipping,
      total,
      orderCode,
      status: 'confirmed',
      createdAt: serverTimestamp(),
    }

    try {
      await addDoc(collection(db, 'orders'), order)
      
      // Save address to user profile (non-blocking)
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userSnap = await getDoc(userDocRef)
          const currentAddresses = userSnap.exists() && userSnap.data().addresses ? userSnap.data().addresses : []
          const exists = currentAddresses.some(addr => 
            addr.line1?.toLowerCase().trim() === address.line1?.toLowerCase().trim() &&
            addr.city?.toLowerCase().trim() === address.city?.toLowerCase().trim() &&
            addr.pincode?.toLowerCase().trim() === address.pincode?.toLowerCase().trim()
          )
          
          if (!exists) {
            const newAddr = {
              ...address,
              id: `addr_${Date.now()}`
            }
            await setDoc(userDocRef, { addresses: [...currentAddresses, newAddr] }, { merge: true })
          }
        } catch (addrErr) {
          console.warn('Could not auto-save address to user profile:', addrErr.message)
        }
      }

      clearCart()
      showToast('Order placed successfully! 🎉')
      navigate('/order-success', { state: { orderCode }, replace: true })
    } catch (err) {
      console.error('Order error:', err)
      const local = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
      local.push({ ...order, createdAt: new Date().toISOString() })
      localStorage.setItem('aeris_orders', JSON.stringify(local))
      clearCart()
      showToast('Order placed successfully! 🎉')
      navigate('/order-success', { state: { orderCode }, replace: true })
    } finally {
      setPlacing(false)
    }
  }

  // ── Input helpers ────────────────────────────────────────
  const field = (label, key, obj, setObj, type = 'text', placeholder = '', extra = {}) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className={`form-input ${errors[key] ? 'error' : ''}`}
        type={type}
        value={obj[key]}
        placeholder={placeholder || label}
        onChange={e => {
          setObj(prev => ({ ...prev, [key]: e.target.value }))
          if (errors[key]) setErrors(ev => ({ ...ev, [key]: undefined }))
          if (setObj === setAddress) {
            setSelectedAddressIdx(-1)
          }
        }}
        {...extra}
      />
      {errors[key] && <span className="form-error">{errors[key]}</span>}
    </div>
  )

  const formatCard = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = v => {
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* Left — Form */}
        <div className="checkout-form-col">

          {/* Header */}
          <div className="checkout-header">
            <Link to="/" className="checkout-logo">AERIS</Link>
            <div className="checkout-title">Checkout</div>
          </div>

          {/* Progress bar */}
          <div className="checkout-progress">
            {STEPS.map((label, i) => (
              <div key={i} className={`progress-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
                <div className="progress-dot">
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="progress-label">{label}</span>
                {i < STEPS.length - 1 && <div className={`progress-line ${i < step ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          {/* Step 1 — Details */}
          {step === 0 && (
            <div className="form-step" key="step0">
              <h2 className="step-title">Your Details</h2>
              {field('Full Name', 'name', details, setDetails, 'text', 'John Doe')}
              {field('Email Address', 'email', details, setDetails, 'email', 'john@example.com', { readOnly: !!user?.email })}
              {field('Mobile Number', 'phone', details, setDetails, 'tel', '10-digit number')}
            </div>
          )}

          {/* Step 2 — Address */}
          {step === 1 && (
            <div className="form-step" key="step1">
              <h2 className="step-title">Delivery Address</h2>

              {/* Saved Address Selection */}
              {savedAddresses.length > 0 && (
                <div className="checkout-saved-addresses-section">
                  <label className="form-label">Deliver to a Saved Address</label>
                  <div className="checkout-saved-addresses-grid">
                    {savedAddresses.map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        className={`checkout-saved-address-card ${selectedAddressIdx === idx ? 'active' : ''}`}
                        onClick={() => handleSelectSavedAddress(idx)}
                      >
                        <span className="saved-addr-marker">
                          {selectedAddressIdx === idx ? '●' : '○'}
                        </span>
                        <div className="saved-addr-content">
                          <strong>Address {idx + 1}</strong>
                          <div>{addr.line1}</div>
                          {addr.line2 && <div className="text-muted" style={{ fontSize: '11px' }}>{addr.line2}</div>}
                          <div>{addr.city}, {addr.state}–{addr.pincode}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{addr.country}</div>
                        </div>
                      </div>
                    ))}

                    <div
                      className={`checkout-saved-address-card new-addr-card ${selectedAddressIdx === -1 ? 'active' : ''}`}
                      onClick={() => handleSelectSavedAddress(-1)}
                    >
                      <span className="saved-addr-marker">
                        {selectedAddressIdx === -1 ? '●' : '○'}
                      </span>
                      <div className="saved-addr-content">
                        <strong>+ Deliver to a New Address</strong>
                        <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                          Fill out the delivery fields below manually.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {field('Address Line 1', 'line1', address, setAddress, 'text', 'Street, building, area')}
              {field('Address Line 2 (optional)', 'line2', address, setAddress, 'text', 'Apartment, floor, landmark')}
              <div className="form-row">
                {field('City', 'city', address, setAddress, 'text', 'Mumbai')}
                {field('State', 'state', address, setAddress, 'text', 'Maharashtra')}
              </div>
              <div className="form-row">
                {field('PIN Code', 'pincode', address, setAddress, 'text', '400001')}
                {field('Country', 'country', address, setAddress, 'text', 'India')}
              </div>
            </div>
          )}

          {/* Step 3 — Payment */}
          {step === 2 && (
            <div className="form-step" key="step2">
              <h2 className="step-title">Payment Method</h2>
              <div className="payment-methods">
                {PAYMENT_METHODS.map(pm => (
                  <label
                    key={pm.id}
                    className={`payment-method-card ${payment.method === pm.id ? 'active' : ''}`}
                    htmlFor={`pm-${pm.id}`}
                  >
                    <input
                      type="radio"
                      id={`pm-${pm.id}`}
                      name="payment-method"
                      value={pm.id}
                      checked={payment.method === pm.id}
                      onChange={() => setPayment(p => ({ ...p, method: pm.id }))}
                    />
                    <span className="pm-icon">{pm.icon}</span>
                    <span className="pm-label">{pm.label}</span>
                    <span className="pm-check">{payment.method === pm.id ? '●' : '○'}</span>
                  </label>
                ))}
              </div>

              {payment.method === 'card' && (
                <div className="card-fields">
                  <div className="form-field">
                    <label className="form-label">Card Number</label>
                    <input
                      className={`form-input ${errors.cardNumber ? 'error' : ''}`}
                      type="text"
                      value={payment.cardNumber}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      onChange={e => setPayment(p => ({ ...p, cardNumber: formatCard(e.target.value) }))}
                    />
                    {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">Expiry (MM/YY)</label>
                      <input
                        className={`form-input ${errors.cardExpiry ? 'error' : ''}`}
                        type="text"
                        value={payment.cardExpiry}
                        placeholder="MM/YY"
                        maxLength={5}
                        onChange={e => setPayment(p => ({ ...p, cardExpiry: formatExpiry(e.target.value) }))}
                      />
                      {errors.cardExpiry && <span className="form-error">{errors.cardExpiry}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">CVV</label>
                      <input
                        className={`form-input ${errors.cardCvv ? 'error' : ''}`}
                        type="password"
                        value={payment.cardCvv}
                        placeholder="•••"
                        maxLength={4}
                        onChange={e => setPayment(p => ({ ...p, cardCvv: e.target.value.replace(/\D/g, '') }))}
                      />
                      {errors.cardCvv && <span className="form-error">{errors.cardCvv}</span>}
                    </div>
                  </div>
                </div>
              )}

              {payment.method === 'upi' && (
                <div className="upi-field">
                  <div className="form-field">
                    <label className="form-label">UPI ID</label>
                    <input
                      className={`form-input ${errors.upiId ? 'error' : ''}`}
                      type="text"
                      value={payment.upiId}
                      placeholder="yourname@upi"
                      onChange={e => setPayment(p => ({ ...p, upiId: e.target.value }))}
                    />
                    {errors.upiId && <span className="form-error">{errors.upiId}</span>}
                  </div>
                </div>
              )}

              {payment.method === 'cod' && (
                <div className="cod-note">
                  <span>💵</span>
                  <p>Pay in cash when your order arrives. Our delivery partner will collect the payment.</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="step-actions">
            {step > 0 && (
              <button className="btn-step-back" onClick={handleBack}>
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn-step-next" onClick={handleNext} id="checkout-next-btn">
                Continue →
              </button>
            ) : (
              <button
                className="btn-place-order"
                onClick={handlePlaceOrder}
                disabled={placing}
                id="place-order-btn"
              >
                {placing ? (
                  <span className="spinner-inline" />
                ) : (
                  `Place Order — $${total.toFixed(2)}`
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right — Order Summary */}
        <div className="checkout-summary-col">
          <div className="order-summary">
            <h3 className="summary-title">Order Summary</h3>
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.key} className="summary-item">
                  <div className="summary-item-img-wrap">
                    <img src={item.image} alt={item.name} className="summary-item-img" />
                    <span className="summary-item-qty">{item.qty}</span>
                  </div>
                  <div className="summary-item-info">
                    <div className="summary-item-name">{item.name}</div>
                    <div className="summary-item-meta">
                      {item.color}
                      {item.size && ` · Size ${item.size}`}
                    </div>
                  </div>
                  <div className="summary-item-price">${(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="summary-divider" />
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span style={{ color: 'var(--success)' }}>Free</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            {shipping > 0 && (
              <div className="summary-free-ship-note">
                Add ${(200 - subtotal).toFixed(2)} more for free shipping
              </div>
            )}
            <div className="summary-divider" />
            <div className="summary-total-row">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
