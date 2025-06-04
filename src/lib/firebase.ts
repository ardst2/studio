
// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup as firebaseSignInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Firebase Storage imports are removed as they are no longer used for profile pictures

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_ZN2d-3b_RuxzfU3LDnsRG6572hU2cxU",
  authDomain: "named-trilogy-457001-i1.firebaseapp.com",
  projectId: "named-trilogy-457001-i1",
  storageBucket: "named-trilogy-457001-i1.appspot.com",
  messagingSenderId: "591055461757",
  appId: "1:591055461757:web:579ff20f8aa66ee95e8014",
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);
// const storage = getStorage(app); // Storage instance is removed
export { GoogleAuthProvider, firebaseSignInWithPopup, firebaseSignOut }; // Storage related exports are removed

export default app;
