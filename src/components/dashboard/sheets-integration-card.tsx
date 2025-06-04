
// src/components/dashboard/sheets-integration-card.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react'; // Upload icon removed
import { useToast } from "@/hooks/use-toast";
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import { importAirdropsFromSheet } from '@/ai/flows/sheets-integration-flow';
// Types related to export are removed
import type { Airdrop } from '@/types/airdrop';
import Loader from '@/components/ui/loader';
import { cn } from '@/lib/utils';

const InputWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("input-gradient-glow-wrapper", className)}>{children}</div>
);

const SheetsIntegrationCard = () => {
  const { toast } = useToast();
  // allAirdrops is not needed if export is removed, but addManyAirdrops is.
  const { addManyAirdrops, isLoading: storeLoading } = useAirdropsStore(); 
  const [sheetId, setSheetId] = useState('');
  const [tabName, setTabName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!sheetId || !tabName) {
      toast({ variant: "destructive", title: "Input Required", description: "Please provide Google Sheet ID and Tab Name." });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await importAirdropsFromSheet({ sheetId, tabName });
      if (result.importedAirdrops.length > 0) {
        const airdropsToAdd: Omit<Airdrop, 'id' | 'userId' | 'createdAt'>[] = result.importedAirdrops.map(imported => ({
            name: imported.name,
            description: imported.description,
            startDate: imported.startDate,
            deadline: imported.deadline,
            tasks: imported.tasks || [],
            status: imported.status || 'Upcoming',
        }));
        await addManyAirdrops(airdropsToAdd);
      }
      toast({
        title: "Import Successful",
        description: result.message,
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message || "An unknown error occurred during import.",
        action: <AlertTriangle className="text-red-500" />,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // handleExport function removed

  return (
    <Card className="shadow-xl h-full bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-foreground flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gradient-theme"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/></svg>
          Import from Google Sheets
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Import airdrops from a Google Sheet.
          Ensure your server environment is authenticated with Google Sheets API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="sheetId" className="mb-1 block text-sm font-medium">Google Sheet ID</Label>
          <InputWrapper>
            <Input
              id="sheetId"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="e.g., 1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789-ab"
              disabled={isProcessing}
            />
          </InputWrapper>
        </div>
        <div>
          <Label htmlFor="tabName" className="mb-1 block text-sm font-medium">Tab Name</Label>
          <InputWrapper>
            <Input
              id="tabName"
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              placeholder="e.g., Airdrops Q1"
              disabled={isProcessing}
            />
          </InputWrapper>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button onClick={handleImport} disabled={isProcessing || storeLoading} className="flex-1 btn-gradient">
            {isProcessing ? <Loader size="sm" className="mr-2 border-primary-foreground" /> : <Download className="mr-2 h-4 w-4" />}
            Import from Sheet
          </Button>
          {/* Export button removed */}
        </div>
         <p className="text-xs text-muted-foreground pt-2">
           Expected sheet columns for import: Name, Description, StartDate (YYYY-MM-DD), Deadline (YYYY-MM-DD), Tasks (text;text;...), Status. The first row should be headers.
        </p>
      </CardContent>
    </Card>
  );
};

export default SheetsIntegrationCard;

