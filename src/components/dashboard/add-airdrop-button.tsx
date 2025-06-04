
// src/components/dashboard/add-airdrop-button.tsx
"use client";

import { Button } from '@/components/ui/button';
// SVG icon is complex, will keep as is for now, focusing on button style.
// Ideally, the SVG would use `currentColor` for parts that should match button text color.

interface AddAirdropButtonProps {
  onClick: () => void;
}

const AddAirdropButton = ({ onClick }: AddAirdropButtonProps) => {
  return (
    <div className="input-gradient-glow-wrapper w-full">
      <Button
        onClick={onClick}
        variant="ghost" // Use ghost variant as a base
        size="lg"
        className="w-full text-base py-6 focus-visible:ring-0 focus-visible:ring-offset-0 add-airdrop-style shadow-none hover:shadow-none" // Added add-airdrop-style, removed conflicting shadows
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
          {/* Paths for the icon - using currentColor will make relevant parts adopt button's text color */}
          <path d="M21 10H3"/>
          <path d="M21 6H3"/>
          <path d="M12 2v20"/>
          <path d="M21 14H3"/>
          <path d="M21 18H3"/>
          <rect x="3" y="2" width="18" height="20" rx="2" ry="2" stroke="none" fill="currentColor" opacity="0.3"/>
          <path d="M12 2L12 22M16 6H8M16 10H8M16 14H8M16 18H8" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.7"/> 
          <path d="M20 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H20C21.1046 18 22 17.1046 22 16V8C22 6.89543 21.1046 6 20 6Z" fill="currentColor" opacity="0.5"/>
          <line x1="12" y1="2" x2="12" y2="22" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.8" strokeWidth="1.5"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.8" strokeWidth="1.5"/>
        </svg>
        Tambah Airdrop Baru
      </Button>
    </div>
  );
};

export default AddAirdropButton;
