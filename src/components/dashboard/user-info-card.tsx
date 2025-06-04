
// src/components/dashboard/user-info-card.tsx
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Airdrop } from '@/types/airdrop';

interface UserInfoCardProps {
  airdrops: Airdrop[];
}

const UserInfoCard = ({ airdrops }: UserInfoCardProps) => {
  // Static data for name/role as login is removed
  const userName = "Nama Pengguna";
  const userRole = "Peran Pengguna";
  
  const trackedCount = airdrops.length;
  const completedCount = airdrops.filter(a => a.status === 'Completed').length;

  return (
    <Card className="shadow-xl h-full bg-card text-card-foreground p-6">
      <CardContent className="flex flex-col items-center justify-center text-center h-full space-y-4">
        <Avatar className="h-24 w-24 border-4 border-transparent" style={{ background: 'linear-gradient(hsl(var(--gradient-blue)), hsl(var(--gradient-blue) / 0.7))' }}>
          {/* Using a blue gradient for avatar background as per image */}
          <AvatarFallback className="text-4xl font-bold text-white bg-transparent">
            {(userName.charAt(0) || 'U').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{userName}</h2>
          <p className="text-sm text-muted-foreground">{userRole}</p>
        </div>
        <div className="flex w-full justify-around pt-2">
          <div>
            <p className="text-lg font-bold text-foreground">{trackedCount}</p>
            <p className="text-xs text-muted-foreground">Dilacak</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Selesai</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
