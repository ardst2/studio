// src/components/dashboard/airdrop-item.tsx
"use client";

import type { Airdrop, AirdropTask } from '@/types/airdrop';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CalendarDays, Edit3, Trash2, ExternalLink, ClipboardList, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AirdropItemProps {
  airdrop: Airdrop;
  onEdit: (airdrop: Airdrop) => void;
  onDelete: (airdropId: string) => void;
  onTaskToggle: (airdropId: string, taskId: string) => void;
}

const AirdropItem = ({ airdrop, onEdit, onDelete, onTaskToggle }: AirdropItemProps) => {
  const completedTasks = airdrop.tasks.filter(task => task.completed).length;
  const totalTasks = airdrop.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : (airdrop.status === 'Completed' ? 100 : 0);

  const getStatusBadgeVariant = (status: Airdrop['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Active': return 'default'; // Primary color (Indigo)
      case 'Upcoming': return 'secondary';
      case 'Completed': return 'outline'; // Using outline to appear less prominent or green if themed
      default: return 'secondary';
    }
  };
  
  const getStatusColorClass = (status: Airdrop['status']): string => {
    switch (status) {
      case 'Active': return 'bg-primary/20 text-primary';
      case 'Upcoming': return 'bg-blue-500/20 text-blue-400';
      case 'Completed': return 'bg-green-500/20 text-green-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const timeToDeadline = airdrop.deadline ? formatDistanceToNowStrict(new Date(airdrop.deadline), { addSuffix: true, locale: localeID }) : 'N/A';
  const isDeadlinePassed = airdrop.deadline ? new Date(airdrop.deadline) < new Date() : false;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg mb-1">{airdrop.name}</CardTitle>
          <Badge variant={getStatusBadgeVariant(airdrop.status)} className={cn("capitalize", getStatusColorClass(airdrop.status))}>
            {airdrop.status}
          </Badge>
        </div>
        {airdrop.description && <CardDescription className="text-xs line-clamp-2">{airdrop.description}</CardDescription>}
         <div className="flex items-center text-xs text-muted-foreground mt-1">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            {airdrop.startDate ? format(new Date(airdrop.startDate), 'dd MMM yyyy', { locale: localeID }) : 'TBD'}
            <span className="mx-1">-</span>
            {airdrop.deadline ? format(new Date(airdrop.deadline), 'dd MMM yyyy', { locale: localeID }) : 'TBD'}
        </div>
      </CardHeader>
      <CardContent className="py-3 space-y-3 flex-grow">
        {totalTasks > 0 && (
          <div>
            <div className="mb-1 flex justify-between items-center">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center"><ClipboardList className="w-3 h-3 mr-1"/>Tugas ({completedTasks}/{totalTasks})</h4>
                {airdrop.status !== 'Completed' && airdrop.deadline && (
                    <div className={`text-xs flex items-center ${isDeadlinePassed && airdrop.status !== 'Completed' ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {isDeadlinePassed && airdrop.status !== 'Completed' && <AlertTriangle className="w-3 h-3 mr-1"/>}
                        Deadline: {timeToDeadline}
                    </div>
                )}
            </div>
            <Progress value={progress} className="h-1.5 mb-2" />
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {airdrop.tasks.map(task => (
                <div key={task.id} className="flex items-center space-x-2 text-xs">
                  <Checkbox
                    id={`${airdrop.id}-task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => onTaskToggle(airdrop.id, task.id)}
                    disabled={airdrop.status === 'Completed'}
                  />
                  <label
                    htmlFor={`${airdrop.id}-task-${task.id}`}
                    className={`flex-grow ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                  >
                    {task.text}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        {totalTasks === 0 && (
             <p className="text-xs text-muted-foreground italic">Tidak ada tugas spesifik untuk airdrop ini.</p>
        )}
      </CardContent>
      <CardFooter className="py-3 border-t flex justify-end gap-2">
        {/* Potential: Add a link button if a URL is in description */}
        {/* <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4 mr-1" /> Visit</Button> */}
        <Button variant="outline" size="icon" onClick={() => onEdit(airdrop)} aria-label="Edit Airdrop">
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button variant="destructiveOutline" size="icon" onClick={() => onDelete(airdrop.id)} aria-label="Hapus Airdrop">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AirdropItem;
