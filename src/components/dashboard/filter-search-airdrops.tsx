// src/components/dashboard/filter-search-airdrops.tsx
"use client";

import type { AirdropFilterStatus } from '@/types/airdrop';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-card rounded-xl shadow-md">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari nama atau deskripsi airdrop..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10 h-11 text-base"
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-muted-foreground hidden sm:block" />
        <Select value={filterStatus} onValueChange={(value) => onFilterStatusChange(value as AirdropFilterStatus)}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 text-base">
            <SelectValue placeholder="Filter berdasarkan status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status} className="capitalize text-base">
                {status === 'All' ? 'Semua Airdrop' : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterSearchAirdrops;
