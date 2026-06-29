import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <div className="footer-brand-logo">AERIS</div>
          <p className="footer-brand-desc">
            Premium sneakers for those who demand excellence. Crafted with passion, 
            engineered with innovation.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="YouTube">🎬</a>
            <a href="#" aria-label="TikTok">🎵</a>
          </div>
        </div>

        <div>
          <h3 className="footer-column-title">Shop</h3>
          <div className="footer-links">
            <a href="#">New Arrivals</a>
            <a href="#">Best Sellers</a>
            <a href="#">Running</a>
            <a href="#">Lifestyle</a>
            <a href="#">Sale</a>
          </div>
        </div>

        <div>
          <h3 className="footer-column-title">Support</h3>
          <div className="footer-links">
            <a href="#">Shipping</a>
            <a href="#">Returns</a>
            <a href="#">Size Guide</a>
            <a href="#">FAQ</a>
            <a href="#">Contact Us</a>
          </div>
        </div>

        <div>
          <h3 className="footer-column-title">Company</h3>
          <div className="footer-links">
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Sustainability</a>
            <a href="#">Press</a>
            <a href="#">Blog</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="footer-copyright">© 2026 AERIS. All rights reserved.</span>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Settings</a>
        </div>
      </div>
    </footer>
  )
}
