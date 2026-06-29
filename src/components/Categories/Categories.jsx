import { CATEGORIES } from '../../data/products'
import './Categories.css'

export default function Categories({ activeCategory, setActiveCategory, productCount }) {
  return (
    <section className="categories-section" id="collection">
      <div className="section-header">
        <div>
          <div className="section-label">Our Collection</div>
          <h2 className="section-title">Featured Sneakers</h2>
        </div>
        <div className="section-count">
          {productCount} {productCount === 1 ? 'product' : 'products'}
        </div>
      </div>
      <div className="categories-list" id="categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            id={`category-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </section>
  )
}
