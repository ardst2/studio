// src/components/dashboard/dashboard-header.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Bell } from 'lucide-react';
import Image from 'next/image';

const DashboardHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-2">
        <Image 
          src="https://placehold.co/40x40.png?text=AA" // Replace with actual logo if available
          alt="AirdropAce Logo" 
          width={32} 
          height={32} 
          className="rounded-md"
          data-ai-hint="rocket abstract"
        />
        <h1 className="font-headline text-xl font-semibold text-foreground">Airdrop<span className="text-primary">Ace</span></h1>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        {user && (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                Hello, {user.displayName || 'Airdrop Hunter'}!
              </p>
              <p className="text-xs text-muted-foreground">
                {user.role || 'Pemburu Airdrop'}
              </p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} data-ai-hint="profile avatar" />
              <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
          </>
        )}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
