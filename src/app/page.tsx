// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function HomePageContent() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

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

export default function HomePage() {
  return <HomePageContent />;
}
