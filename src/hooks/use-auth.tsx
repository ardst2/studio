// src/hooks/use-auth.tsx
"use client";

import type { User as AuthUser } from 'firebase/auth'; // Firebase Auth User type
import type { User as AppUser } from '@/types/user'; // Your app's User type
import { auth, GoogleAuthProvider, firebaseSignInWithPopup, firebaseSignOut } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: AuthUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "Airdrop Hunter",
          photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'A').charAt(0)}`,
          role: "Pemburu Airdrop", // Default role
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await firebaseSignInWithPopup(auth, provider);
      if (result && result.user) {
         // setUser is handled by onAuthStateChanged
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., show toast)
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // setUser to null is handled by onAuthStateChanged
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
