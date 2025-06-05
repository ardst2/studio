
// src/components/dashboard/AiAssistCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react'; // Using Sparkles for AI

interface AiAssistCardProps {
  onClick: () => void;
}

const AiAssistCard = ({ onClick }: AiAssistCardProps) => {
  return (
    <Card
      className={cn(
        "shadow-xl w-full h-full bg-card text-card-foreground p-6 flex flex-col items-center justify-center text-center",
        "cursor-pointer transition-all duration-200 ease-in-out"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      aria-label="Buka Bantuan AI untuk ekstraksi data airdrop"
    >
      <CardHeader className="p-0 pb-2 flex flex-col items-center justify-center">
        <Sparkles className="mb-2 h-8 w-8 text-gradient-theme" />
        <CardTitle className="font-headline text-lg text-foreground">
          Bantuan AI
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-1">
        <p className="text-xs text-muted-foreground">
          Ekstrak info airdrop dari teks secara otomatis.
        </p>
      </CardContent>
    </Card>
  );
};

export default AiAssistCard;
