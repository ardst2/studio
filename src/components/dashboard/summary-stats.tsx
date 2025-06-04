// src/components/dashboard/summary-stats.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ListChecks, History, Rocket, Target } from 'lucide-react';

interface SummaryStatsProps {
  airdrops: Airdrop[];
}

const SummaryStats = ({ airdrops }: SummaryStatsProps) => {
  const totalAirdrops = airdrops.length;
  const activeAirdrops = airdrops.filter(a => a.status === 'Active').length;
  const upcomingAirdrops = airdrops.filter(a => a.status === 'Upcoming').length;
  const completedAirdrops = airdrops.filter(a => a.status === 'Completed').length;

  const overallProgress = totalAirdrops > 0 ? (completedAirdrops / totalAirdrops) * 100 : 0;

  const StatCard = ({ title, value, icon, colorClass }: { title: string; value: number | string; icon: React.ReactNode; colorClass?: string }) => (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className={`text-2xl font-bold ${colorClass || 'text-foreground'}`}>{value}</span>
        </div>
        <div className="mt-2 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="shadow-xl h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Ringkasan Airdrop</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Dilacak" value={totalAirdrops} icon={<ListChecks className="h-6 w-6"/>} />
          <StatCard title="Sedang Aktif" value={activeAirdrops} icon={<Rocket className="h-6 w-6"/>} colorClass="text-accent" />
          <StatCard title="Akan Datang" value={upcomingAirdrops} icon={<History className="h-6 w-6"/>} colorClass="text-blue-400" />
          <StatCard title="Selesai" value={completedAirdrops} icon={<Target className="h-6 w-6"/>} colorClass="text-green-400" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Progress Keseluruhan</span>
            <span className="font-medium text-foreground">{overallProgress.toFixed(0)}%</span>
          </div>
          <Progress value={overallProgress} aria-label="Overall airdrop progress" className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryStats;
