// src/components/dashboard/add-airdrop-modal.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import AirdropForm from './airdrop-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Loader from '@/components/ui/loader'; // Assuming Loader is the gradient spinner
import { useState } from 'react';

interface AddAirdropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => Promise<void>; // Make onSave async
  initialData?: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>; // For editing
}

const AddAirdropModal = ({ isOpen, onClose, onSave, initialData }: AddAirdropModalProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    setIsSaving(true);
    try {
      await onSave(data); // Call the async onSave
      // onClose will be called by parent upon successful save if needed
    } catch (error) {
      console.error("Failed to save airdrop:", error);
      // Potentially show a toast message here
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card shadow-2xl border-primary/30 p-0">
        <div className="relative">
          {/* Optional: Decorative gradient lines for futuristic feel */}
          <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-primary to-transparent rounded-tl-lg"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-primary to-transparent rounded-br-lg"></div>
          
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="font-headline text-2xl text-foreground">
              {initialData ? 'Edit Airdrop' : 'Tambah Airdrop Baru'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Isi detail airdrop yang ingin Anda lacak. Semua kolom bersifat opsional.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
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
