
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-12 text-center"> {/* Increased max-w and space-y */}
        <Image 
          src="https://placehold.co/150x150.png?text=AA" 
          alt="AirdropAce Logo" 
          width={150} 
          height={150} 
          className="mx-auto rounded-3xl shadow-xl" // Increased rounding and shadow
          data-ai-hint="rocket abstract" 
        />
        <div>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-gradient-animated sm:text-6xl md:text-7xl">
            Assalamualaikum
          </h1>
        </div>
        <div className="rounded-xl bg-transparent p-6 flex flex-col items-center"> {/* Removed card background, adjusted padding */}
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


    