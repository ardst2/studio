
// src/components/dashboard/AirdropDetailModal.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isValid } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CalendarDays, CheckSquare, Square, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AirdropDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  airdrop: Airdrop | null;
}

const AirdropDetailModal = ({ isOpen, onClose, airdrop }: AirdropDetailModalProps) => {
  if (!airdrop) return null;

  const getStatusColorClass = (status: Airdrop['status']): string => {
    switch (status) {
      case 'Active': return 'bg-primary/20 text-primary';
      case 'Upcoming': return 'bg-blue-500/20 text-blue-400';
      case 'Completed': return 'bg-green-500/20 text-green-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp || !isValid(new Date(timestamp))) return 'N/A';
    return format(new Date(timestamp), 'dd MMMM yyyy, HH:mm', { locale: localeID });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card shadow-2xl border-primary/30 p-0 max-h-[85vh] overflow-hidden">
        {/* Decorative gradient lines */}
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>

        <div className="relative flex flex-col h-full">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
              <Info className="w-6 h-6 mr-2 text-primary" /> Detail Airdrop
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Informasi lengkap mengenai airdrop "{airdrop.name}".
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow overflow-y-auto min-h-0">
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">{airdrop.name}</h3>
                <Badge className={cn("capitalize", getStatusColorClass(airdrop.status))}>
                  {airdrop.status}
                </Badge>
              </div>

              {airdrop.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Deskripsi</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-input p-3 rounded-md">
                    {airdrop.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1.5" /> Tanggal Mulai
                  </h4>
                  <p className="text-sm text-foreground">{formatDate(airdrop.startDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1.5" /> Deadline
                  </h4>
                  <p className="text-sm text-foreground">{formatDate(airdrop.deadline)}</p>
                </div>
              </div>
              
              <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Tanggal Dibuat</h4>
                  <p className="text-sm text-foreground">{formatDate(airdrop.createdAt)}</p>
              </div>


              {airdrop.tasks && airdrop.tasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Checklist Tugas</h4>
                  <ul className="space-y-2">
                    {airdrop.tasks.map(task => (
                      <li key={task.id} className="flex items-center text-sm p-2 bg-input rounded-md">
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 mr-2 text-green-400" />
                        ) : (
                          <Square className="w-4 h-4 mr-2 text-muted-foreground" />
                        )}
                        <span className={cn("flex-grow", task.completed && "line-through text-muted-foreground")}>
                          {task.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(!airdrop.tasks || airdrop.tasks.length === 0) && (
                   <p className="text-xs text-muted-foreground italic">Tidak ada tugas spesifik untuk airdrop ini.</p>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                <X className="mr-2 h-4 w-4" /> Tutup
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AirdropDetailModal;

    