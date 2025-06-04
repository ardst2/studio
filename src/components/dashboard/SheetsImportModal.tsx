// src/components/dashboard/SheetsImportModal.tsx
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import { importAirdropsFromSheet } from '@/ai/flows/sheets-integration-flow';
import type { Airdrop } from '@/types/airdrop';
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SheetsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

const SheetsImportModal = ({ isOpen, onClose }: SheetsImportModalProps) => {
  const { toast } = useToast();
  const { addManyAirdrops, isLoading: storeLoading } = useAirdropsStore();
  const [sheetId, setSheetId] = useState('');
  const [tabName, setTabName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!sheetId || !tabName) {
      toast({ variant: "destructive", title: "Input Diperlukan", description: "Harap isi ID Google Sheet dan Nama Tab." });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await importAirdropsFromSheet({ sheetId, tabName });
      if (result.importedAirdrops.length > 0) {
        const airdropsToAdd: Omit<Airdrop, 'id' | 'userId' | 'createdAt'>[] = result.importedAirdrops.map(imported => ({
            name: imported.name,
            description: imported.description,
            startDate: imported.startDate,
            deadline: imported.deadline,
            tasks: imported.tasks || [],
            status: imported.status || 'Upcoming',
        }));
        await addManyAirdrops(airdropsToAdd);
      }
      toast({
        title: "Impor Berhasil",
        description: result.message,
        action: <CheckCircle className="text-green-500" />,
      });
      onClose(); // Close modal on success
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Impor Gagal",
        description: error.message || "Terjadi kesalahan tidak diketahui saat impor.",
        action: <AlertTriangle className="text-red-500" />,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Reset state when modal closes
  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSheetId('');
      setTabName('');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0 max-h-[85vh] overflow-hidden">
        {/* Decorative gradient lines */}
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>

        <div className="relative flex flex-col h-full">
            <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
              <Download className="w-6 h-6 mr-2 text-gradient-theme" /> Impor dari Google Sheets
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Masukkan ID Google Sheet dan nama tab untuk mengimpor data airdrop.
              <br />
              <span className="text-xs mt-1 block">Format: Name, Description, StartDate (YYYY-MM-DD), Deadline (YYYY-MM-DD), Tasks (text;...), Status. Header di baris pertama.</span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow overflow-y-auto min-h-0">
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="sheetIdModal" className="mb-1 block text-sm font-medium">Google Sheet ID</Label>
                <InputWrapper>
                  <Input
                    id="sheetIdModal"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    placeholder="e.g., 1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                    disabled={isProcessing || storeLoading}
                  />
                </InputWrapper>
              </div>
              <div>
                <Label htmlFor="tabNameModal" className="mb-1 block text-sm font-medium">Nama Tab</Label>
                <InputWrapper>
                  <Input
                    id="tabNameModal"
                    value={tabName}
                    onChange={(e) => setTabName(e.target.value)}
                    placeholder="e.g., Airdrops Q1"
                    disabled={isProcessing || storeLoading}
                  />
                </InputWrapper>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isProcessing || storeLoading}>
                <X className="mr-2 h-4 w-4" /> Batal
              </Button>
            </DialogClose>
            <Button onClick={handleImport} disabled={isProcessing || storeLoading || !sheetId || !tabName} className="btn-gradient">
              {isProcessing || storeLoading ? <Loader size="sm" className="mr-1.5 border-primary-foreground" /> : <Download className="mr-1.5 h-4 w-4" />}
              Import
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SheetsImportModal;