// src/components/dashboard/calendar-reminder.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar'; // Shadcn Calendar
import { BellRing, CheckCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Airdrop } from '@/types/airdrop';

interface CalendarReminderProps {
  airdrops: Airdrop[];
}

const CalendarReminder = ({ airdrops }: CalendarReminderProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return airdrops
      .filter(a => a.status !== 'Completed' && a.deadline)
      .filter(a => {
        const deadlineDate = new Date(a.deadline!);
        return deadlineDate >= today && deadlineDate <= nextWeek;
      })
      .sort((a, b) => a.deadline! - b.deadline!);
  }, [airdrops]);

  return (
    <Card className="shadow-xl h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Kalender & Pengingat</CardTitle>
        <CardDescription>Deadline penting minggu ini.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border not-prose"
          disabled={(d) => d < new Date(new Date().setDate(new Date().getDate()-1))} // Disable past dates
        />
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
            <BellRing className="mr-2 h-4 w-4 text-accent" />
            Deadline Mendatang:
          </h3>
          {upcomingDeadlines.length > 0 ? (
            <ul className="max-h-32 overflow-y-auto space-y-1 text-xs">
              {upcomingDeadlines.map(airdrop => (
                <li key={airdrop.id} className="flex justify-between items-center p-1.5 rounded-md hover:bg-muted">
                  <span>{airdrop.name}</span>
                  <span className="font-medium text-accent">
                    {new Date(airdrop.deadline!).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Tidak ada deadline mendesak minggu ini.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarReminder;
