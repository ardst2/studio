// src/app/login/page.tsx
"use client";

import GoogleSignInButton from '@/components/auth/google-signin-button';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

function LoginPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="gradient-spinner"></div>
        <p className="mt-4 text-lg text-foreground">Loading AirdropAce...</p>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <Image 
          src="https://placehold.co/120x120.png?text=AA" 
          alt="AirdropAce Logo" 
          width={120} 
          height={120} 
          className="mx-auto rounded-2xl shadow-lg"
          data-ai-hint="rocket abstract" 
        />
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome to Airdrop<span className="text-primary">Ace</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your ultimate tool for tracking and managing Web3 airdrop opportunities.
          </p>
        </div>
        <div className="rounded-xl bg-card p-8 shadow-2xl">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">Get Started</h2>
          <GoogleSignInButton />
        </div>
        <p className="text-sm text-muted-foreground">
          By signing in, you agree to our (non-existent) Terms of Service.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  );
}
