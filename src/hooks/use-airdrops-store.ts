
// src/hooks/use-airdrops-store.ts
"use client";

import type { Airdrop, AirdropTask, AirdropStatus, AirdropFilterStatus } from '@/types/airdrop';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Initial airdrops are now empty
const initialAirdrops: Airdrop[] = [];

const GUEST_USER_ID = 'guest-user-id';

const getDefaultNewAirdrop = (): Omit<Airdrop, 'id' | 'createdAt' | 'status'> => ({
  userId: GUEST_USER_ID,
  name: '',
  startDate: undefined,
  deadline: undefined,
  description: '',
  tasks: [],
});


export const useAirdropsStore = () => {
  const [airdrops, setAirdrops] = useState<Airdrop[]>(initialAirdrops);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AirdropFilterStatus>('All');
  
  const [newAirdropDraft, setNewAirdropDraft] = useState<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>(getDefaultNewAirdrop());

  useEffect(() => {
    setAirdrops(initialAirdrops); // Ensure it's initialized empty
    setNewAirdropDraft(getDefaultNewAirdrop());
  }, []);


  const addAirdrop = useCallback((airdropData: Omit<Airdrop, 'id' | 'userId' | 'createdAt'>) => {
    const now = Date.now();
    let status: AirdropStatus = 'Upcoming';
    if (airdropData.startDate && airdropData.startDate <= now) {
      status = 'Active';
    }
    const allTasksCompleted = airdropData.tasks.length > 0 && airdropData.tasks.every(t => t.completed);
    if (allTasksCompleted || (airdropData.deadline && airdropData.deadline < Date.now())) {
        status = 'Completed';
    } else if (airdropData.startDate && airdropData.startDate <= Date.now()) {
        status = 'Active';
    } else {
        status = 'Upcoming';
    }

    const newAirdrop: Airdrop = {
      ...airdropData,
      id: uuidv4(),
      userId: GUEST_USER_ID,
      createdAt: Date.now(),
      status,
    };
    setAirdrops(prev => [newAirdrop, ...prev]);
    setNewAirdropDraft(getDefaultNewAirdrop());
  }, []);

  const updateAirdrop = useCallback((updatedAirdrop: Airdrop) => {
    setAirdrops(prev => prev.map(a => a.id === updatedAirdrop.id ? updatedAirdrop : a));
  }, []);

  const deleteAirdrop = useCallback((airdropId: string) => {
    setAirdrops(prev => prev.filter(a => a.id !== airdropId));
  }, []);

  const updateNewAirdropDraft = useCallback((data: Partial<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>) => {
    setNewAirdropDraft(prev => ({ ...prev, ...data }));
  }, []);

  const resetNewAirdropDraft = useCallback(() => {
    setNewAirdropDraft(getDefaultNewAirdrop());
  }, []);

  const filteredAirdrops = useMemo(() => {
    return airdrops
      .filter(airdrop => {
        if (filterStatus === 'All') return true;
        return airdrop.status === filterStatus;
      })
      .filter(airdrop => 
        airdrop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        airdrop.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [airdrops, filterStatus, searchTerm]);

  return {
    airdrops: filteredAirdrops,
    allAirdrops: airdrops,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    addAirdrop,
    updateAirdrop,
    deleteAirdrop,
    newAirdropDraft,
    updateNewAirdropDraft,
    resetNewAirdropDraft,
  };
};
