
// src/hooks/use-airdrops-store.ts
"use client";

import type { Airdrop, AirdropTask, AirdropStatus, AirdropFilterStatus } from '@/types/airdrop';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { 
  collection, query, where, getDocs, addDoc, doc, setDoc, deleteDoc, Timestamp, orderBy, serverTimestamp, writeBatch 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; 

const GUEST_USER_ID = 'guest-user-id';

const getDefaultNewAirdrop = (userId: string): Omit<Airdrop, 'id' | 'createdAt' | 'status'> => ({
  userId: userId,
  name: '',
  startDate: undefined,
  deadline: undefined,
  description: '',
  tasks: [],
  blockchain: '',
  registrationDate: undefined,
  participationRequirements: '',
  airdropLink: '',
  userDefinedStatus: '',
  notes: '',
  walletAddress: '',
  tokenAmount: undefined,
  claimDate: undefined,
  airdropType: '',
  referralCode: '',
  informationSource: '',
});

export const useAirdropsStore = () => {
  const { user } = useAuth();
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<AirdropFilterStatus>('All');
  
  const [newAirdropDraft, setNewAirdropDraft] = useState<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>(getDefaultNewAirdrop(user?.uid || GUEST_USER_ID));

  useEffect(() => {
    setNewAirdropDraft(getDefaultNewAirdrop(user?.uid || GUEST_USER_ID));
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      setIsLoading(true);
      const fetchAirdrops = async () => {
        try {
          const airdropsCol = collection(db, 'users', user.uid, 'airdrops');
          const q = query(airdropsCol, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const fetchedAirdrops = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().getTime() : data.startDate,
              deadline: data.deadline instanceof Timestamp ? data.deadline.toDate().getTime() : data.deadline,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().getTime() : Date.now(),
              registrationDate: data.registrationDate instanceof Timestamp ? data.registrationDate.toDate().getTime() : data.registrationDate,
              claimDate: data.claimDate instanceof Timestamp ? data.claimDate.toDate().getTime() : data.claimDate,
              tasks: data.tasks || [],
              tokenAmount: data.tokenAmount === null || data.tokenAmount === undefined ? undefined : Number(data.tokenAmount),
            } as Airdrop;
          });
          setAirdrops(fetchedAirdrops);
        } catch (error) {
          console.error("Error fetching airdrops: ", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAirdrops();
    } else {
      setAirdrops([]);
      setIsLoading(false);
    }
  }, [user]);

  const addAirdrop = useCallback(async (airdropData: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    if (!user?.uid) throw new Error("User not authenticated");

    const now = Date.now();
    let status: AirdropStatus = 'Upcoming';
    if (airdropData.startDate && airdropData.startDate <= now) status = 'Active';
    const allTasksCompleted = (airdropData.tasks || []).length > 0 && (airdropData.tasks || []).every(t => t.completed);
    if (allTasksCompleted || (airdropData.deadline && airdropData.deadline < now)) {
        status = 'Completed';
    } else if (airdropData.startDate && airdropData.startDate <= now) {
        status = 'Active';
    }

    const airdropForDb = {
      ...airdropData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      status,
      startDate: airdropData.startDate ? Timestamp.fromDate(new Date(airdropData.startDate)) : null,
      deadline: airdropData.deadline ? Timestamp.fromDate(new Date(airdropData.deadline)) : null,
      registrationDate: airdropData.registrationDate ? Timestamp.fromDate(new Date(airdropData.registrationDate)) : null,
      claimDate: airdropData.claimDate ? Timestamp.fromDate(new Date(airdropData.claimDate)) : null,
      tasks: (airdropData.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
      tokenAmount: airdropData.tokenAmount === undefined || isNaN(Number(airdropData.tokenAmount)) ? null : Number(airdropData.tokenAmount),
    };

    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'airdrops'), airdropForDb);
      const newAirdrop: Airdrop = {
        ...airdropData,
        tokenAmount: airdropData.tokenAmount === undefined || isNaN(Number(airdropData.tokenAmount)) ? undefined : Number(airdropData.tokenAmount),
        tasks: airdropForDb.tasks, // Ensure tasks have IDs
        id: docRef.id,
        userId: user.uid,
        createdAt: Date.now(), 
        status,
      };
      setAirdrops(prev => [newAirdrop, ...prev].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      resetNewAirdropDraft(); // Reset draft after successful save
    } catch (error) {
      console.error("Error adding airdrop to Firestore: ", error);
      throw error;
    }
  }, [user]);

  const addManyAirdrops = useCallback(async (airdropsData: Omit<Airdrop, 'id' | 'userId' | 'createdAt'>[]) => {
    if (!user?.uid) throw new Error("User not authenticated");
    if (!airdropsData || airdropsData.length === 0) return;

    const batch = writeBatch(db);
    const newAirdropsForState: Airdrop[] = [];

    airdropsData.forEach(airdropData => {
      const now = Date.now();
      let status: AirdropStatus = (airdropData as Airdrop).status || 'Upcoming'; // Use provided status or default
       if (!(airdropData as Airdrop).status) { // Recalculate if not provided or based on dates
            if (airdropData.startDate && airdropData.startDate <= now) status = 'Active';
            const allTasksCompleted = (airdropData.tasks || []).length > 0 && (airdropData.tasks || []).every(t => t.completed);
            if (allTasksCompleted || (airdropData.deadline && airdropData.deadline < now)) {
                status = 'Completed';
            } else if (airdropData.startDate && airdropData.startDate <= now) {
                status = 'Active';
            }
        }

      const docRef = doc(collection(db, 'users', user.uid!, 'airdrops')); // Auto-generate ID
      const airdropForDb = {
        ...airdropData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        status,
        startDate: airdropData.startDate ? Timestamp.fromDate(new Date(airdropData.startDate)) : null,
        deadline: airdropData.deadline ? Timestamp.fromDate(new Date(airdropData.deadline)) : null,
        registrationDate: airdropData.registrationDate ? Timestamp.fromDate(new Date(airdropData.registrationDate)) : null,
        claimDate: airdropData.claimDate ? Timestamp.fromDate(new Date(airdropData.claimDate)) : null,
        tasks: (airdropData.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
        tokenAmount: airdropData.tokenAmount === undefined || isNaN(Number(airdropData.tokenAmount)) ? null : Number(airdropData.tokenAmount),
      };
      batch.set(docRef, airdropForDb);
      newAirdropsForState.push({
        ...airdropData,
        tokenAmount: airdropData.tokenAmount === undefined || isNaN(Number(airdropData.tokenAmount)) ? undefined : Number(airdropData.tokenAmount),
        tasks: airdropForDb.tasks,
        id: docRef.id,
        userId: user.uid,
        createdAt: Date.now(), // Optimistic client time
        status,
      });
    });

    try {
      await batch.commit();
      setAirdrops(prev => [...newAirdropsForState, ...prev].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (error) {
      console.error("Error batch adding airdrops to Firestore: ", error);
      throw error;
    }
  }, [user]);


  const updateAirdrop = useCallback(async (updatedAirdropData: Airdrop) => {
    if (!user?.uid || !updatedAirdropData.id) throw new Error("User not authenticated or Airdrop ID missing");
    
    const airdropRef = doc(db, 'users', user.uid, 'airdrops', updatedAirdropData.id);
    
    const { id, ...dataToUpdate } = updatedAirdropData;
    const dataForDb = {
      ...dataToUpdate,
      startDate: dataToUpdate.startDate ? Timestamp.fromDate(new Date(dataToUpdate.startDate)) : null,
      deadline: dataToUpdate.deadline ? Timestamp.fromDate(new Date(dataToUpdate.deadline)) : null,
      registrationDate: dataToUpdate.registrationDate ? Timestamp.fromDate(new Date(dataToUpdate.registrationDate)) : null,
      claimDate: dataToUpdate.claimDate ? Timestamp.fromDate(new Date(dataToUpdate.claimDate)) : null,
      tasks: (dataToUpdate.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
      tokenAmount: dataToUpdate.tokenAmount === undefined || isNaN(Number(dataToUpdate.tokenAmount)) ? null : Number(dataToUpdate.tokenAmount),
    };

    try {
      await setDoc(airdropRef, dataForDb, { merge: true }); 
      setAirdrops(prev => prev.map(a => a.id === updatedAirdropData.id ? updatedAirdropData : a)
                               .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (error) {
      console.error("Error updating airdrop in Firestore: ", error);
      throw error;
    }
  }, [user]);

  const deleteAirdrop = useCallback(async (airdropId: string) => {
    if (!user?.uid) throw new Error("User not authenticated");
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'airdrops', airdropId));
      setAirdrops(prev => prev.filter(a => a.id !== airdropId));
    } catch (error) {
      console.error("Error deleting airdrop from Firestore: ", error);
      throw error;
    }
  }, [user]);

  const updateNewAirdropDraft = useCallback((data: Partial<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>) => {
    setNewAirdropDraft(prev => ({ ...prev, ...data, userId: user?.uid || GUEST_USER_ID }));
  }, [user]);

  const resetNewAirdropDraft = useCallback(() => {
    setNewAirdropDraft(getDefaultNewAirdrop(user?.uid || GUEST_USER_ID));
  }, [user]);

  const filteredAirdrops = useMemo(() => {
    return airdrops
      .filter(airdrop => {
        if (filterStatus === 'All') return true;
        return airdrop.status === filterStatus;
      })
      .filter(airdrop => 
        (airdrop.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (airdrop.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (airdrop.blockchain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (airdrop.airdropType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (airdrop.userDefinedStatus || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [airdrops, filterStatus, searchTerm]);

  return {
    airdrops: filteredAirdrops,
    allAirdrops: airdrops, 
    isLoading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    addAirdrop,
    addManyAirdrops,
    updateAirdrop,
    deleteAirdrop,
    newAirdropDraft,
    updateNewAirdropDraft,
    resetNewAirdropDraft,
  };
};
