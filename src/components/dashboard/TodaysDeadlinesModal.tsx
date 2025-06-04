// src/components/dashboard/TodaysDeadlinesModal.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarCheck, Info, X, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TodaysDeadlinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  airdropsDueToday: Airdrop[];
  onSelectAirdrop: (airdrop: Airdrop) => void;
}

const TodaysDeadlinesModal = ({ isOpen, onClose, airdropsDueToday, onSelectAirdrop }: TodaysDeadlinesModalProps) => {
  if (!isOpen) return null;

  const handleAirdropClick = (airdrop: Airdrop) => {
    onSelectAirdrop(airdrop);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
            <CalendarCheck className="w-6 h-6 mr-2 text-gradient-theme" /> Deadline Hari Ini
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {airdropsDueToday.length > 0
              ? `Berikut adalah ${airdropsDueToday.length} airdrop yang jatuh tempo hari ini.`
              : "Tidak ada airdrop yang jatuh tempo hari ini."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-6">
          {airdropsDueToday.length > 0 ? (
            <ul className="space-y-3">
              {airdropsDueToday.map(airdrop => (
                <li key={airdrop.id}>
                  <Card 
                    className="bg-input hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleAirdropClick(airdrop)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAirdropClick(airdrop);}}
                    aria-label={`Lihat detail ${airdrop.name}`}
                  >
                    <CardHeader className="p-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-base font-medium text-foreground">{airdrop.name}</CardTitle>
                      <Info className="w-4 h-4 text-primary" />
                    </CardHeader>
                    {airdrop.tasks && airdrop.tasks.length > 0 && (
                      <CardContent className="p-3 pt-0 text-xs">
                        <p className="text-muted-foreground">
                          {airdrop.tasks.filter(t => t.completed).length} / {airdrop.tasks.length} tugas selesai
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <ListChecks className="mx-auto h-12 w-12 text-muted-foreground opacity-70" />
              <p className="mt-4 text-sm text-muted-foreground">
                Semua aman! Tidak ada yang perlu dikejar hari ini.
              </p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t border-border">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              <X className="mr-2 h-4 w-4" /> Tutup
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TodaysDeadlinesModal;
