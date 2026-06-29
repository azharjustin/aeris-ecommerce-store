import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './OrderSuccess.css'

export default function OrderSuccess() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [visible, setVisible] = useState(false)

  // orderCode comes from router state (never in the URL)
  const orderCode = state?.orderCode || '—'

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setTimeout(() => setVisible(true), 100)
  }, [])

  // Estimate delivery: 7 business days from now
  const deliveryDate = () => {
    const d = new Date()
    let count = 0
    while (count < 7) {
      d.setDate(d.getDate() + 1)
      if (d.getDay() !== 0 && d.getDay() !== 6) count++
    }
    return d.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return (
    <div className={`success-page ${visible ? 'visible' : ''}`}>
      <div className="success-card">

        {/* Animated checkmark */}
        <div className="success-icon-wrap">
          <div className="success-circle">
            <svg className="success-checkmark" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <div className="success-ring" />
        </div>

        <h1 className="success-title">Order Confirmed!</h1>
        <p className="success-subtitle">
          Your sneakers are on their way. We'll send you updates at every step.
        </p>

        <div className="success-info-grid">
          <div className="success-info-card">
            <span className="info-card-label">Order ID</span>
            <span className="info-card-value">{orderCode}</span>
          </div>
          <div className="success-info-card">
            <span className="info-card-label">Estimated Delivery</span>
            <span className="info-card-value">{deliveryDate()}</span>
          </div>
          <div className="success-info-card">
            <span className="info-card-label">Status</span>
            <span className="info-card-value status-confirmed">✓ Confirmed</span>
          </div>
          <div className="success-info-card">
            <span className="info-card-label">Payment</span>
            <span className="info-card-value">Received</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="order-timeline">
          <div className="timeline-step done">
            <div className="timeline-dot done" />
            <div className="timeline-content">
              <div className="timeline-label">Order Placed</div>
              <div className="timeline-time">Just now</div>
            </div>
          </div>
          <div className="timeline-connector done" />
          <div className="timeline-step active">
            <div className="timeline-dot active" />
            <div className="timeline-content">
              <div className="timeline-label">Processing</div>
              <div className="timeline-time">Within 24 hours</div>
            </div>
          </div>
          <div className="timeline-connector" />
          <div className="timeline-step">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-label">Shipped</div>
              <div className="timeline-time">2–3 days</div>
            </div>
          </div>
          <div className="timeline-connector" />
          <div className="timeline-step">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-label">Delivered</div>
              <div className="timeline-time">{deliveryDate()}</div>
            </div>
          </div>
        </div>

        <div className="success-actions">
          <button
            className="btn-continue-shopping"
            onClick={() => navigate('/track-order', { state: { prefill: orderCode } })}
            id="track-order-btn"
          >
            Track My Order
          </button>
          <button
            className="btn-track-secondary"
            onClick={() => navigate('/')}
            id="continue-shopping-btn"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  )
}
