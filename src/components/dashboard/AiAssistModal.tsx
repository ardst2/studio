
// src/components/dashboard/AiAssistModal.tsx
"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // For rendering dynamic inputs
import { Sparkles, AlertTriangle, CheckCircle, X, RotateCcw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { extractAirdropDetailsFromText, type ExtractAirdropTextOutput } from '@/ai/flows/extractAirdropTextFlow';
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AiAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

const AiAssistModal = ({ isOpen, onClose }: AiAssistModalProps) => {
  const { toast } = useToast();
  const [textDescription, setTextDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractAirdropTextOutput | null>(null);
  const dynamicFieldsOutputRef = useRef<HTMLDivElement>(null);

  const handleProcessText = async () => {
    if (textDescription.trim().length < 20) {
      toast({ variant: "destructive", title: "Teks Terlalu Pendek", description: "Harap masukkan deskripsi airdrop yang lebih detail (minimal 20 karakter)." });
      return;
    }
    setIsProcessing(true);
    setExtractedData(null); // Clear previous results
    if (dynamicFieldsOutputRef.current) {
        dynamicFieldsOutputRef.current.innerHTML = ''; // Clear previous dynamic fields
    }

    try {
      const result = await extractAirdropDetailsFromText({ textDescription });
      setExtractedData(result);
      renderDynamicFields(result);
      toast({
        title: "Ekstraksi Selesai",
        description: "Informasi berhasil diekstrak. Silakan tinjau di bawah.",
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
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDynamicFields = (data: ExtractAirdropTextOutput) => {
    const container = dynamicFieldsOutputRef.current;
    if (!container) return;

    container.innerHTML = ''; // Clear previous content

    if (Object.keys(data).length === 0) {
        const noDataMessage = document.createElement('p');
        noDataMessage.className = 'text-sm text-muted-foreground italic text-center py-4';
        noDataMessage.textContent = 'AI tidak menemukan informasi spesifik untuk diekstrak dari teks ini.';
        container.appendChild(noDataMessage);
        return;
    }

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const item = data[key];

        const fieldWrapper = document.createElement('div');
        fieldWrapper.className = 'mb-4'; // Corresponds to space-y-4 or similar

        const label = document.createElement('label');
        label.htmlFor = `ai-field-${key.replace(/\s+/g, '-').toLowerCase()}`;
        label.className = 'mb-1 block text-sm font-medium text-foreground'; // From AirdropForm Label
        label.textContent = key;
        fieldWrapper.appendChild(label);

        const inputWrapperDiv = document.createElement('div');
        inputWrapperDiv.className = 'input-gradient-glow-wrapper'; // Apply wrapper for consistent styling

        let inputElement;
        if (item.tipe === 'string_long' || item.tipe === 'unknown') {
          inputElement = document.createElement('textarea');
          inputElement.rows = 3;
          // Base classes from ShadCN Textarea component
          inputElement.className = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
        } else {
          inputElement = document.createElement('input');
          // Base classes from ShadCN Input component
          inputElement.className = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
          
          if (item.tipe === 'date') inputElement.type = 'text'; // Display as text, actual date type can be tricky
          else if (item.tipe === 'url') inputElement.type = 'url';
          else if (item.tipe === 'number') inputElement.type = 'number';
          else if (item.tipe === 'boolean') inputElement.type = 'text'; // Represent boolean as text for now
          else inputElement.type = 'text'; // Default for string_short
        }
        
        inputElement.id = `ai-field-${key.replace(/\s+/g, '-').toLowerCase()}`;
        inputElement.value = item.nilai;
        inputElement.readOnly = true; // Make fields read-only for review
        
        // Apply consistent placeholder style if needed, though value is set
        // inputElement.placeholder = `AI Extracted ${key}`;
        
        inputWrapperDiv.appendChild(inputElement);
        fieldWrapper.appendChild(inputWrapperDiv);
        container.appendChild(fieldWrapper);
      }
    }
  };
  
  // Reset state when modal closes
  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTextDescription('');
      setExtractedData(null);
      setIsProcessing(false);
       if (dynamicFieldsOutputRef.current) {
        dynamicFieldsOutputRef.current.innerHTML = '';
      }
    }
  };

  const handleReset = () => {
    setTextDescription('');
    setExtractedData(null);
    setIsProcessing(false);
    if (dynamicFieldsOutputRef.current) {
        dynamicFieldsOutputRef.current.innerHTML = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Decorative gradient lines */}
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
                    disabled={isProcessing}
                    className="text-sm"
                />
                </InputWrapper>
            </div>
            
            <Button onClick={handleProcessText} disabled={isProcessing || textDescription.trim().length < 20} className="w-full btn-gradient">
                {isProcessing ? <Loader size="sm" className="mr-1.5 border-primary-foreground" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                {isProcessing ? 'Memproses...' : 'Proses dengan AI'}
            </Button>

            { (extractedData || isProcessing) && ( // Show section if there's data or if processing
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3 border-b border-border/30 pb-2">Hasil Ekstraksi AI:</h3>
                    {isProcessing && !extractedData && (
                         <div className="flex justify-center items-center py-8">
                            <Loader variant="modal" size="md"/>
                         </div>
                    )}
                    <div ref={dynamicFieldsOutputRef} className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {/* Dynamic fields will be rendered here by renderDynamicFields */}
                         {!isProcessing && extractedData && Object.keys(extractedData).length === 0 && (
                             <p className="text-sm text-muted-foreground italic text-center py-4">AI tidak menemukan informasi spesifik untuk diekstrak dari teks ini atau format output tidak sesuai.</p>
                         )}
                    </div>
                </div>
            )}
        </div>
          
        <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 flex justify-between">
            <Button type="button" variant="outline" onClick={handleReset} disabled={isProcessing}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isProcessing}>
                <X className="mr-2 h-4 w-4" /> Tutup
              </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiAssistModal;
