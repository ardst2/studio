// src/components/dashboard/user-profile-card.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { BadgeCheck } from 'lucide-react';

const UserProfileCard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading user data...</p>
        </CardContent>
      </Card>
    );
  }

  // Mock data for profile completion and level
  const profileCompletion = 75; // Example percentage
  const userLevel = "Airdrop Pro"; // Example level

  return (
    <Card className="shadow-xl h-full">
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} data-ai-hint="profile avatar" />
          <AvatarFallback className="text-2xl">{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="font-headline text-2xl">{user.displayName}</CardTitle>
          <CardDescription className="text-sm">{user.email}</CardDescription>
          <div className="mt-1 flex items-center gap-1 text-xs text-accent">
            <BadgeCheck className="h-4 w-4" />
            <span>{user.role || "Pemburu Airdrop"} - {userLevel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="font-medium text-foreground">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} aria-label={`${profileCompletion}% profile completion`} className="h-2" />
          </div>
          {/* Add more user stats or info here if needed */}
          <p className="text-xs text-muted-foreground italic">
            "The early bird gets the airdrop!"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
