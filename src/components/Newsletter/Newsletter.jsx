import { useCart } from '../../context/CartContext'
import './Newsletter.css'

export default function Newsletter() {
  const { showToast } = useCart()

  return (
    <section className="newsletter-section">
      <div className="newsletter-content">
        <h2 className="newsletter-title">
          Stay in the <span className="hero-title-gradient">Loop</span>
        </h2>
        <p className="newsletter-desc">
          Get exclusive access to new drops, member-only deals, and sneaker culture stories.
        </p>
        <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); showToast('Successfully subscribed!') }} id="newsletter-form">
          <input
            type="email"
            className="newsletter-input"
            placeholder="Enter your email"
            required
            id="newsletter-email"
          />
          <button type="submit" className="btn btn-primary" id="newsletter-submit">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}
