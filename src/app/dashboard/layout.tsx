// src/app/dashboard/layout.tsx
import { ReactNode } from 'react';
// import Loader from '@/components/ui/loader'; // Loader might not be needed if suspense is simple

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {/* Suspense can be used here if children are server components fetching data */}
      {/* <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader variant="page" size="lg" /></div>}> */}
      {children}
      {/* </Suspense> */}
    </>
  );
}
