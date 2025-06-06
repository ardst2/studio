
// src/components/dashboard/summary-stats.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BarChart2 } from 'lucide-react'; // Import ikon

interface SummaryStatsProps {
  airdrops: Airdrop[];
  onOpenStatsModal: () => void;
}

const SummaryStats = ({ airdrops, onOpenStatsModal }: SummaryStatsProps) => {
  const totalAirdrops = airdrops.length;
  const activeAirdrops = airdrops.filter(a => a.status === 'Active').length;
  const upcomingAirdrops = airdrops.filter(a => a.status === 'Upcoming').length;
  const completedAirdrops = airdrops.filter(a => a.status === 'Completed').length;

  const overallProgress = totalAirdrops > 0 ? (completedAirdrops / totalAirdrops) * 100 : 0;

  return (
    <Card
      className={cn(
        "shadow-xl w-full h-full bg-card text-card-foreground p-6 flex flex-col justify-center",
        "cursor-pointer transition-all duration-200 ease-in-out"
      )}
      onClick={onOpenStatsModal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenStatsModal(); }}
      aria-label="Lihat statistik detail airdrop"
    >
      <CardHeader className="pb-3 p-0">
        <div className="flex flex-col items-center text-center">
          <BarChart2 className="mb-2 h-8 w-8 text-primary" /> {/* Diubah ke text-primary */}
          <CardTitle className="font-headline text-lg text-foreground">Ringkasan</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-0 mt-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Airdrop:</span>
            <span className="font-medium text-foreground">{totalAirdrops}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Berlangsung:</span>
            <span className="font-medium text-foreground">{activeAirdrops}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Akan Datang:</span>
            <span className="font-medium text-foreground">{upcomingAirdrops}</span>
          </div>
        </div>
        <div className="pt-1">
          <Progress value={overallProgress} aria-label="Overall airdrop progress" className="h-2 bg-muted" />
          <p className="text-xs text-muted-foreground mt-1 text-right">{overallProgress.toFixed(0)}% selesai</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryStats;

