// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/hooks/use-auth'; // Import AuthProvider
import { Skeleton } from '@/components/ui/skeleton';

function HomePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

// Wrap HomePageContent with AuthProvider at this level or higher (RootLayout if preferred)
export default function HomePage() {
  return (
    <AuthProvider>
      <HomePageContent />
    </AuthProvider>
  );
}
