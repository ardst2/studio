
// src/components/dashboard/summary-stats.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// Icons like ListChecks, History, Rocket, Target are not in the new design for this card.
// The new design shows simple text labels.

interface SummaryStatsProps {
  airdrops: Airdrop[];
}

const SummaryStats = ({ airdrops }: SummaryStatsProps) => {
  const totalAirdrops = airdrops.length;
  const activeAirdrops = airdrops.filter(a => a.status === 'Active').length;
  const upcomingAirdrops = airdrops.filter(a => a.status === 'Upcoming').length;
  const completedAirdrops = airdrops.filter(a => a.status === 'Completed').length;

  const overallProgress = totalAirdrops > 0 ? (completedAirdrops / totalAirdrops) * 100 : 0;

  return (
    <Card className="shadow-xl h-full bg-card text-card-foreground">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline text-xl text-foreground">Ringkasan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <div>
          <Progress value={overallProgress} aria-label="Overall airdrop progress" className="h-2 bg-muted" />
          <p className="text-xs text-muted-foreground mt-1 text-right">{overallProgress.toFixed(0)}% selesai</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryStats;
