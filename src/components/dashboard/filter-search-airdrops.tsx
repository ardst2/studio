
// src/components/dashboard/filter-search-airdrops.tsx
"use client";

import type { AirdropFilterStatus } from '@/types/airdrop';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSearchAirdropsProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  filterStatus: AirdropFilterStatus;
  onFilterStatusChange: (status: AirdropFilterStatus) => void;
}

const FilterSearchAirdrops = ({
  searchTerm,
  onSearchTermChange,
  filterStatus,
  onFilterStatusChange,
}: FilterSearchAirdropsProps) => {
  const statuses: AirdropFilterStatus[] = ['All', 'Upcoming', 'Active', 'Completed'];

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-card rounded-xl shadow-md border border-border/50">
      <div className="input-gradient-glow-wrapper flex-grow">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
            type="search"
            placeholder="Cari nama atau deskripsi airdrop..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            // className pl-10 for icon, h-11 for height, text-base for font.
            // Background, border, focus styles are handled by .input-gradient-glow-wrapper input in globals.css
            className="pl-10 h-11 text-base w-full" 
          />
        </div>
      </div>
      <div className="input-gradient-glow-wrapper">
        <div className="flex items-center gap-2 h-11"> 
          <Filter className="h-5 w-5 text-muted-foreground hidden sm:block ml-2" />
          <Select value={filterStatus} onValueChange={(value) => onFilterStatusChange(value as AirdropFilterStatus)}>
            <SelectTrigger 
              // w-full sm:w-[180px] for width, h-full for height, text-base for font.
              // Background, border, focus styles are handled by .input-gradient-glow-wrapper div[role="combobox"] in globals.css
              className="w-full sm:w-[180px] h-full text-base"
            >
              <SelectValue placeholder="Filter berdasarkan status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {statuses.map(status => (
                <SelectItem key={status} value={status} className="capitalize text-base focus:bg-muted">
                  {status === 'All' ? 'Semua Airdrop' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FilterSearchAirdrops;
