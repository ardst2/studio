
// src/components/dashboard/ResearchAirdropModal.tsx
"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FlaskConical, AlertTriangle, CheckCircle, X, RotateCcw, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { researchAirdrop, type ResearchAirdropInput, type ResearchAirdropOutput } from '@/ai/flows/researchAirdropFlow';
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop } from '@/types/airdrop';
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResearchAirdropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

const ResearchAirdropModal = ({ isOpen, onClose }: ResearchAirdropModalProps) => {
  const { toast } = useToast();
  const { addAirdrop: storeAddAirdrop, isLoading: isStoreLoading } = useAirdropsStore();
  const [textQuery, setTextQuery] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchAirdropOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleProcessResearch = async () => {
    if (textQuery.trim().length < 3 && !isValidUrl(sourceUrl)) {
      toast({ variant: "destructive", title: "Input Kurang", description: "Harap masukkan query teks (minimal 3 karakter) atau URL yang valid." });
      return;
    }
    if (sourceUrl && !isValidUrl(sourceUrl)) {
      toast({ variant: "destructive", title: "URL Tidak Valid", description: "Harap masukkan URL yang benar." });
      return;
    }

    setIsProcessing(true);
    setResearchResult(null);
    setErrorMsg(null);

    const input: ResearchAirdropInput = {};
    if (textQuery.trim()) input.textQuery = textQuery.trim();
    if (sourceUrl.trim() && isValidUrl(sourceUrl)) input.sourceUrl = sourceUrl.trim();

    try {
      const result = await researchAirdrop(input);
      setResearchResult(result);
      if(!result.researchSummary && !result.keyPoints?.length && !result.officialLinks?.length) {
        setErrorMsg("AI tidak dapat menghasilkan informasi untuk input ini. Coba dengan query atau URL yang berbeda.");
         toast({
            variant: "default",
            title: "Riset Kurang Memuaskan",
            description: "AI tidak dapat menemukan banyak informasi. Coba lagi atau gunakan input berbeda.",
        });
      } else {
        toast({
            title: "Riset Selesai",
            description: "Hasil riset AI tersedia di bawah.",
            action: <CheckCircle className="text-green-500" />,
        });
      }
    } catch (error: any) {
      console.error("AI research error:", error);
      setErrorMsg(error.message || "Terjadi kesalahan saat meriset dengan AI.");
      toast({
        variant: "destructive",
        title: "Riset Gagal",
        description: error.message || "Terjadi kesalahan saat meriset dengan AI.",
        action: <AlertTriangle className="text-red-500" />,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAirdrop = async () => {
    if (!researchResult) {
      toast({ variant: "destructive", title: "Tidak Ada Hasil", description: "Tidak ada hasil riset untuk disimpan." });
      return;
    }
    setIsSaving(true);

    const newAirdropData: Partial<Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>> = {
      name: `Airdrop (Riset) ${new Date().toLocaleTimeString()}`,
      description: researchResult.researchSummary || '',
      notes: '',
      tasks: [],
      informationSource: sourceUrl || "Hasil Riset AI",
      userDefinedStatus: researchResult.sentiment || undefined,
    };

    let notesContent = "Hasil riset AI:\n";
    if (researchResult.researchSummary && researchResult.researchSummary.length > 200) { // if summary is long, put it in notes instead of description
        notesContent += `Ringkasan: ${researchResult.researchSummary}\n\n`;
        newAirdropData.description = `Riset untuk proyek terkait ${textQuery || sourceUrl}`;
    } else {
        newAirdropData.description = researchResult.researchSummary || `Riset untuk proyek terkait ${textQuery || sourceUrl}`;
    }

    if (researchResult.keyPoints && researchResult.keyPoints.length > 0) {
      notesContent += "Poin Kunci:\n" + researchResult.keyPoints.map(p => `- ${p}`).join("\n") + "\n\n";
    }
    if (researchResult.officialLinks && researchResult.officialLinks.length > 0) {
      notesContent += "Link Resmi:\n" + researchResult.officialLinks.map(l => `- ${l}`).join("\n") + "\n\n";
      // Try to set the first official link as the airdropLink if it's a website
      const websiteLink = researchResult.officialLinks.find(link => !link.includes('twitter.com') && !link.includes('discord.com') && !link.includes('t.me'));
      newAirdropData.airdropLink = websiteLink || researchResult.officialLinks[0];
    }
     if (researchResult.sentiment) {
      notesContent += `Sentimen/Potensi: ${researchResult.sentiment}\n`;
    }

    newAirdropData.notes = notesContent.trim();
    
    try {
      const finalData: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'> = {
        name: newAirdropData.name!,
        description: newAirdropData.description,
        startDate: newAirdropData.startDate,
        deadline: newAirdropData.deadline,
        tasks: newAirdropData.tasks || [],
        blockchain: newAirdropData.blockchain,
        registrationDate: newAirdropData.registrationDate,
        participationRequirements: newAirdropData.participationRequirements,
        airdropLink: newAirdropData.airdropLink,
        userDefinedStatus: newAirdropData.userDefinedStatus,
        notes: newAirdropData.notes,
        walletAddress: newAirdropData.walletAddress,
        tokenAmount: newAirdropData.tokenAmount,
        claimDate: newAirdropData.claimDate,
        airdropType: newAirdropData.airdropType,
        referralCode: newAirdropData.referralCode,
        informationSource: newAirdropData.informationSource,
      };
      await storeAddAirdrop(finalData);
      toast({ title: "Airdrop Disimpan", description: `"${finalData.name}" berhasil disimpan dari hasil riset.` });
      handleModalClose();
    } catch (error: any) {
      console.error("Error saving airdrop from research:", error);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: error.message || "Terjadi kesalahan saat menyimpan airdrop." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleModalClose = () => {
    onClose();
    setTextQuery('');
    setSourceUrl('');
    setResearchResult(null);
    setIsProcessing(false);
    setErrorMsg(null);
    setIsSaving(false);
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
            <FlaskConical className="w-6 h-6 mr-2 text-gradient-theme" /> Riset Airdrop dengan AI
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Masukkan teks, pertanyaan, atau URL terkait airdrop. AI akan mencoba memberikan analisis.
             <br /><span className="text-xs text-muted-foreground/70">Untuk URL, kemampuan AI saat ini terbatas pada informasi publik yang telah diindeksnya.</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto min-h-0">
            <div className="p-6 space-y-4">
            <div>
                <Label htmlFor="sourceUrlResearchModal" className="mb-1 block text-sm font-medium">URL Sumber (Opsional)</Label>
                <InputWrapper>
                <Input
                    id="sourceUrlResearchModal"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Contoh: https://blog.proyekxyz.com/airdrop-info"
                    type="url"
                    disabled={isProcessing || isSaving}
                    className="text-sm"
                />
                </InputWrapper>
            </div>
            <div>
                <Label htmlFor="textQueryResearchModal" className="mb-1 block text-sm font-medium">Pertanyaan / Teks untuk Riset (Opsional)</Label>
                <InputWrapper>
                <Textarea
                    id="textQueryResearchModal"
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    placeholder="Contoh: 'Bagaimana potensi airdrop Proyek XYZ?' atau paste teks pengumuman..."
                    rows={5}
                    disabled={isProcessing || isSaving}
                    className="text-sm"
                />
                </InputWrapper>
            </div>

            <Button onClick={handleProcessResearch} disabled={isProcessing || isSaving || (textQuery.trim().length < 3 && !isValidUrl(sourceUrl))} className="w-full btn-gradient">
                {isProcessing ? <Loader size="sm" className="mr-1.5 border-primary-foreground" /> : <FlaskConical className="mr-1.5 h-4 w-4" />}
                {isProcessing ? 'Meriset...' : 'Proses Riset dengan AI'}
            </Button>

            {(researchResult || isProcessing || errorMsg) && (
                <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3 border-b border-border/30 pb-2">Hasil Riset AI:</h3>
                {isProcessing && !researchResult && (
                    <div className="flex justify-center items-center py-8">
                    <Loader variant="modal" size="md" />
                    </div>
                )}
                 {errorMsg && !isProcessing && (
                    <p className="text-sm text-destructive italic text-center py-4">{errorMsg}</p>
                )}
                {researchResult && !isProcessing && (
                    <div className="space-y-3 text-sm">
                        {researchResult.researchSummary && (
                            <div>
                                <h4 className="font-semibold text-muted-foreground">Ringkasan:</h4>
                                <p className="bg-input/50 p-3 rounded-md whitespace-pre-wrap">{researchResult.researchSummary}</p>
                            </div>
                        )}
                        {researchResult.keyPoints && researchResult.keyPoints.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-muted-foreground">Poin Kunci:</h4>
                                <ul className="list-disc list-inside bg-input/50 p-3 rounded-md space-y-1">
                                    {researchResult.keyPoints.map((point, idx) => <li key={idx}>{point}</li>)}
                                </ul>
                            </div>
                        )}
                        {researchResult.officialLinks && researchResult.officialLinks.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-muted-foreground">Link Resmi:</h4>
                                <ul className="list-disc list-inside bg-input/50 p-3 rounded-md space-y-1">
                                    {researchResult.officialLinks.map((link, idx) => <li key={idx}><a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{link}</a></li>)}
                                </ul>
                            </div>
                        )}
                        {researchResult.sentiment && (
                             <div>
                                <h4 className="font-semibold text-muted-foreground">Sentimen/Potensi:</h4>
                                <p className="bg-input/50 p-3 rounded-md">{researchResult.sentiment}</p>
                            </div>
                        )}
                    </div>
                )}
                </div>
            )}
            </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 flex flex-col sm:flex-row justify-between gap-2">
            <Button type="button" variant="outline" onClick={handleModalClose} disabled={isProcessing || isSaving}>
                <X className="mr-2 h-4 w-4" /> Tutup
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => {setTextQuery(''); setSourceUrl(''); setResearchResult(null); setErrorMsg(null);}} disabled={isProcessing || isSaving}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                 <Button
                    type="button"
                    className="btn-gradient"
                    onClick={handleSaveAirdrop}
                    disabled={isProcessing || isSaving || !researchResult || isStoreLoading || (!researchResult.researchSummary && !researchResult.keyPoints?.length && !researchResult.officialLinks?.length)}
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

export default ResearchAirdropModal;
