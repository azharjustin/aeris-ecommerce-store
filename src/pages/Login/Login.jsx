import { useState } from 'react'
import { useNavigate, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GoogleIcon } from '../../components/common/Icons'
import './Login.css'

export default function Login() {
  const { user, isAdmin, signInWithGoogle, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState(null)
  const [signingIn, setSigningIn] = useState(false)

  const from = location.state?.from || '/'

  // Already logged in → redirect
  if (!loading && user) {
    return <Navigate to={isAdmin ? '/admin' : from} replace />
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please try again.')
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-grid-overlay" />
      </div>

      <div className="login-card">
        <div className="login-logo">AERIS</div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to access your account, track orders, and checkout faster.</p>

        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          className="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          id="google-signin"
        >
          {signingIn ? (
            <span className="login-spinner" />
          ) : (
            <GoogleIcon />
          )}
          {signingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="login-divider">
          <span>Secure authentication</span>
        </div>

        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature-icon">🔒</span>
            <div>
              <strong>Secure & Private</strong>
              <p>Your data is encrypted and never shared</p>
            </div>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">⚡</span>
            <div>
              <strong>One-Click Checkout</strong>
              <p>Save your preferences for faster shopping</p>
            </div>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">📦</span>
            <div>
              <strong>Order Tracking</strong>
              <p>Track all your orders in one place</p>
            </div>
          </div>
        </div>

        <p className="login-footer-text">
          By signing in, you agree to our{' '}
          <a href="#">Terms of Service</a> and{' '}
          <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
