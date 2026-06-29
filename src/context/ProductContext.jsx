import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { DEFAULT_PRODUCTS } from '../data/products'

const ProductContext = createContext(null)

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [firestoreProducts, setFirestoreProducts] = useState([])
  const [useFirestore, setUseFirestore] = useState(false)
  const [loading, setLoading] = useState(true)

  // Try to sync with Firestore
  useEffect(() => {
    let unsubscribe = () => {}
    try {
      unsubscribe = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          if (!snapshot.empty) {
            const fsProducts = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            setFirestoreProducts(fsProducts)
            setProducts(fsProducts)
            setUseFirestore(true)
          } else {
            // Firestore empty, use defaults
            setProducts(DEFAULT_PRODUCTS)
            setUseFirestore(false)
          }
          setLoading(false)
        },
        (error) => {
          console.warn('Firestore products not available, using defaults:', error.message)
          setProducts(DEFAULT_PRODUCTS)
          setUseFirestore(false)
          setLoading(false)
        }
      )
    } catch (error) {
      console.warn('Firestore not configured, using default products')
      setProducts(DEFAULT_PRODUCTS)
      setLoading(false)
    }

    return unsubscribe
  }, [])

  const addProduct = useCallback(async (productData) => {
    try {
      await addDoc(collection(db, 'products'), productData)
    } catch (error) {
      console.error('Error adding product:', error)
      // Fallback: add locally
      const newProduct = { ...productData, id: `local_${Date.now()}` }
      setProducts((prev) => [...prev, newProduct])
    }
  }, [])

  const updateProduct = useCallback(async (productId, updates) => {
    try {
      await updateDoc(doc(db, 'products', productId), updates)
    } catch (error) {
      console.error('Error updating product:', error)
      // Fallback: update locally
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
      )
    }
  }, [])

  const deleteProduct = useCallback(async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId))
    } catch (error) {
      console.error('Error deleting product:', error)
      // Fallback: delete locally
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    }
  }, [])

  const value = {
    products,
    loading,
    useFirestore,
    addProduct,
    updateProduct,
    deleteProduct,
  }

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (!context) throw new Error('useProducts must be used within ProductProvider')
  return context
}
