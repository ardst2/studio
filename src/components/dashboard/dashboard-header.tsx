
// src/components/dashboard/dashboard-header.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Bell, Download, LogOut } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground">Selamat Datang!</h1>
        <p className="text-md text-muted-foreground">Berikut ringkasan airdrop Anda.</p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Download">
          <Download className="h-5 w-5 text-foreground/80 hover:text-foreground" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5 text-foreground/80 hover:text-foreground" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Sign Out">
          <LogOut className="h-5 w-5 text-foreground/80 hover:text-foreground" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
