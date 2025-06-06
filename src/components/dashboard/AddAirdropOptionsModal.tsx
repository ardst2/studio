"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle as ModalCardTitle } from '@/components/ui/card';
import { FilePlus2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddAirdropOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddManual: () => void;
  onOpenImportSheets: () => void;
  onOpenAiAssist: () => void;
}

const SheetsIconSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-primary"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/></svg>
);

const AddAirdropOptionsModal = ({
  isOpen,
  onClose,
  onOpenAddManual,
  onOpenImportSheets,
  onOpenAiAssist,
}: AddAirdropOptionsModalProps) => {
  
  const handleOptionClick = (openModalFunction: () => void) => {
    openModalFunction();
    onClose(); // Close this options modal after opening another
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0 max-h-[85vh] overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="font-headline text-2xl text-foreground">Tambah Airdrop</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pilih metode untuk menambahkan data airdrop baru.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 gap-4">
          {/* Option 1: Tambah Manual */}
          <div className="card-gradient-glow-wrapper">
            <Card
              className="w-full bg-input/30 hover:bg-input/70 text-card-foreground p-4 flex flex-col justify-center items-center text-center cursor-pointer h-36"
              onClick={() => handleOptionClick(onOpenAddManual)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOptionClick(onOpenAddManual); }}
              aria-label="Tambah airdrop baru secara manual"
            >
              <FilePlus2 className="h-7 w-7 mb-2 text-primary" />
              <ModalCardTitle className="font-semibold text-base text-foreground">Tambah Manual</ModalCardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Masukkan detail airdrop secara manual.
              </p>
            </Card>
          </div>

          {/* Option 2: Import dari Sheets */}
          <div className="card-gradient-glow-wrapper">
            <Card
              className="w-full bg-input/30 hover:bg-input/70 text-card-foreground p-4 flex flex-col justify-center items-center text-center cursor-pointer h-36"
              onClick={() => handleOptionClick(onOpenImportSheets)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOptionClick(onOpenImportSheets); }}
              aria-label="Impor airdrop dari Google Sheets"
            >
              <SheetsIconSvg />
              <ModalCardTitle className="font-semibold text-base text-foreground">Import dari Sheets</ModalCardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Tarik data dari Google Sheets.
              </p>
            </Card>
          </div>

          {/* Option 3: Bantuan AI Ekstrak */}
          <div className="card-gradient-glow-wrapper">
            <Card
              className="w-full bg-input/30 hover:bg-input/70 text-card-foreground p-4 flex flex-col justify-center items-center text-center cursor-pointer h-36"
              onClick={() => handleOptionClick(onOpenAiAssist)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOptionClick(onOpenAiAssist); }}
              aria-label="Buka Bantuan AI untuk ekstraksi data"
            >
              <Sparkles className="h-7 w-7 mb-2 text-primary" />
              <ModalCardTitle className="font-semibold text-base text-foreground">Bantuan AI Ekstrak</ModalCardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Ekstrak info dari teks atau URL.
              </p>
            </Card>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-border shrink-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              <X className="mr-2 h-4 w-4" /> Batal
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAirdropOptionsModal;
