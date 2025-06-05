
// src/components/dashboard/AiAssistModal.tsx
"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, AlertTriangle, CheckCircle, X, RotateCcw, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { extractAirdropDetailsFromText, type AirdropExtractedDetailItem } from '@/ai/flows/extractAirdropTextFlow';
import { useAirdropsStore } from '@/hooks/use-airdrops-store'; // Import useAirdropsStore
import type { Airdrop } from '@/types/airdrop';
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';

interface AiAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

const AiAssistModal = ({ isOpen, onClose }: AiAssistModalProps) => {
  const { toast } = useToast();
  const { addAirdrop: storeAddAirdrop, isLoading: isStoreLoading } = useAirdropsStore(); // Get addAirdrop from store
  const [textDescription, setTextDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<AirdropExtractedDetailItem[] | null>(null);
  const dynamicFieldsOutputRef = useRef<HTMLDivElement>(null);

  const handleProcessText = async () => {
    if (textDescription.trim().length < 20) {
      toast({ variant: "destructive", title: "Teks Terlalu Pendek", description: "Harap masukkan deskripsi airdrop yang lebih detail (minimal 20 karakter)." });
      return;
    }
    setIsProcessing(true);
    setExtractedData(null);
    if (dynamicFieldsOutputRef.current) {
      dynamicFieldsOutputRef.current.innerHTML = '';
    }

    try {
      const result = await extractAirdropDetailsFromText({ textDescription });
      setExtractedData(result);
      renderDynamicFields(result);
      toast({
        title: "Ekstraksi Selesai",
        description: `Informasi berhasil diekstrak. Ditemukan ${result.length} item. Silakan tinjau dan simpan jika sesuai.`,
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (error: any) {
      console.error("AI processing error:", error);
      toast({
        variant: "destructive",
        title: "Ekstraksi Gagal",
        description: error.message || "Terjadi kesalahan saat memproses teks dengan AI.",
        action: <AlertTriangle className="text-red-500" />,
      });
      setExtractedData([]);
      renderDynamicFields([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDynamicFields = (data: AirdropExtractedDetailItem[]) => {
    const container = dynamicFieldsOutputRef.current;
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
      const noDataMessage = document.createElement('p');
      noDataMessage.className = 'text-sm text-muted-foreground italic text-center py-4';
      noDataMessage.textContent = 'AI tidak menemukan informasi spesifik untuk diekstrak dari teks ini atau format output tidak sesuai.';
      container.appendChild(noDataMessage);
      return;
    }

    data.forEach(item => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'mb-4';

      const label = document.createElement('label');
      label.htmlFor = `ai-field-${item.key.replace(/\s+/g, '-').toLowerCase()}`;
      label.className = 'mb-1 block text-sm font-medium text-foreground';
      label.textContent = item.key;
      fieldWrapper.appendChild(label);

      const inputWrapperDiv = document.createElement('div');
      inputWrapperDiv.className = 'input-gradient-glow-wrapper';

      let inputElement;
      if (item.tipe === 'string_long' || item.tipe === 'unknown') {
        inputElement = document.createElement('textarea');
        inputElement.rows = 3;
        inputElement.className = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
      } else {
        inputElement = document.createElement('input');
        inputElement.className = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

        if (item.tipe === 'date') inputElement.type = 'text';
        else if (item.tipe === 'url') inputElement.type = 'url';
        else if (item.tipe === 'number') inputElement.type = 'number';
        else if (item.tipe === 'boolean') inputElement.type = 'text';
        else inputElement.type = 'text';
      }

      inputElement.id = `ai-field-${item.key.replace(/\s+/g, '-').toLowerCase()}`;
      inputElement.value = item.nilai;
      inputElement.readOnly = true;

      inputWrapperDiv.appendChild(inputElement);
      fieldWrapper.appendChild(inputWrapperDiv);
      container.appendChild(fieldWrapper);
    });
  };

  const handleSaveAirdrop = async () => {
    if (!extractedData || extractedData.length === 0) {
      toast({ variant: "destructive", title: "Tidak Ada Data", description: "Tidak ada data hasil ekstraksi AI untuk disimpan." });
      return;
    }
    setIsSaving(true);

    const newAirdropData: Partial<Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>> = {
      name: `Airdrop (AI) ${new Date().toLocaleTimeString()}`, // Default name
      description: '',
      notes: "Informasi diekstrak oleh AI:\n",
      tasks: [],
    };
    
    let unmappedInfo = "";

    extractedData.forEach(item => {
      const keyLower = item.key.toLowerCase();
      const value = item.nilai;
      const type = item.tipe;

      if (keyLower.includes('nama') || keyLower.includes('project')) {
        newAirdropData.name = value;
      } else if (keyLower.includes('deadline') || (keyLower.includes('tanggal') && (keyLower.includes('akhir') || keyLower.includes('berakhir') || keyLower.includes('selesai')))) {
        if (type === 'date') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) newAirdropData.deadline = date.getTime();
          else unmappedInfo += `${item.key} (Format tanggal tidak valid: ${value})\n`;
        } else {
           unmappedInfo += `${item.key}: ${value} (Disarankan tipe: date)\n`;
        }
      } else if (keyLower.includes('mulai') || (keyLower.includes('tanggal') && keyLower.includes('start'))) {
         if (type === 'date') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) newAirdropData.startDate = date.getTime();
          else unmappedInfo += `${item.key} (Format tanggal tidak valid: ${value})\n`;
        } else {
           unmappedInfo += `${item.key}: ${value} (Disarankan tipe: date)\n`;
        }
      } else if (keyLower.includes('deskripsi') || keyLower.includes('description') || keyLower.includes('overview')) {
        newAirdropData.description = (newAirdropData.description ? newAirdropData.description + "\n" : "") + value;
      } else if (keyLower.includes('link') || keyLower.includes('url')) {
        if (type === 'url' || value.startsWith('http')) newAirdropData.airdropLink = value;
        else unmappedInfo += `${item.key}: ${value} (Disarankan tipe: url)\n`;
      } else if (keyLower.includes('syarat') || keyLower.includes('requirement') || keyLower.includes('eligibility')) {
        newAirdropData.participationRequirements = (newAirdropData.participationRequirements ? newAirdropData.participationRequirements + "\n" : "") + value;
      } else if (keyLower.includes('blockchain') || keyLower.includes('network') || keyLower.includes('jaringan')) {
        newAirdropData.blockchain = value;
      } else if (keyLower.includes('token') && keyLower.includes('jumlah')) {
        if (type === 'number') {
            const amount = parseFloat(value);
            if(!isNaN(amount)) newAirdropData.tokenAmount = amount;
            else unmappedInfo += `${item.key} (Format angka tidak valid: ${value})\n`;
        } else {
            unmappedInfo += `${item.key}: ${value} (Disarankan tipe: number)\n`;
        }
      } else if (keyLower.includes('catatan') || keyLower.includes('note')) {
        newAirdropData.notes = (newAirdropData.notes ? newAirdropData.notes + "\n" : "") + value;
      } else if (keyLower.includes('wallet')) {
        newAirdropData.walletAddress = value;
      } else if (keyLower.includes('jenis') && keyLower.includes('airdrop')) {
        newAirdropData.airdropType = value;
      } else if (keyLower.includes('sumber') && keyLower.includes('informasi')) {
        newAirdropData.informationSource = value;
      }
      // Untuk tugas, kita bisa coba deteksi jika ada kata "tugas" atau "task"
      // Ini contoh sederhana, bisa lebih canggih
      else if (keyLower.includes('tugas') || keyLower.includes('task')) {
         if (newAirdropData.tasks && value.length > 5) { // Hanya jika ada value yang cukup panjang
            newAirdropData.tasks.push({ id: crypto.randomUUID(), text: value, completed: false });
         } else {
            unmappedInfo += `${item.key}: ${value}\n`;
         }
      }
      else {
        unmappedInfo += `${item.key}: ${value}\n`;
      }
    });
    
    if (unmappedInfo) {
        newAirdropData.notes = (newAirdropData.notes || "") + "\n\nInfo Tambahan dari AI (tidak terpetakan otomatis):\n" + unmappedInfo;
    }
    if (!newAirdropData.description && newAirdropData.notes && newAirdropData.notes.startsWith("Informasi diekstrak oleh AI:\n") && newAirdropData.notes.length < 150) {
        newAirdropData.description = newAirdropData.notes; // Pindahkan catatan ke deskripsi jika deskripsi kosong dan catatan pendek
    }


    try {
      // Pastikan semua field yang wajib di Airdrop (non-optional) ada atau default
      const finalData: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'> = {
        name: newAirdropData.name || `Airdrop AI ${Date.now()}`,
        description: newAirdropData.description,
        startDate: newAirdropData.startDate,
        deadline: newAirdropData.deadline,
        tasks: newAirdropData.tasks || [],
        blockchain: newAirdropData.blockchain,
        registrationDate: newAirdropData.registrationDate,
        participationRequirements: newAirdropData.participationRequirements,
        airdropLink: newAirdropData.airdropLink,
        userDefinedStatus: newAirdropData.userDefinedStatus,
        notes: newAirdropData.notes?.replace("Informasi diekstrak oleh AI:\n\n\n", "Informasi diekstrak oleh AI:\n"), // Bersihkan baris ganda jika notes awalnya kosong
        walletAddress: newAirdropData.walletAddress,
        tokenAmount: newAirdropData.tokenAmount,
        claimDate: newAirdropData.claimDate,
        airdropType: newAirdropData.airdropType,
        referralCode: newAirdropData.referralCode,
        informationSource: newAirdropData.informationSource,
      };

      await storeAddAirdrop(finalData);
      toast({ title: "Airdrop Disimpan", description: `"${finalData.name}" berhasil disimpan dari ekstraksi AI.` });
      handleModalClose();
    } catch (error: any) {
      console.error("Error saving AI extracted airdrop:", error);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: error.message || "Terjadi kesalahan saat menyimpan airdrop dari AI." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleModalClose = () => {
    onClose();
    setTextDescription('');
    setExtractedData(null);
    setIsProcessing(false);
    setIsSaving(false);
    if (dynamicFieldsOutputRef.current) {
      dynamicFieldsOutputRef.current.innerHTML = '';
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      handleModalClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>

        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-gradient-theme" /> Bantuan AI Ekstraksi Data
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Paste teks pengumuman airdrop di bawah ini. AI akan mencoba mengekstrak informasi penting untuk Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto min-h-0 p-6 space-y-4">
          <div>
            <Label htmlFor="textDescriptionAiModal" className="mb-1 block text-sm font-medium">Teks Deskripsi Airdrop</Label>
            <InputWrapper>
              <Textarea
                id="textDescriptionAiModal"
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder="Paste teks lengkap pengumuman airdrop di sini..."
                rows={8}
                disabled={isProcessing || isSaving}
                className="text-sm"
              />
            </InputWrapper>
          </div>

          <Button onClick={handleProcessText} disabled={isProcessing || isSaving || textDescription.trim().length < 20} className="w-full btn-gradient">
            {isProcessing ? <Loader size="sm" className="mr-1.5 border-primary-foreground" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            {isProcessing ? 'Memproses...' : 'Proses dengan AI'}
          </Button>

          {(extractedData || isProcessing) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 border-b border-border/30 pb-2">Hasil Ekstraksi AI:</h3>
              {isProcessing && !extractedData && (
                <div className="flex justify-center items-center py-8">
                  <Loader variant="modal" size="md" />
                </div>
              )}
              <div ref={dynamicFieldsOutputRef} className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {!isProcessing && extractedData && extractedData.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-4">AI tidak menemukan informasi spesifik untuk diekstrak dari teks ini atau format output tidak sesuai.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 flex flex-col sm:flex-row justify-between gap-2">
            <Button type="button" variant="outline" onClick={handleModalClose} disabled={isProcessing || isSaving}>
                <X className="mr-2 h-4 w-4" /> Tutup
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => {setTextDescription(''); setExtractedData(null); if(dynamicFieldsOutputRef.current) dynamicFieldsOutputRef.current.innerHTML = '';}} disabled={isProcessing || isSaving}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button 
                    type="button" 
                    className="btn-gradient" 
                    onClick={handleSaveAirdrop} 
                    disabled={isProcessing || isSaving || !extractedData || extractedData.length === 0 || isStoreLoading}
                >
                    {isSaving || isStoreLoading ? <Loader size="sm" className="mr-1.5 border-primary-foreground" /> : <Save className="mr-1.5 h-4 w-4" />}
                    {isSaving || isStoreLoading ? 'Menyimpan...' : 'Simpan sebagai Airdrop'}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiAssistModal;


    