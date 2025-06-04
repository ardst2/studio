// src/app/dashboard/layout.tsx
"use client"; // This layout component can be a client component if it uses hooks directly

import { AuthProvider } from '@/hooks/use-auth';
import { ReactNode, Suspense } from 'react';
import Loader from '@/components/ui/loader';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      {/* Suspense can be used here if children are server components fetching data */}
      {/* <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader variant="page" size="lg" /></div>}> */}
        {children}
      {/* </Suspense> */}
    </AuthProvider>
  );
}
