
// src/components/dashboard/AirdropStatsModal.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, LineChart, PieChartIcon, X } from 'lucide-react';
import { useMemo } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AirdropStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  airdrops: Airdrop[];
}

const AirdropStatsModal = ({ isOpen, onClose, airdrops }: AirdropStatsModalProps) => {
  const statusDistribution = useMemo(() => {
    const counts = { Upcoming: 0, Active: 0, Completed: 0 };
    airdrops.forEach(airdrop => {
      counts[airdrop.status]++;
    });
    return [
      { name: 'Akan Datang', value: counts.Upcoming, fill: 'hsl(var(--chart-1))' },
      { name: 'Berlangsung', value: counts.Active, fill: 'hsl(var(--chart-2))' },
      { name: 'Selesai', value: counts.Completed, fill: 'hsl(var(--chart-3))' },
    ].filter(item => item.value > 0);
  }, [airdrops]);

  const statusChartConfig = {
    "Akan Datang": { label: "Akan Datang", color: "hsl(var(--chart-1))" },
    "Berlangsung": { label: "Berlangsung", color: "hsl(var(--chart-2))" },
    "Selesai": { label: "Selesai", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;


  const activityOverTime = useMemo(() => {
    const today = new Date();
    const data = Array(7).fill(null).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i)); // Iterate from 6 days ago to today
      date.setHours(0, 0, 0, 0);
      return {
        dateLabel: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        timestamp: date.getTime(),
        airdropsAdded: 0,
      };
    });

    airdrops.forEach(airdrop => {
      if (airdrop.createdAt) {
        const createdAtDate = new Date(airdrop.createdAt);
        createdAtDate.setHours(0, 0, 0, 0);
        const dayEntry = data.find(d => d.timestamp === createdAtDate.getTime());
        if (dayEntry) {
          dayEntry.airdropsAdded++;
        }
      }
    });
    return data;
  }, [airdrops]);

  const activityChartConfig = {
    airdropsAdded: { label: "Airdrop Baru", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;


  if (!isOpen) return null;

  const totalAirdrops = airdrops.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl bg-card/95 backdrop-blur-lg shadow-2xl border-border/60 p-0 max-h-[85vh] overflow-hidden">
        {/* Decorative gradient lines */}
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-tl-lg z-[1]"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1 bg-gradient-to-l from-[hsl(var(--gradient-theme-start))] via-[hsl(var(--gradient-theme-mid))] to-transparent rounded-br-lg z-[1]"></div>

        <div className="relative flex flex-col h-full">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="font-headline text-2xl text-foreground flex items-center">
              <BarChart className="w-6 h-6 mr-2 text-gradient-theme" /> Statistik Airdrop
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Visualisasi data airdrop Anda. Total {totalAirdrops} airdrop dilacak.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow overflow-y-auto min-h-0">
            <div className="p-6">
              {totalAirdrops === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <PieChartIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data airdrop untuk ditampilkan.</p>
                  <p>Mulai tambahkan airdrop untuk melihat statistik.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-input/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-foreground">Distribusi Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statusDistribution.length > 0 ? (
                        <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-[300px]">
                          <PieChart>
                            <ChartTooltip
                              cursor={false}
                              content={<ChartTooltipContent hideLabel nameKey="name" />}
                            />
                            <Pie
                              data={statusDistribution}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={60}
                              strokeWidth={5}
                            >
                               {statusDistribution.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                              ))}
                            </Pie>
                             <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                          </PieChart>
                        </ChartContainer>
                      ) : (
                         <p className="text-sm text-muted-foreground text-center py-10">Tidak ada data status.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-input/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-foreground">Aktivitas 7 Hari Terakhir</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
                        <AreaChart
                          data={activityOverTime}
                          margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                          <XAxis
                            dataKey="dateLabel"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 6)}
                            className="text-xs"
                          />
                          <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            tickMargin={8} 
                            allowDecimals={false}
                            className="text-xs"
                           />
                          <ChartTooltip
                            cursor={true}
                            content={
                              <ChartTooltipContent
                                indicator="line"
                                labelFormatter={(value, payload) => {
                                    if (payload && payload.length > 0 && payload[0].payload.dateLabel) {
                                        return payload[0].payload.dateLabel;
                                    }
                                    return value;
                                }}
                              />
                            }
                          />
                          <Area
                            dataKey="airdropsAdded"
                            type="natural"
                            fill="hsl(var(--primary)/0.3)"
                            stroke="hsl(var(--primary))"
                            stackId="a"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                <X className="mr-2 h-4 w-4" /> Tutup
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AirdropStatsModal;

    