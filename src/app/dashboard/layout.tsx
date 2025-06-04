// src/app/dashboard/layout.tsx
"use client";

import { ReactNode, Suspense } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import Loader from '@/components/ui/loader';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      {/* 
        Suspense could be used here if children were Server Components fetching data.
        For client components using hooks (like useAuth for user data or useAirdropsStore for airdrops),
        loading states are typically handled within those components or their wrappers.
        If children components directly fetch data in an async server component manner,
        then Suspense here would be appropriate.
      */}
      {/* 
      Example with Suspense if children were data-fetching Server Components:
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><Loader variant="page" size="lg" /></div>}>
      */}
      {children}
      {/* 
      </Suspense> 
      */}
    </AuthProvider>
  );
}
