
// src/components/dashboard/AirdropDetailModal.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isValid } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CalendarDays, CheckSquare, Square, Info, X, LinkIcon, UsersIcon, GiftIcon, Wallet, MessageSquare, Briefcase, Globe, Asterisk, Share2Icon, Edit3Icon, TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AirdropDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  airdrop: Airdrop | null;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; icon?: React.ElementType; isLink?: boolean; isPreWrap?: boolean }> = ({ label, value, icon: Icon, isLink, isPreWrap }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
        {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 opacity-80" />}
        {label}
      </h4>
      {isLink && typeof value === 'string' ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
          {value}
        </a>
      ) : (
        <p className={cn("text-sm text-foreground", isPreWrap && "whitespace-pre-wrap bg-input p-2 rounded-md text-xs")}>
          {String(value)}
        </p>
      )}
    </div>
  );
};


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
  
  const formatDateOnly = (timestamp?: number) => {
    if (!timestamp || !isValid(new Date(timestamp))) return 'N/A';
    return format(new Date(timestamp), 'dd MMMM yyyy', { locale: localeID });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card shadow-2xl border-primary/30 p-0 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 relative z-[2]">
          <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
            <Info className="w-6 h-6 mr-2 text-primary" /> Detail Airdrop
          </DialogTitle>
          <DialogDescription className="text-muted-foreground line-clamp-1">
            Informasi lengkap mengenai airdrop "{airdrop.name}".
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto min-h-0 relative z-[2]">
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <h3 className="text-xl font-semibold text-foreground">{airdrop.name}</h3>
              <div className="flex flex-wrap gap-2 items-center">
                  <Badge className={cn("capitalize", getStatusColorClass(airdrop.status))}>
                  Status Sistem: {airdrop.status}
                  </Badge>
                  {airdrop.userDefinedStatus && (
                      <Badge variant="secondary" className="capitalize">
                      Status Kustom: {airdrop.userDefinedStatus}
                      </Badge>
                  )}
                  {airdrop.blockchain && (
                      <Badge variant="outline" className="capitalize flex items-center">
                        <Globe className="w-3 h-3 mr-1"/> {airdrop.blockchain}
                      </Badge>
                  )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Tanggal Mulai" value={formatDate(airdrop.startDate)} icon={CalendarDays} />
              <DetailItem label="Tanggal Berakhir (Deadline)" value={formatDate(airdrop.deadline)} icon={CalendarDays} />
              <DetailItem label="Tanggal Daftar" value={formatDateOnly(airdrop.registrationDate)} icon={CalendarDays} />
              <DetailItem label="Tanggal Klaim" value={formatDateOnly(airdrop.claimDate)} icon={CalendarDays} />
              <DetailItem label="Jenis Airdrop" value={airdrop.airdropType} icon={TagIcon} />
              <DetailItem label="Sumber Informasi" value={airdrop.informationSource} icon={Briefcase} />
              <DetailItem label="Link Airdrop" value={airdrop.airdropLink} icon={LinkIcon} isLink />
              <DetailItem label="Alamat Wallet" value={airdrop.walletAddress} icon={Wallet} />
              <DetailItem label="Jumlah Token (Estimasi)" value={airdrop.tokenAmount?.toLocaleString()} icon={GiftIcon} />
              <DetailItem label="Kode Referral" value={airdrop.referralCode} icon={Share2Icon} />
            </div>

            <DetailItem label="Deskripsi Umum" value={airdrop.description} icon={MessageSquare} isPreWrap/>
            <DetailItem label="Syarat Partisipasi" value={airdrop.participationRequirements} icon={UsersIcon} isPreWrap />
            <DetailItem label="Catatan Tambahan" value={airdrop.notes} icon={Edit3Icon} isPreWrap />
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center"><Asterisk className="w-3.5 h-3.5 mr-1.5 opacity-80"/>Tanggal Dibuat di Sistem</h4>
              <p className="text-sm text-foreground">{formatDate(airdrop.createdAt)}</p>
            </div>

            {airdrop.tasks && airdrop.tasks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5 opacity-80" /> Checklist Tugas ({airdrop.tasks.filter(t=>t.completed).length}/{airdrop.tasks.length})
                </h4>
                <ul className="space-y-2">
                  {airdrop.tasks.map(task => (
                    <li key={task.id} className="flex items-center text-sm p-2 bg-input rounded-md">
                      {task.completed ? (
                        <CheckSquare className="w-4 h-4 mr-2 text-green-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                      )}
                      <span className={cn("flex-grow break-all", task.completed && "line-through text-muted-foreground")}>
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

        <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 relative z-[2]">
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

export default AirdropDetailModal;

