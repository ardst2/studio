
// src/components/dashboard/TelegramImportModal.tsx
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, AlertTriangle, CheckCircle, X, RotateCcw } from 'lucide-react'; // Using Send as a placeholder for Telegram
import { useToast } from "@/hooks/use-toast";
import { importAirdropsFromTelegram, type TelegramAirdropImportInput, type TelegramAirdropImportOutput } from '@/ai/flows/telegramAirdropImporterFlow';
// import { useAirdropsStore } from '@/hooks/use-airdrops-store'; // For saving later
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TelegramImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

const TelegramImportModal = ({ isOpen, onClose }: TelegramImportModalProps) => {
  const { toast } = useToast();
  // const { addManyAirdrops, isLoading: storeLoading } = useAirdropsStore(); // For saving later
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<TelegramAirdropImportOutput | null>(null);

  const handleImport = async () => {
    if (!targetIdentifier.trim()) {
      toast({ variant: "destructive", title: "Input Diperlukan", description: "Harap isi nama atau ID channel Telegram." });
      return;
    }
    setIsProcessing(true);
    setImportResult(null);
    try {
      const result = await importAirdropsFromTelegram({ targetIdentifier: targetIdentifier.trim() });
      setImportResult(result);
      toast({
        title: "Proses Impor Selesai",
        description: result.overallSummary || "Impor dari Telegram telah diproses.",
        action: result.errors && result.errors.length > 0 ? <AlertTriangle className="text-orange-500" /> : <CheckCircle className="text-green-500" />,
      });
      // If you want to close modal on success:
      // if (result.extractedAirdropsCount > 0 && (!result.errors || result.errors.length === 0)) {
      //   onClose();
      // }
    } catch (error: any) {
      setImportResult({ // Set a basic error result for display
          processedMessagesCount: 0,
          extractedAirdropsCount: 0,
          extractedDetailsList: [],
          overallSummary: `Error: ${error.message || "Terjadi kesalahan tidak diketahui."}`,
          errors: [error.message || "Terjadi kesalahan tidak diketahui."]
      });
      toast({
        variant: "destructive",
        title: "Impor Gagal",
        description: error.message || "Terjadi kesalahan tidak diketahui saat impor dari Telegram.",
        action: <AlertTriangle className="text-red-500" />,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetForm = () => {
    setTargetIdentifier('');
    setImportResult(null);
    setIsProcessing(false);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };
  
  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      handleModalClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 text-center">
          <DialogTitle className="font-headline text-2xl text-foreground flex items-center justify-center">
            <Send className="w-6 h-6 mr-2 text-gradient-theme" /> Impor dari Channel Telegram
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Masukkan nama atau ID channel Telegram. AI akan mencoba mengambil dan mengekstrak info airdrop.
            <br /><span className="text-xs mt-1 block">Membutuhkan implementasi API Telegram Anda yang sebenarnya.</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto min-h-0">
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="targetIdentifierTelegramModal" className="mb-1 block text-sm font-medium">Nama atau ID Channel Telegram</Label>
              <InputWrapper>
                <Input
                  id="targetIdentifierTelegramModal"
                  value={targetIdentifier}
                  onChange={(e) => setTargetIdentifier(e.target.value)}
                  placeholder="e.g., AirdropAlertsChannel atau -100123456789"
                  disabled={isProcessing}
                />
              </InputWrapper>
            </div>

            {isProcessing && (
                <div className="flex justify-center items-center py-8">
                    <Loader variant="modal" size="md" />
                </div>
            )}

            {importResult && !isProcessing && (
              <div className="mt-6 p-4 bg-input/30 rounded-lg space-y-2 text-sm">
                <h3 className="font-semibold text-foreground mb-2">Hasil Impor:</h3>
                <p><span className="text-muted-foreground">Pesan Diproses:</span> {importResult.processedMessagesCount}</p>
                <p><span className="text-muted-foreground">Potensi Airdrop Ditemukan:</span> {importResult.extractedAirdropsCount}</p>
                <p><span className="text-muted-foreground">Ringkasan:</span> {importResult.overallSummary}</p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div>
                    <h4 className="text-destructive font-medium mt-2">Error:</h4>
                    <ul className="list-disc list-inside text-destructive text-xs">
                      {importResult.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                    </ul>
                  </div>
                )}
                 {/* TODO: Add logic here later if we want to list/save individual airdrops from extractedDetailsList */}
              </div>
            )}
          </div>
        </ScrollArea>
          
        <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 flex flex-col sm:flex-row justify-between gap-2">
          <Button type="button" variant="outline" onClick={handleModalClose} disabled={isProcessing}>
            <X className="mr-2 h-4 w-4" /> Tutup
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={isProcessing}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button onClick={handleImport} disabled={isProcessing || !targetIdentifier.trim()} className="btn-gradient">
              {isProcessing ? <Loader size="sm" className="mr-1.5 border-primary-foreground" /> : <Send className="mr-1.5 h-4 w-4" />}
              {isProcessing ? 'Memproses...' : 'Impor dari Telegram'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramImportModal;
