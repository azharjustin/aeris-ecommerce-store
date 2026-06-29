import { ArrowRightIcon } from '../common/Icons'
import { heroSneaker } from '../../data/products'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        <div className="hero-grid-overlay" />
      </div>
      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            2026 Summer Collection
          </div>
          <h1 className="hero-title">
            Step Into{' '}
            <span className="hero-title-gradient">Greatness</span>
          </h1>
          <p className="hero-description">
            Discover exclusive, limited-edition sneakers crafted for those who demand excellence. 
            Engineered with cutting-edge technology and premium materials.
          </p>
          <div className="hero-actions">
            <a href="#collection" className="btn btn-primary" id="hero-cta">
              Shop Collection <ArrowRightIcon />
            </a>
            <a href="#new-arrivals" className="btn btn-secondary" id="hero-secondary-cta">
              New Arrivals
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hero-stat-number">500+</div>
              <div className="hero-stat-label">Styles</div>
            </div>
            <div>
              <div className="hero-stat-number">50K+</div>
              <div className="hero-stat-label">Customers</div>
            </div>
            <div>
              <div className="hero-stat-number">4.9</div>
              <div className="hero-stat-label">Rating</div>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <img src={heroSneaker} alt="AERIS Premium Sneaker — 2026 Summer Collection" />
        </div>
      </div>
    </section>
  )
}
