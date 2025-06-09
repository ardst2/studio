
// src/app/login/page.tsx
"use client";

import GoogleSignInButton from '@/components/auth/google-signin-button';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
        <p className="mt-4 text-lg text-foreground">Loading ArdropOne...</p>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 overflow-hidden">
      <div className="w-full max-w-xl space-y-10 text-center"> {/* Sedikit perbesar max-w, tambah space-y */}
        <div 
          className="mx-auto w-28 h-28 md:w-32 md:h-32 rounded-full shadow-2xl bg-card border-2 border-primary/30 flex items-center justify-center overflow-hidden card-gradient-glow-wrapper p-0.5"
          data-ai-hint="abstract crypto logo" 
        >
          <Image 
            src="https://placehold.co/128x128.png" 
            alt="ArdropOne Modern Logo" 
            width={128} 
            height={128}
            className="rounded-full object-cover"
          />
        </div>
        
        <div>
          <h1 className={cn(
            "font-headline text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl",
            "text-gradient-animated"
          )}>
            Assalamualaikum
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
            Masuk untuk melacak semua peluang airdrop Web3 Anda di satu tempat.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <GoogleSignInButton />
          <p className="text-xs text-muted-foreground/70">
            Dengan melanjutkan, Anda menyetujui Ketentuan Layanan (imajiner) kami.
          </p>
        </div>
      </div>
       {/* Elemen dekoratif - opsional */}
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-r from-primary/10 via-transparent to-transparent rounded-full blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-l from-accent/10 via-transparent to-transparent rounded-full blur-3xl opacity-50 animate-pulse animation-delay-2000"></div>
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
