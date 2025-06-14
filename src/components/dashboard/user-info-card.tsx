
// src/components/dashboard/user-info-card.tsx
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Airdrop } from '@/types/airdrop';
import type { User } from '@/types/user'; // Import User type
import { cn } from '@/lib/utils';

interface UserInfoCardProps {
  airdrops: Airdrop[];
  user: User | null; // Add user prop
  onOpenProfileModal: () => void; // Callback to open profile modal
}

const UserInfoCard = ({ airdrops, user, onOpenProfileModal }: UserInfoCardProps) => {
  const displayName = user?.displayName || "Pengguna";
  const userRole = user?.role || "Pemburu Airdrop";

  const trackedCount = airdrops.length;
  const completedCount = airdrops.filter(a => a.status === 'Completed').length;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Card
      className={cn(
        "shadow-xl w-full h-full bg-card text-card-foreground p-6 flex flex-col items-center justify-center text-center",
        "cursor-pointer transition-all duration-200 ease-in-out"
      )}
      onClick={onOpenProfileModal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenProfileModal(); }}
      aria-label={`Edit profil ${displayName}`}
    >
      <CardContent className="flex flex-col items-center justify-center text-center h-full space-y-3 p-0">
        <Avatar className="h-20 w-20 border-4 border-primary/30">
          {user?.photoURL ? (
            <AvatarImage src={user.photoURL} alt={displayName} data-ai-hint="profile avatar" />
          ) : (
            <div className="h-full w-full rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(hsl(var(--gradient-blue)), hsl(var(--gradient-blue) / 0.7))' }}>
              <AvatarFallback className="text-3xl font-bold text-white bg-transparent">
                {getInitials(displayName)}
              </AvatarFallback>
            </div>
          )}
        </Avatar>
        <div className="mt-2">
          <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
          <p className="text-xs text-muted-foreground">{userRole}</p>
        </div>
        <div className="flex w-full justify-around pt-1">
          <div>
            <p className="text-base font-bold text-foreground">{trackedCount}</p>
            <p className="text-xs text-muted-foreground">Dilacak</p>
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Selesai</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
