
// src/components/dashboard/add-airdrop-modal.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import AirdropForm from './airdrop-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Loader from '@/components/ui/loader';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { useState } from 'react';

interface AddAirdropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => Promise<void>;
  initialData?: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>;
}

const AddAirdropModal = ({ isOpen, onClose, onSave, initialData }: AddAirdropModalProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    setIsSaving(true);
    try {
      await onSave(data);
      // onClose(); // Dipanggil dari DashboardPage setelah toast
    } catch (error) {
      console.error("Failed to save airdrop:", error);
      // Toast error akan ditangani di DashboardPage
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 max-h-[85vh] overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>
        
        <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="font-headline text-2xl text-foreground">
                {initialData ? 'Edit Airdrop' : 'Tambah Airdrop Baru'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
                Lengkapi detail airdrop yang ingin Anda lacak. Semakin detail, semakin baik!
            </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-grow min-h-0"> {/* ScrollArea for form content */}
              <div className="p-6 relative"> {/* Padding and relative positioning for loader */}
                {isSaving && (
                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                    <Loader variant="modal" />
                </div>
                )}
                <AirdropForm 
                onSubmit={handleSave} 
                initialData={initialData} 
                onClose={onClose}
                isSaving={isSaving}
                />
              </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAirdropModal;
