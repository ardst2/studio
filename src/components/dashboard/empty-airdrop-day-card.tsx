
// src/components/dashboard/empty-airdrop-day-card.tsx
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Airdrop } from '@/types/airdrop';
import { useMemo } from 'react';

interface EmptyAirdropDayCardProps {
  onShowTodaysDeadlines: () => void;
  onAddNewAirdrop: () => void;
  airdrops: Airdrop[];
}

const EmptyAirdropDayCard = ({ onShowTodaysDeadlines, onAddNewAirdrop, airdrops }: EmptyAirdropDayCardProps) => {
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
    ? "Klik untuk lihat detailnya."
    : "Tidak ada airdrop jatuh tempo hari ini.";

  return (
    <Card
      className={cn(
        "shadow-xl w-full h-full bg-card text-card-foreground p-6 flex flex-col items-center justify-center text-center",
        "cursor-pointer transition-all duration-200 ease-in-out"
      )}
      onClick={onShowTodaysDeadlines}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onShowTodaysDeadlines();
        }
      }}
      aria-label={deadlinesToday.length > 0 ? `Lihat ${deadlinesToday.length} airdrop yang jatuh tempo hari ini` : "Tidak ada airdrop jatuh tempo hari ini"}
    >
      <CardContent className="flex flex-col items-center justify-center text-center h-full space-y-3 p-0">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-lg flex flex-col items-center justify-center bg-muted shadow-md"
          >
            <span className="text-2xl block text-gradient-theme font-bold">{day}</span>
            <span className="text-[0.6rem] block uppercase text-gradient-theme font-semibold">{month}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 bg-muted/80 hover:bg-muted rounded-full h-7 w-7 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onAddNewAirdrop();
            }}
            aria-label="Tambah airdrop baru"
          >
             <CalendarDays className="h-3.5 w-3.5 text-foreground/70" />
          </Button>
        </div>

        <div className="text-center mt-2">
          <h3 className="text-base font-semibold text-foreground">
            {deadlinesToday.length > 0 ? (
              <Sparkles className="w-4 h-4 mr-1.5 text-gradient-theme inline-block align-middle" />
            ) : (
              <Info className="w-4 h-4 mr-1.5 text-muted-foreground inline-block align-middle" />
            )}
            <span className="align-middle">{cardTitle}</span>
          </h3>
          <p className="text-xs text-muted-foreground">{cardSubtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyAirdropDayCard;
