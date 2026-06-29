// ─── Firebase Configuration ─────────────────────────────────
// 
// HOW TO SET UP:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Go to Project Settings → General → Your apps → Add web app
// 4. Copy the firebaseConfig object and paste below
// 5. Enable Authentication → Sign-in method → Google
// 6. Enable Cloud Firestore → Create database (Start in test mode)
//
// ─────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ─── Admin Emails ───────────────────────────────────────────
// Add the Google email addresses that should have admin access
// Read from environment variable as a comma-separated list, falling back to local default
const envAdminEmails = import.meta.env.VITE_ADMIN_EMAILS;
export const ADMIN_EMAILS = envAdminEmails
  ? envAdminEmails.split(',').map(email => email.trim().toLowerCase())
  : ['azharjustin37@gmail.com'];

export const isAdmin = (user) => {
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email.toLowerCase())
}

// ─── Initialize Firebase ────────────────────────────────────
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export default app
