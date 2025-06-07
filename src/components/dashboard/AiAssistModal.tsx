
// src/components/dashboard/AiAssistModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, AlertTriangle, CheckCircle, X, RotateCcw, Save, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { extractAirdropDetails, type ExtractAirdropOutput, type ExtractAirdropInput } from '@/ai/flows/extractAirdropTextFlow';
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop, AirdropTask } from '@/types/airdrop';
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parse, isValid as isValidDate } from 'date-fns';

interface AiAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

// Initial state for editable fields, mirroring ExtractAirdropOutput but with appropriate types for form
const initialEditableData: ExtractAirdropOutput = {
    name: '',
    startDate: undefined, // string YYYY-MM-DD
    deadline: undefined,  // string YYYY-MM-DD
    blockchain: '',
    registrationDate: undefined, // string YYYY-MM-DD
    participationRequirements: '',
    airdropLink: '',
    informationSource: '',
    userDefinedStatus: '',
    description: '',
    notes: '',
    walletAddress: '',
    tokenAmount: undefined, // number
    claimDate: undefined,   // string YYYY-MM-DD
    airdropType: '',
    referralCode: '',
    tasks: [], // array of strings
    aiSummary: '',
};


const AiAssistModal = ({ isOpen, onClose }: AiAssistModalProps) => {
  const { toast } = useToast();
  const { addAirdrop: storeAddAirdrop, isLoading: isStoreLoading } = useAirdropsStore();
  
  const [textDescriptionInput, setTextDescriptionInput] = useState('');
  const [sourceUrlInput, setSourceUrlInput] = useState(''); 
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editableData, setEditableData] = useState<ExtractAirdropOutput>(initialEditableData);
  const [newTaskText, setNewTaskText] = useState('');


  useEffect(() => {
    if (isOpen) {
        // Reset form when modal opens
        setTextDescriptionInput('');
        setSourceUrlInput('');
        setEditableData(initialEditableData);
        setIsProcessing(false);
        setIsSaving(false);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof ExtractAirdropOutput, value: any) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...(editableData.tasks || [])];
    newTasks[index] = value;
    handleInputChange('tasks', newTasks);
  };

  const handleAddTask = () => {
    if (newTaskText.trim() !== '') {
      const newTasks = [...(editableData.tasks || []), newTaskText.trim()];
      handleInputChange('tasks', newTasks);
      setNewTaskText('');
    }
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = [...(editableData.tasks || [])];
    newTasks.splice(index, 1);
    handleInputChange('tasks', newTasks);
  };


  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleProcessText = async () => {
    if (textDescriptionInput.trim().length < 3 && !isValidUrl(sourceUrlInput)) {
      toast({ variant: "destructive", title: "Input Kurang", description: "Harap masukkan deskripsi airdrop (minimal 3 karakter) atau URL yang valid." });
      return;
    }
     if (sourceUrlInput && !isValidUrl(sourceUrlInput)) {
      toast({ variant: "destructive", title: "URL Tidak Valid", description: "Harap masukkan URL yang benar." });
      return;
    }

    setIsProcessing(true);
    setEditableData(initialEditableData); // Reset previous results

    const input: ExtractAirdropInput = {};
    if (textDescriptionInput.trim()) input.textDescription = textDescriptionInput.trim();
    if (sourceUrlInput.trim() && isValidUrl(sourceUrlInput)) input.sourceUrl = sourceUrlInput.trim();

    try {
      const result = await extractAirdropDetails(input);
      setEditableData({
        ...initialEditableData, // Start with defaults
        ...result, // Override with AI results
        tasks: Array.isArray(result.tasks) ? result.tasks : [], // Ensure tasks is always an array
      });
      toast({
        title: "Ekstraksi Selesai",
        description: result.aiSummary || `Informasi berhasil diekstrak. Silakan tinjau dan simpan jika sesuai.`,
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (error: any) {
      console.error("AI processing error:", error);
      toast({
        variant: "destructive",
        title: "Ekstraksi Gagal",
        description: error.message || "Terjadi kesalahan saat memproses dengan AI.",
        action: <AlertTriangle className="text-red-500" />,
      });
      setEditableData(initialEditableData);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const parseDateStringToTimestamp = (dateString?: string): number | undefined => {
    if (!dateString) return undefined;
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    return isValidDate(parsedDate) ? parsedDate.getTime() : undefined;
  };

  const handleSaveAirdrop = async () => {
    if (!editableData.name && !editableData.description) { // Basic check if there's anything to save
      toast({ variant: "destructive", title: "Tidak Ada Data", description: "Tidak ada data hasil ekstraksi AI yang cukup untuk disimpan." });
      return;
    }
    setIsSaving(true);

    const airdropToSave: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'> = {
      name: editableData.name || `Airdrop (AI) ${new Date().toLocaleTimeString()}`,
      startDate: parseDateStringToTimestamp(editableData.startDate),
      deadline: parseDateStringToTimestamp(editableData.deadline),
      blockchain: editableData.blockchain,
      registrationDate: parseDateStringToTimestamp(editableData.registrationDate),
      participationRequirements: editableData.participationRequirements,
      airdropLink: editableData.airdropLink,
      informationSource: editableData.informationSource,
      userDefinedStatus: editableData.userDefinedStatus,
      description: editableData.description,
      notes: (editableData.notes || '') + (editableData.aiSummary ? `\n\nRingkasan AI:\n${editableData.aiSummary}` : ''),
      walletAddress: editableData.walletAddress,
      tokenAmount: editableData.tokenAmount,
      claimDate: parseDateStringToTimestamp(editableData.claimDate),
      airdropType: editableData.airdropType,
      referralCode: editableData.referralCode,
      tasks: (editableData.tasks || []).map((taskText): AirdropTask => ({
        id: crypto.randomUUID(), // Generate new ID for tasks
        text: taskText,
        completed: false,
      })),
    };
    
    try {
      await storeAddAirdrop(airdropToSave);
      toast({ title: "Airdrop Disimpan", description: `"${airdropToSave.name}" berhasil disimpan dari ekstraksi AI.` });
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
    // State will be reset by useEffect when isOpen changes
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      handleModalClose();
    }
  };

  const isAnyExtractedData = Object.values(editableData).some(val => {
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== '' && val !== null;
  }) && editableData.aiSummary; // Only consider data "extracted" if AI also gave a summary


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
            Paste teks pengumuman airdrop atau masukkan URL sumber. AI akan mencoba mengekstrak informasi penting ke dalam field di bawah ini. Anda dapat meninjau dan mengedit sebelum menyimpan.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto min-h-0">
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="sourceUrlAiModal" className="mb-1 block text-sm font-medium">URL Sumber (Opsional)</Label>
              <InputWrapper>
                <Input
                  id="sourceUrlAiModal"
                  value={sourceUrlInput}
                  onChange={(e) => setSourceUrlInput(e.target.value)}
                  placeholder="Contoh: https://medium.com/proyekxyz/airdrop-is-live"
                  type="url"
                  disabled={isProcessing || isSaving}
                  className="text-sm"
                />
              </InputWrapper>
            </div>
            <div>
              <Label htmlFor="textDescriptionAiModal" className="mb-1 block text-sm font-medium">Teks Deskripsi Airdrop (Opsional)</Label>
              <InputWrapper>
                <Textarea
                  id="textDescriptionAiModal"
                  value={textDescriptionInput}
                  onChange={(e) => setTextDescriptionInput(e.target.value)}
                  placeholder="Paste teks lengkap pengumuman airdrop di sini..."
                  rows={6}
                  disabled={isProcessing || isSaving}
                  className="text-sm"
                />
              </InputWrapper>
            </div>

            <Button onClick={handleProcessText} disabled={isProcessing || isSaving || (textDescriptionInput.trim().length < 3 && !isValidUrl(sourceUrlInput))} className="w-full btn-gradient">
              {isProcessing ? <Loader size="sm" className="mr-1.5 border-primary-foreground" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              {isProcessing ? 'Memproses...' : 'Proses dengan AI'}
            </Button>

            {/* Form Fields for Editing AI Extracted Data */}
            {(isAnyExtractedData || isProcessing) && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-3 border-b border-border/30 pb-2">Hasil Ekstraksi AI (Dapat Diedit):</h3>
                {isProcessing && !isAnyExtractedData && (
                  <div className="flex justify-center items-center py-8">
                    <Loader variant="modal" size="md" />
                  </div>
                )}
                {!isProcessing && !isAnyExtractedData && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">Belum ada data dari AI atau AI tidak menemukan informasi.</p>
                )}

                {isAnyExtractedData && !isProcessing && (
                  <>
                    {/* Name */}
                    <div>
                      <Label htmlFor="ai-name" className="mb-1 block text-sm font-medium">Nama Airdrop</Label>
                      <InputWrapper><Input id="ai-name" value={editableData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Nama proyek atau airdrop" /></InputWrapper>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ai-startDate" className="mb-1 block text-sm font-medium">Tanggal Mulai (YYYY-MM-DD)</Label>
                        <InputWrapper><Input id="ai-startDate" type="date" value={editableData.startDate || ''} onChange={(e) => handleInputChange('startDate', e.target.value)} /></InputWrapper>
                      </div>
                      <div>
                        <Label htmlFor="ai-deadline" className="mb-1 block text-sm font-medium">Tanggal Berakhir (YYYY-MM-DD)</Label>
                        <InputWrapper><Input id="ai-deadline" type="date" value={editableData.deadline || ''} onChange={(e) => handleInputChange('deadline', e.target.value)} /></InputWrapper>
                      </div>
                    </div>
                     <div>
                        <Label htmlFor="ai-registrationDate" className="mb-1 block text-sm font-medium">Tanggal Daftar (YYYY-MM-DD)</Label>
                        <InputWrapper><Input id="ai-registrationDate" type="date" value={editableData.registrationDate || ''} onChange={(e) => handleInputChange('registrationDate', e.target.value)} /></InputWrapper>
                      </div>
                       <div>
                        <Label htmlFor="ai-claimDate" className="mb-1 block text-sm font-medium">Tanggal Klaim (YYYY-MM-DD)</Label>
                        <InputWrapper><Input id="ai-claimDate" type="date" value={editableData.claimDate || ''} onChange={(e) => handleInputChange('claimDate', e.target.value)} /></InputWrapper>
                      </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="ai-description" className="mb-1 block text-sm font-medium">Deskripsi Umum</Label>
                      <InputWrapper><Textarea id="ai-description" value={editableData.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Deskripsi airdrop" rows={3} /></InputWrapper>
                    </div>
                    
                    {/* Participation Requirements */}
                    <div>
                      <Label htmlFor="ai-participationRequirements" className="mb-1 block text-sm font-medium">Syarat Partisipasi</Label>
                      <InputWrapper><Textarea id="ai-participationRequirements" value={editableData.participationRequirements || ''} onChange={(e) => handleInputChange('participationRequirements', e.target.value)} placeholder="Syarat untuk ikut" rows={3} /></InputWrapper>
                    </div>

                    {/* Links and Source */}
                     <div>
                      <Label htmlFor="ai-airdropLink" className="mb-1 block text-sm font-medium">Link Airdrop</Label>
                      <InputWrapper><Input id="ai-airdropLink" type="url" value={editableData.airdropLink || ''} onChange={(e) => handleInputChange('airdropLink', e.target.value)} placeholder="https://contohairdrop.com" /></InputWrapper>
                    </div>
                    <div>
                      <Label htmlFor="ai-informationSource" className="mb-1 block text-sm font-medium">Sumber Informasi</Label>
                      <InputWrapper><Input id="ai-informationSource" value={editableData.informationSource || ''} onChange={(e) => handleInputChange('informationSource', e.target.value)} placeholder="Twitter, Blog, dll." /></InputWrapper>
                    </div>
                    
                    {/* Other details */}
                     <div>
                      <Label htmlFor="ai-blockchain" className="mb-1 block text-sm font-medium">Blockchain</Label>
                      <InputWrapper><Input id="ai-blockchain" value={editableData.blockchain || ''} onChange={(e) => handleInputChange('blockchain', e.target.value)} placeholder="Ethereum, Solana, dll." /></InputWrapper>
                    </div>
                     <div>
                      <Label htmlFor="ai-userDefinedStatus" className="mb-1 block text-sm font-medium">Status Kustom</Label>
                      <InputWrapper><Input id="ai-userDefinedStatus" value={editableData.userDefinedStatus || ''} onChange={(e) => handleInputChange('userDefinedStatus', e.target.value)} placeholder="Applied, KYC Done" /></InputWrapper>
                    </div>
                     <div>
                      <Label htmlFor="ai-walletAddress" className="mb-1 block text-sm font-medium">Alamat Wallet</Label>
                      <InputWrapper><Input id="ai-walletAddress" value={editableData.walletAddress || ''} onChange={(e) => handleInputChange('walletAddress', e.target.value)} placeholder="0x..." /></InputWrapper>
                    </div>
                     <div>
                      <Label htmlFor="ai-tokenAmount" className="mb-1 block text-sm font-medium">Jumlah Token</Label>
                      <InputWrapper><Input id="ai-tokenAmount" type="number" value={editableData.tokenAmount || ''} onChange={(e) => handleInputChange('tokenAmount', e.target.valueAsNumber)} placeholder="100" /></InputWrapper>
                    </div>
                     <div>
                      <Label htmlFor="ai-airdropType" className="mb-1 block text-sm font-medium">Jenis Airdrop</Label>
                      <InputWrapper><Input id="ai-airdropType" value={editableData.airdropType || ''} onChange={(e) => handleInputChange('airdropType', e.target.value)} placeholder="Retroaktif, Testnet" /></InputWrapper>
                    </div>
                     <div>
                      <Label htmlFor="ai-referralCode" className="mb-1 block text-sm font-medium">Kode Referral</Label>
                      <InputWrapper><Input id="ai-referralCode" value={editableData.referralCode || ''} onChange={(e) => handleInputChange('referralCode', e.target.value)} placeholder="Jika ada" /></InputWrapper>
                    </div>

                    {/* Tasks */}
                    <div>
                        <Label className="mb-1 block text-sm font-medium">Tugas-tugas</Label>
                        {(editableData.tasks || []).map((task, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                            <InputWrapper className="flex-grow"><Input value={task} onChange={(e) => handleTaskChange(index, e.target.value)} placeholder={`Tugas ${index + 1}`} /></InputWrapper>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTask(index)} aria-label="Hapus tugas"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 mt-2">
                            <InputWrapper className="flex-grow"><Input value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Tambahkan tugas baru..." /></InputWrapper>
                            <Button type="button" variant="outline" onClick={handleAddTask} className="shrink-0"><PlusCircle className="mr-2 h-4 w-4" /> Tambah Tugas</Button>
                        </div>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <Label htmlFor="ai-notes" className="mb-1 block text-sm font-medium">Catatan Tambahan (dari AI)</Label>
                      <InputWrapper><Textarea id="ai-notes" value={editableData.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Catatan dari AI atau informasi tambahan" rows={3} /></InputWrapper>
                    </div>

                    {/* AI Summary (Read-only) */}
                    {editableData.aiSummary && (
                         <div>
                            <Label className="mb-1 block text-sm font-medium text-muted-foreground">Ringkasan Proses AI</Label>
                            <p className="text-xs bg-muted/50 p-3 rounded-md text-muted-foreground whitespace-pre-wrap">{editableData.aiSummary}</p>
                        </div>
                    )}
                  </>
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
                <Button type="button" variant="outline" onClick={() => { setTextDescriptionInput(''); setSourceUrlInput(''); setEditableData(initialEditableData); }} disabled={isProcessing || isSaving}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Form
                </Button>
                <Button 
                    type="button" 
                    className="btn-gradient" 
                    onClick={handleSaveAirdrop} 
                    disabled={isProcessing || isSaving || !isAnyExtractedData || isStoreLoading}
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

    