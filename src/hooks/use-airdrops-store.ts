// src/hooks/use-airdrops-store.ts
"use client";

import type { Airdrop, AirdropTask, AirdropStatus, AirdropFilterStatus } from '@/types/airdrop';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Mock data - userId is kept for structure but not used for filtering if login is removed
const initialAirdrops: Airdrop[] = [
  {
    id: uuidv4(),
    userId: 'mock-user-id-1', // Kept for data structure, but store won't filter by it
    name: 'Cosmos Stargaze Public Airdrop',
    startDate: new Date('2024-07-15T00:00:00Z').getTime(),
    deadline: new Date('2024-08-15T00:00:00Z').getTime(),
    description: 'Airdrop for ATOM stakers and OSMO LPers. Snapshot taken on June 1st.',
    tasks: [
      { id: uuidv4(), text: 'Visit stargaze.zone/airdrop', completed: true },
      { id: uuidv4(), text: 'Connect Keplr wallet', completed: true },
      { id: uuidv4(), text: 'Claim $STARS tokens', completed: false },
    ],
    status: 'Active',
    createdAt: new Date('2024-07-01T00:00:00Z').getTime(),
  },
  {
    id: uuidv4(),
    userId: 'mock-user-id-2',
    name: 'ZkSync Era Potential Airdrop',
    startDate: new Date('2024-05-01T00:00:00Z').getTime(),
    deadline: new Date('2024-12-31T00:00:00Z').getTime(),
    description: 'Interact with protocols on ZkSync Era mainnet to qualify for a potential future airdrop.',
    tasks: [
      { id: uuidv4(), text: 'Bridge ETH to ZkSync Era', completed: true },
      { id: uuidv4(), text: 'Swap on SyncSwap', completed: true },
      { id: uuidv4(), text: 'Provide liquidity on Mute.io', completed: false },
      { id: uuidv4(), text: 'Mint an NFT on Kreatorland', completed: false },
    ],
    status: 'Active',
    createdAt: new Date('2024-05-01T00:00:00Z').getTime(),
  },
  {
    id: uuidv4(),
    userId: 'mock-user-id-1',
    name: 'Optimism Gov Token Drop #2',
    deadline: new Date('2023-09-01T00:00:00Z').getTime(),
    description: 'Second round of OP token distribution to active Optimism users and voters.',
    tasks: [
      { id: uuidv4(), text: 'Check eligibility', completed: true },
      { id: uuidv4(), text: 'Claim OP tokens', completed: true },
    ],
    status: 'Completed',
    createdAt: new Date('2023-08-15T00:00:00Z').getTime(),
  },
  {
    id: uuidv4(),
    userId: 'mock-user-id-3',
    name: 'Upcoming Solana Project X Airdrop',
    startDate: new Date('2024-09-01T00:00:00Z').getTime(),
    deadline: new Date('2024-09-30T00:00:00Z').getTime(),
    description: 'New DeFi protocol on Solana announcing an airdrop for early testnet users.',
    tasks: [
      { id: uuidv4(), text: 'Join Discord', completed: false },
      { id: uuidv4(), text: 'Participate in testnet', completed: false },
    ],
    status: 'Upcoming',
    createdAt: new Date('2024-08-01T00:00:00Z').getTime(),
  },
];

const GUEST_USER_ID = 'guest-user-id'; // Default user ID for a non-logged-in experience

const getDefaultNewAirdrop = (): Omit<Airdrop, 'id' | 'createdAt' | 'status'> => ({
  userId: GUEST_USER_ID,
  name: '',
  startDate: undefined,
  deadline: undefined,
  description: '',
  tasks: [],
});


export const useAirdropsStore = () => { // Removed userId parameter
  const [airdrops, setAirdrops] = useState<Airdrop[]>(initialAirdrops); // Load all initial airdrops
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AirdropFilterStatus>('All');
  
  const [newAirdropDraft, setNewAirdropDraft] = useState<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>(getDefaultNewAirdrop());

  useEffect(() => {
    // Initialize with all airdrops and a default draft.
    // No longer dependent on a dynamic userId.
    setAirdrops(initialAirdrops);
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
      userId: GUEST_USER_ID, // Assign guest user ID
      createdAt: Date.now(),
      status,
    };
    setAirdrops(prev => [newAirdrop, ...prev]);
    setNewAirdropDraft(getDefaultNewAirdrop()); // Reset draft
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
