// src/hooks/use-airdrops-store.ts
"use client";

import type { Airdrop, AirdropTask, AirdropStatus, AirdropFilterStatus } from '@/types/airdrop';
import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

// Mock data
const initialAirdrops: Airdrop[] = [
  {
    id: uuidv4(),
    userId: 'mock-user-id',
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
    userId: 'mock-user-id',
    name: 'ZkSync Era Potential Airdrop',
    startDate: new Date('2024-05-01T00:00:00Z').getTime(), // Assuming this was when interaction started
    // No deadline specified for potential airdrops, or a very far one
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
    userId: 'mock-user-id',
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
    userId: 'mock-user-id',
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

const getDefaultNewAirdrop = (userId: string): Omit<Airdrop, 'id' | 'createdAt' | 'status'> => ({
  userId,
  name: '',
  startDate: undefined,
  deadline: undefined,
  description: '',
  tasks: [],
});


export const useAirdropsStore = (userId: string | null) => {
  const [airdrops, setAirdrops] = useState<Airdrop[]>(initialAirdrops.filter(a => userId ? a.userId === userId : true)); // Load initial based on user
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AirdropFilterStatus>('All');
  
  const [newAirdropDraft, setNewAirdropDraft] = useState<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>(() => getDefaultNewAirdrop(userId || ''));

  useEffect(() => {
    // In a real app, fetch airdrops from Firebase here based on userId
    // For now, we just filter the initial mock data if userId changes (e.g., on login)
    if (userId) {
      setAirdrops(initialAirdrops.filter(a => a.userId === userId));
      setNewAirdropDraft(getDefaultNewAirdrop(userId));
    } else {
      setAirdrops([]);
      setNewAirdropDraft(getDefaultNewAirdrop(''));
    }
  }, [userId]);


  const addAirdrop = useCallback((airdropData: Omit<Airdrop, 'id' | 'userId' | 'createdAt'>) => {
    if (!userId) return; // Should not happen if UI is correct

    const now = Date.now();
    let status: AirdropStatus = 'Upcoming';
    if (airdropData.startDate && airdropData.startDate <= now) {
      status = 'Active';
    }
    if (airdropData.deadline && airdropData.deadline < now) {
      status = 'Completed'; // This might need adjustment, e.g. if tasks are not all done
    }
    // A more robust status check:
    // If all tasks completed OR deadline passed -> Completed
    // Else if start date passed -> Active
    // Else -> Upcoming
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
      userId,
      createdAt: Date.now(),
      status,
    };
    setAirdrops(prev => [newAirdrop, ...prev]);
    setNewAirdropDraft(getDefaultNewAirdrop(userId)); // Reset draft
  }, [userId]);

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
    if(userId) setNewAirdropDraft(getDefaultNewAirdrop(userId));
  }, [userId]);

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
    allAirdrops: airdrops, // For summary stats
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
