
// src/components/dashboard/empty-airdrop-day-card.tsx
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Airdrop } from '@/types/airdrop';
import { useMemo } from 'react';

interface EmptyAirdropDayCardProps {
  onAddNewAirdrop: () => void;
  airdrops: Airdrop[];
}

const EmptyAirdropDayCard = ({ onAddNewAirdrop, airdrops }: EmptyAirdropDayCardProps) => {
  const today = new Date();
  const day = today.getDate().toString();
  const month = today.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();

  const deadlinesToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return airdrops.filter(airdrop => {
      if (!airdrop.deadline) return false;
      const deadlineDate = new Date(airdrop.deadline);
      return deadlineDate >= startOfDay && deadlineDate <= endOfDay && airdrop.status !== 'Completed';
    });
  }, [airdrops]);

  const cardTitle = deadlinesToday.length > 0 
    ? `${deadlinesToday.length} Deadline Hari Ini` 
    : "Belum Ada Deadline";
  const cardSubtitle = deadlinesToday.length > 0 
    ? "Segera selesaikan tugasnya!" 
    : "Tambah airdrop baru";

  return (
    <Card 
      className={cn(
        "shadow-xl h-full bg-card text-card-foreground p-6",
        "cursor-pointer hover:bg-card/90 transition-colors duration-200 ease-in-out"
      )}
      onClick={onAddNewAirdrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onAddNewAirdrop();
        }
      }}
      aria-label={cardTitle}
    >
      <CardContent className="flex flex-col items-center justify-center text-center h-full space-y-4">
        <div className="relative">
          <div 
            className="w-20 h-20 rounded-lg flex flex-col items-center justify-center bg-muted shadow-lg"
          >
            <span className="text-3xl block text-gradient-theme font-bold">{day}</span>
            <span className="text-xs block uppercase text-gradient-theme font-semibold">{month}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -top-2 -right-2 bg-muted/80 hover:bg-muted rounded-full h-8 w-8 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation(); 
              onAddNewAirdrop();
            }}
            aria-label="Tambah airdrop baru atau pilih tanggal"
          >
             <CalendarDays className="h-4 w-4 text-foreground/70" />
          </Button>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground flex items-center justify-center">
            {deadlinesToday.length > 0 && <Sparkles className="w-5 h-5 mr-2 text-gradient-theme" />}
            {cardTitle}
          </h3>
          <p className="text-sm text-muted-foreground">{cardSubtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyAirdropDayCard;
