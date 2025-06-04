// src/components/dashboard/sheets-integration-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SheetsIntegrationCardProps {
  onClick: () => void;
}

const SheetsIntegrationCard = ({ onClick }: SheetsIntegrationCardProps) => {
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
      aria-label="Impor airdrop dari Google Sheets"
    >
      <CardHeader className="p-0 pb-2 flex flex-col items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-gradient-theme"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/></svg>
        <CardTitle className="font-headline text-lg text-foreground">
          Import dari Sheets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-1">
        <p className="text-xs text-muted-foreground">
          Tarik data airdrop dari spreadsheet Anda.
        </p>
      </CardContent>
    </Card>
  );
};

export default SheetsIntegrationCard;