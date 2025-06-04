
// src/components/dashboard/add-airdrop-button.tsx
"use client";

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react'; // Or any other relevant icon from the image, like the box/package.

interface AddAirdropButtonProps {
  onClick: () => void;
}

const AddAirdropButton = ({ onClick }: AddAirdropButtonProps) => {
  return (
    <Button 
      onClick={onClick} 
      size="lg" 
      className="w-full btn-gradient shadow-lg hover:shadow-xl transition-shadow duration-300 text-base py-6" // Adjusted padding and text size
    >
      {/* The image shows an icon resembling a gift box or package. PlusCircle is a placeholder. */}
      {/* Using an SVG for the box icon shown in the image for better fidelity */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <path d="M21 10H3"/>
        <path d="M21 6H3"/>
        <path d="M12 2v20"/>
        <path d="M21 14H3"/>
        <path d="M21 18H3"/>
        <rect x="3" y="2" width="18" height="20" rx="2" ry="2" stroke="none" fill="currentColor" opacity="0.3"/>
         <path d="M12 2L12 22M16 6H8M16 10H8M16 14H8M16 18H8" stroke="white" strokeOpacity="0.5"/>
         <path d="M20 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H20C21.1046 18 22 17.1046 22 16V8C22 6.89543 21.1046 6 20 6Z" fill="currentColor" opacity="0.5"/>
         <path d="M12 2V22" stroke="white" strokeOpacity="0.6"/>
         <line x1="12" y1="2" x2="12" y2="22" stroke="white" strokeOpacity="0.6" strokeWidth="1.5"/>
         <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeOpacity="0.6" strokeWidth="1.5"/>
         <path d="M18 6L17.625 2.5M6 6L6.375 2.5M18 18L17.625 21.5M6 18L6.375 21.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" />
      </svg>
      Tambah Airdrop Baru
    </Button>
  );
};

export default AddAirdropButton;

