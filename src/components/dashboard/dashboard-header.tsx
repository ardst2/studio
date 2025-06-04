// src/components/dashboard/dashboard-header.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import Image from 'next/image';

const DashboardHeader = () => {
  // Removed useAuth and user-specific details

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-2">
        <Image 
          src="https://placehold.co/40x40.png?text=AA" 
          alt="AirdropAce Logo" 
          width={32} 
          height={32} 
          className="rounded-md"
          data-ai-hint="rocket abstract"
        />
        <h1 className="font-headline text-xl font-semibold text-foreground">Airdrop<span className="text-primary">Ace</span></h1>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        {/* Removed user avatar and name display */}
        {/* Removed Sign Out button */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        {/* You could add a generic "Settings" or other non-auth actions here if needed */}
      </div>
    </header>
  );
};

export default DashboardHeader;
