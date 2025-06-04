// src/hooks/use-auth.tsx
"use client";

import type { User } from '@/types/user';
import { auth } from '@/lib/firebase'; // Using mocked auth
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: any) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "Airdrop Hunter",
          photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'A').charAt(0)}`,
          role: "Pemburu Airdrop",
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
      // In a real app, this would be:
      // const provider = new GoogleAuthProvider();
      // await signInWithPopup(auth, provider);
      const result = await auth.signInWithPopup(); // Using mocked signInWithPopup
      if (result && result.user) {
         setUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || "Airdrop Hunter",
          photoURL: result.user.photoURL || `https://placehold.co/100x100.png?text=${(result.user.displayName || 'A').charAt(0)}`,
          role: "Pemburu Airdrop",
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., show toast)
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // await firebaseSignOut(auth); // Real sign out
      await auth.signOut(); // Mocked sign out
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
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
