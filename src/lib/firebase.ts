// Mock Firebase setup for scaffolding
// In a real application, you would initialize Firebase here:
// import { initializeApp, getApp, getApps } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  // For Firebase Realtime Database or Firestore
  // databaseURL: "YOUR_DATABASE_URL", 
};

// let app;
// if (!getApps().length) {
//   app = initializeApp(firebaseConfig);
// } else {
//   app = getApp();
// }

// export const auth = getAuth(app);
// export const db = getFirestore(app);

// Mocked auth and db for now
export const auth = {
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Simulate a logged-out state initially, or a logged-in state for testing
    // To test logged-in state:
    // setTimeout(() => callback({ uid: 'mock-user-id', displayName: 'Airdrop Hunter', email: 'hunter@example.com', photoURL: 'https://placehold.co/100x100.png' }), 100);
    // To test logged-out state:
    setTimeout(() => callback(null), 100);
    return () => {}; // Unsubscribe function
  },
  signInWithPopup: async () => {
    // Simulate Google Sign-In
    return { 
      user: { 
        uid: 'mock-user-id', 
        displayName: 'Airdrop Hunter', 
        email: 'hunter@example.com', 
        photoURL: 'https://placehold.co/100x100.png' 
      } 
    };
  },
  signOut: async () => {
    // Simulate sign out
    return;
  }
};

// Mock Firestore
export const db = {};

export default firebaseConfig;
