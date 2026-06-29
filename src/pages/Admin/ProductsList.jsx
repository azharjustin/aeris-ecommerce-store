import { useState } from 'react'
import { useProducts } from '../../context/ProductContext'
import { PlusIcon, EditIcon, TrashIcon, XIcon } from '../../components/common/Icons'
import ProductForm from './ProductForm'

export default function ProductsList() {
  const { products, deleteProduct } = useProducts()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteProduct(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">{products.length} products in catalog</p>
        </div>
        <button className="admin-add-btn" onClick={handleAdd} id="add-product-btn">
          <PlusIcon /> Add Product
        </button>
      </div>

      <div className="admin-table-container">
        {products.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📦</div>
            <div className="admin-empty-text">No products yet</div>
            <p style={{ color: 'var(--text-muted)' }}>Click &quot;Add Product&quot; to create your first product</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Badge</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-table-product">
                      {product.image && <img src={product.image} alt="" className="admin-table-product-img" />}
                      <div>
                        <div className="admin-table-product-name">{product.name}</div>
                        <div className="admin-table-product-brand">{product.brand || 'AERIS'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${Number(product.price).toFixed(2)}</span>
                    {product.originalPrice && (
                      <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '8px', fontSize: '12px' }}>
                        ${Number(product.originalPrice).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td>
                    {product.badge ? (
                      <span className={`status-badge ${product.badge}`}>{product.badge}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ color: 'var(--warning)' }}>★</span> {product.rating || '—'}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn" onClick={() => handleEdit(product)} title="Edit" aria-label="Edit product">
                        <EditIcon />
                      </button>
                      <button className="admin-action-btn danger" onClick={() => setDeleteConfirm(product)} title="Delete" aria-label="Delete product">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null) }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Delete Product</h3>
              <button className="cart-close" onClick={() => setDeleteConfirm(null)}>
                <XIcon />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-delete-confirm">
                <p>Are you sure you want to delete</p>
                <strong>{deleteConfirm.name}</strong>
                <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
