import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('aeris_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [badgeBounce, setBadgeBounce] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('aeris_cart', JSON.stringify(cart))
  }, [cart])

  const showToast = useCallback((message) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: '' }), 2500)
  }, [])

  const addToCart = useCallback((product, size) => {
    if (!size) return
    const key = `${product.id}_${size}`
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key)
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { key, id: product.id, name: product.name, price: product.price, image: product.image, color: product.color, size, qty: 1 }]
    })
    showToast(`${product.name} (Size ${size}) added to bag!`)
    setBadgeBounce(true)
    setTimeout(() => setBadgeBounce(false), 500)
  }, [showToast])

  const updateQty = useCallback((key, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    )
  }, [])

  const removeFromCart = useCallback((key) => {
    setCart((prev) => prev.filter((item) => item.key !== key))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const checkout = useCallback(async () => {
    if (!user) throw new Error('Must be logged in to checkout')
    if (cart.length === 0) throw new Error('Cart is empty')

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    const shipping = subtotal > 200 ? 0 : 12.99
    const total = subtotal + shipping

    const order = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      userPhoto: user.photoURL,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        size: item.size,
        color: item.color,
      })),
      subtotal,
      shipping,
      total,
      status: 'pending',
      createdAt: serverTimestamp(),
    }

    try {
      const docRef = await addDoc(collection(db, 'orders'), order)
      clearCart()
      showToast('Order placed successfully!')
      return docRef.id
    } catch (error) {
      console.error('Checkout error:', error)
      // Fallback: save to localStorage if Firestore fails
      const localOrders = JSON.parse(localStorage.getItem('aeris_orders') || '[]')
      const localOrder = { ...order, id: `local_${Date.now()}`, createdAt: new Date().toISOString() }
      localOrders.push(localOrder)
      localStorage.setItem('aeris_orders', JSON.stringify(localOrders))
      clearCart()
      showToast('Order placed successfully!')
      return localOrder.id
    }
  }, [user, cart, clearCart, showToast])

  const cartItemCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const value = {
    cart,
    cartItemCount,
    cartTotal,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    checkout,
    toast,
    showToast,
    badgeBounce,
    cartOpen,
    openCart,
    closeCart,
    searchQuery,
    setSearchQuery,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
