import { ArrowRightIcon } from '../common/Icons'
import './FeaturedBanner.css'

export default function FeaturedBanner() {
  return (
    <div className="featured-banner reveal" id="sale">
      <div className="featured-text">
        <div className="featured-label">Limited Time Offer</div>
        <h2 className="featured-title">Summer Sale — Up to 40% Off</h2>
        <p className="featured-desc">
          Don&apos;t miss out on our biggest sale of the season. Premium sneakers at unbeatable prices.
        </p>
        <button className="btn btn-white" id="sale-cta">
          Shop Sale <ArrowRightIcon />
        </button>
      </div>
    </div>
  )
}
