// src/components/dashboard/add-airdrop-modal.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import AirdropForm from './airdrop-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Loader from '@/components/ui/loader';
// ScrollArea is not used in this reverted version
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
      <DialogContent className="sm:max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
        {/* Decorative gradient lines using new theme colors */}
        {/* These are relative to DialogContent which has p-6. They will be inset by p-6. */}
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>
        
        <DialogHeader className="pb-4"> {/* Simple header padding */}
          <DialogTitle className="font-headline text-2xl text-foreground">
            {initialData ? 'Edit Airdrop' : 'Tambah Airdrop Baru'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Isi detail airdrop yang ingin Anda lacak. Semua kolom bersifat opsional.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-6"> {/* Spacing for the form */}
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
      </DialogContent>
    </Dialog>
  );
};

export default AddAirdropModal;
