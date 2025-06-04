
// src/components/dashboard/empty-airdrop-day-card.tsx
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyAirdropDayCardProps {
  onAddNewAirdrop: () => void;
}

const EmptyAirdropDayCard = ({ onAddNewAirdrop }: EmptyAirdropDayCardProps) => {
  // For demonstration, using a static date. This could be dynamic.
  const day = "3";
  const month = "JUN";

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
      aria-label="Tambah airdrop baru"
    >
      <CardContent className="flex flex-col items-center justify-center text-center h-full space-y-4">
        <div className="relative">
          <div 
            className="w-20 h-20 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, hsl(var(--gradient-pink)), hsl(var(--gradient-red)))' }}
          >
            <span className="text-3xl block">{day}</span>
            <span className="text-xs block uppercase">{month}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -top-2 -right-2 bg-muted/50 hover:bg-muted rounded-full h-8 w-8"
            onClick={(e) => {
              e.stopPropagation(); // Prevent Card's onClick from firing twice
              onAddNewAirdrop();
            }}
            aria-label="Pilih tanggal atau tambah airdrop"
          >
             <CalendarDays className="h-4 w-4 text-foreground/70" />
          </Button>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Belum Ada Airdrop</h3>
          <p className="text-sm text-muted-foreground">Tambah airdrop baru</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyAirdropDayCard;
