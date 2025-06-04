// src/components/dashboard/add-airdrop-modal.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import AirdropForm from './airdrop-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Loader from '@/components/ui/loader'; 
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
    } catch (error) {
      console.error("Failed to save airdrop:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 max-h-[85vh] overflow-y-auto">
        <div className="relative">
          {/* Decorative gradient lines using new theme colors */}
          <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg"></div>
          
          <DialogHeader className="p-6 pb-4 border-b border-border/30 sticky top-0 bg-card z-10">
            <DialogTitle className="font-headline text-2xl text-foreground">
              {initialData ? 'Edit Airdrop' : 'Tambah Airdrop Baru'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Isi detail airdrop yang ingin Anda lacak. Semua kolom bersifat opsional.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6"> {/* Removed max-h and overflow-y-auto from here */}
            {isSaving && (
              <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center z-50">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAirdropModal;
