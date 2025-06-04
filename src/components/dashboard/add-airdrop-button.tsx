// src/components/dashboard/add-airdrop-button.tsx
"use client";

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface AddAirdropButtonProps {
  onClick: () => void;
}

const AddAirdropButton = ({ onClick }: AddAirdropButtonProps) => {
  return (
    <Button onClick={onClick} size="lg" className="w-full btn-gradient shadow-lg hover:shadow-xl transition-shadow duration-300">
      <PlusCircle className="mr-2 h-5 w-5" />
      Tambah Airdrop Baru
    </Button>
  );
};

export default AddAirdropButton;
