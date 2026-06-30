import { useState } from 'react'
import { useProducts } from '../../context/ProductContext'
import { XIcon } from '../../components/common/Icons'
import { CATEGORIES } from '../../data/products'

export default function ProductForm({ product, onClose }) {
  const { addProduct, updateProduct } = useProducts()
  const isEditing = !!product

  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || 'AERIS',
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    category: product?.category || 'Running',
    badge: product?.badge || '',
    rating: product?.rating || 4.5,
    reviews: product?.reviews || 0,
    color: product?.color || '',
    image: product?.image || '',
    description: product?.description || '',
  })

  // Sizes 6 to 10 stock mapping state
  const [stock, setStock] = useState({
    6: product?.stock?.[6] ?? 10,
    7: product?.stock?.[7] ?? 10,
    8: product?.stock?.[8] ?? 10,
    9: product?.stock?.[9] ?? 10,
    10: product?.stock?.[10] ?? 10,
  })

  // Multiple carousel images list state
  const [carouselImages, setCarouselImages] = useState(
    product?.images || (product?.image ? [product.image] : [])
  )
  const [newImageInput, setNewImageInput] = useState('')

  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleStockChange = (size, val) => {
    const qty = parseInt(val)
    setStock(prev => ({ ...prev, [size]: isNaN(qty) ? 0 : qty }))
  }

  const handleAddCarouselImage = (e) => {
    e.preventDefault()
    if (!newImageInput.trim()) return
    setCarouselImages(prev => [...prev, newImageInput.trim()])
    setNewImageInput('')
  }

  const handleRemoveCarouselImage = (idx) => {
    setCarouselImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const productData = {
      ...form,
      price: parseFloat(form.price) || 0,
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      rating: parseFloat(form.rating) || 0,
      reviews: parseInt(form.reviews) || 0,
      badge: form.badge || null,
      image: carouselImages[0] || form.image || '',
      images: carouselImages,
      stock: stock,
    }

    try {
      if (isEditing) {
        await updateProduct(product.id, productData)
      } else {
        await addProduct(productData)
      }
      onClose()
    } catch (err) {
      console.error('Error saving product:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="cart-close" onClick={onClose}>
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            <div className="admin-form-group">
              <label className="admin-form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="admin-form-input"
                placeholder="e.g. Shadow Runner X1"
                required
              />
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="AERIS"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Category *</label>
                <select name="category" value={form.category} onChange={handleChange} className="admin-form-select">
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="249.99"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Original Price</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={form.originalPrice}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="299.99 (for sale items)"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Badge</label>
                <select name="badge" value={form.badge} onChange={handleChange} className="admin-form-select">
                  <option value="">None</option>
                  <option value="new">New</option>
                  <option value="sale">Sale</option>
                  <option value="limited">Limited</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Color</label>
                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="Black / Purple"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Rating</label>
                <input
                  type="number"
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  className="admin-form-input"
                  step="0.1"
                  min="0"
                  max="5"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Reviews Count</label>
                <input
                  type="number"
                  name="reviews"
                  value={form.reviews}
                  onChange={handleChange}
                  className="admin-form-input"
                  min="0"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Image URL</label>
              <input
                type="text"
                name="image"
                value={form.image}
                onChange={handleChange}
                className="admin-form-input"
                placeholder="https://example.com/sneaker.png"
              />
              {form.image && typeof form.image === 'string' && form.image.startsWith('http') && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={form.image} alt="Preview" style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover', background: 'var(--bg-tertiary)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Image preview</span>
                </div>
              )}
            </div>

            {/* Stock Availability */}
            <div className="admin-section-divider"></div>
            <h4 className="admin-section-subtitle">Stock Availability (Sizes 6-10)</h4>
            <div className="admin-stock-grid">
              {[6, 7, 8, 9, 10].map((size) => (
                <div key={size} className="admin-stock-field">
                  <span className="admin-stock-label">US {size}</span>
                  <input
                    type="number"
                    min="0"
                    value={stock[size]}
                    onChange={(e) => handleStockChange(size, e.target.value)}
                    className="admin-stock-input"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            {/* Image Carousel */}
            <div className="admin-section-divider"></div>
            <h4 className="admin-section-subtitle">Product Carousel Gallery</h4>
            <div className="admin-carousel-manager">
              <div className="admin-carousel-input-row">
                <input
                  type="text"
                  value={newImageInput}
                  onChange={(e) => setNewImageInput(e.target.value)}
                  className="admin-form-input"
                  style={{ flex: 1 }}
                  placeholder="Paste image URL here..."
                />
                <button
                  type="button"
                  onClick={handleAddCarouselImage}
                  className="admin-carousel-btn"
                >
                  Add URL
                </button>
              </div>
              
              <div className="admin-carousel-thumbs-grid">
                {carouselImages.map((imgUrl, index) => (
                  <div key={index} className="admin-carousel-thumb-card">
                    <img src={imgUrl} alt={`Thumbnail ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => handleRemoveCarouselImage(index)}
                      className="admin-carousel-thumb-remove"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="admin-form-textarea"
                placeholder="Brief product description..."
                rows={3}
              />
            </div>
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-add-btn" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
