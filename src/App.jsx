import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ProductProvider } from './context/ProductContext'
import { useCart } from './context/CartContext'
import Navbar from './components/Navbar/Navbar'
import CartDrawer from './components/CartDrawer/CartDrawer'
import Toast from './components/common/Toast'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Product from './pages/Product/Product'
import Checkout from './pages/Checkout/Checkout'
import OrderSuccess from './pages/OrderSuccess/OrderSuccess'
import TrackOrder from './pages/TrackOrder/TrackOrder'
import AdminLayout from './pages/Admin/AdminLayout'
import Dashboard from './pages/Admin/Dashboard'
import OrdersList from './pages/Admin/OrdersList'
import ProductsList from './pages/Admin/ProductsList'
import './App.css'

// Global overlays — renders on every page inside CartProvider
function GlobalOverlays() {
  const { cartOpen, closeCart, toast } = useCart()

  // Lock body scroll when cart is open
  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [cartOpen])

  return (
    <>
      <CartDrawer open={cartOpen} onClose={closeCart} />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <GlobalOverlays />
          <Routes>
            {/* Store Routes — with Navbar */}
            <Route path="/" element={<><Navbar /><Home /></>} />
            <Route path="/login" element={<><Navbar /><Login /></>} />
            <Route path="/product/:id" element={<><Navbar /><Product /></>} />

            {/* Checkout & Success — with Navbar */}
            <Route path="/checkout" element={<><Navbar /><Checkout /></>} />
            <Route path="/order-success" element={<><Navbar /><OrderSuccess /></>} />
            <Route path="/track-order" element={<><Navbar /><TrackOrder /></>} />

            {/* Admin Routes — own layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="products" element={<ProductsList />} />
            </Route>
          </Routes>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  )
}

export default App
