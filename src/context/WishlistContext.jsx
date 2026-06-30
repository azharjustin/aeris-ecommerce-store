import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState(new Set())
  const [loading, setLoading] = useState(true)

  // Get guest wishlist from localStorage
  const getLocalWishlist = useCallback(() => {
    try {
      const saved = localStorage.getItem('aeris_wishlist')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  }, [])

  // Load guest wishlist initially or when signed out
  useEffect(() => {
    if (!user) {
      setWishlist(getLocalWishlist())
      setLoading(false)
    }
  }, [user, getLocalWishlist])

  // Sync with Firestore when logged in
  useEffect(() => {
    if (!user) return

    setLoading(true)
    const userDocRef = doc(db, 'users', user.uid)

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().wishlist) {
          setWishlist(new Set(docSnap.data().wishlist))
        } else {
          setWishlist(new Set())
        }
        setLoading(false)
      },
      (error) => {
        console.warn('Firestore wishlist fetching issue, using local:', error.message)
        setWishlist(getLocalWishlist())
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, getLocalWishlist])

  // Merge guest wishlist on login
  useEffect(() => {
    if (!user) return

    const local = localStorage.getItem('aeris_wishlist')
    if (local) {
      try {
        const localItems = JSON.parse(local)
        if (Array.isArray(localItems) && localItems.length > 0) {
          const userDocRef = doc(db, 'users', user.uid)
          
          getDoc(userDocRef)
            .then((snap) => {
              const current = snap.exists() && snap.data().wishlist ? snap.data().wishlist : []
              const merged = Array.from(new Set([...current, ...localItems]))
              return setDoc(userDocRef, { wishlist: merged }, { merge: true })
            })
            .then(() => {
              localStorage.removeItem('aeris_wishlist')
            })
            .catch((err) => {
              console.error('Error merging local wishlist to firestore:', err)
            })
        }
      } catch (e) {
        console.error('Error parsing local wishlist:', e)
      }
    }
  }, [user])

  // Toggle wishlist item
  const toggleWishlist = useCallback(
    async (productId) => {
      let nextArray = []
      setWishlist((prev) => {
        const next = new Set(prev)
        if (next.has(productId)) {
          next.delete(productId)
        } else {
          next.add(productId)
        }
        nextArray = Array.from(next)
        return next
      })

      if (user) {
        const userDocRef = doc(db, 'users', user.uid)
        try {
          await setDoc(userDocRef, { wishlist: nextArray }, { merge: true })
        } catch (err) {
          console.error('Error writing wishlist to Firestore:', err)
        }
      } else {
        localStorage.setItem('aeris_wishlist', JSON.stringify(nextArray))
      }
    },
    [user]
  )

  const isWishlisted = useCallback((productId) => wishlist.has(productId), [wishlist])

  const value = {
    wishlist,
    wishlistCount: wishlist.size,
    toggleWishlist,
    isWishlisted,
    loading,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within WishlistProvider')
  return context
}
