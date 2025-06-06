
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

// Helper to prepare data for Firestore, converting undefined to null for optional fields
const prepareAirdropForFirestore = (airdropData: Partial<Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>> | Partial<Airdrop>, currentUserId?: string) => {
  const data: any = {
    name: airdropData.name || `Unnamed Airdrop ${Date.now()}`, // Ensure name is always present
    tasks: (airdropData.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
    
    // Explicitly handle all optional fields, converting undefined to null
    description: airdropData.description === undefined ? null : airdropData.description,
    startDate: airdropData.startDate ? Timestamp.fromDate(new Date(airdropData.startDate)) : null,
    deadline: airdropData.deadline ? Timestamp.fromDate(new Date(airdropData.deadline)) : null,
    blockchain: airdropData.blockchain === undefined ? null : airdropData.blockchain,
    registrationDate: airdropData.registrationDate ? Timestamp.fromDate(new Date(airdropData.registrationDate)) : null,
    participationRequirements: airdropData.participationRequirements === undefined ? null : airdropData.participationRequirements,
    airdropLink: airdropData.airdropLink === undefined ? null : airdropData.airdropLink,
    userDefinedStatus: airdropData.userDefinedStatus === undefined ? null : airdropData.userDefinedStatus,
    notes: airdropData.notes === undefined ? null : airdropData.notes,
    walletAddress: airdropData.walletAddress === undefined ? null : airdropData.walletAddress,
    tokenAmount: (airdropData.tokenAmount === undefined || isNaN(Number(airdropData.tokenAmount))) ? null : Number(airdropData.tokenAmount),
    claimDate: airdropData.claimDate ? Timestamp.fromDate(new Date(airdropData.claimDate)) : null,
    airdropType: airdropData.airdropType === undefined ? null : airdropData.airdropType,
    referralCode: airdropData.referralCode === undefined ? null : airdropData.referralCode,
    informationSource: airdropData.informationSource === undefined ? null : airdropData.informationSource,
  };

  // Add fields specific to new documents
  if (currentUserId) {
    data.userId = currentUserId;
    data.createdAt = serverTimestamp();
    // Status will be added after this preparation, before saving
  }
  
  // For updates, status might be part of airdropData if it's a full Airdrop object
  if ('status' in airdropData && airdropData.status !== undefined) {
    data.status = airdropData.status;
  }
  if ('userId' in airdropData && airdropData.userId !== undefined && !currentUserId) { // For updates, keep existing userId
    data.userId = airdropData.userId;
  }
   if ('createdAt' in airdropData && airdropData.createdAt !== undefined && !currentUserId) { // For updates, keep existing createdAt if passed (though usually not modified)
     if (airdropData.createdAt instanceof Timestamp) {
        data.createdAt = airdropData.createdAt;
     } else if (typeof airdropData.createdAt === 'number') {
        data.createdAt = Timestamp.fromMillis(airdropData.createdAt);
     }
    // If it's not a Timestamp or number, it might be problematic, but setDoc with merge handles existing fields.
    // For updates, createdAt is usually not part of the data sent to setDoc unless it's meant to be overwritten.
  }


  return data;
};


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
      ...prepareAirdropForFirestore(airdropData, user.uid),
      status, // Add the calculated status
    };

    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'airdrops'), airdropForDb);
      const newAirdrop: Airdrop = {
        ...airdropData, // original data from input
        // Ensure numeric fields are correctly typed from possibly null Firestore values if we were fetching it back
        tokenAmount: (airdropForDb.tokenAmount === null || airdropForDb.tokenAmount === undefined) ? undefined : Number(airdropForDb.tokenAmount),
        tasks: airdropForDb.tasks, 
        id: docRef.id,
        userId: user.uid,
        createdAt: Date.now(), // Optimistic client time for immediate UI update
        status,
      };
      setAirdrops(prev => [newAirdrop, ...prev].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      resetNewAirdropDraft(); 
    } catch (error) {
      console.error("Error adding airdrop to Firestore: ", error);
      throw error;
    }
  }, [user, resetNewAirdropDraft]);

  const addManyAirdrops = useCallback(async (airdropsData: Omit<Airdrop, 'id' | 'userId' | 'createdAt'>[]) => {
    if (!user?.uid) throw new Error("User not authenticated");
    if (!airdropsData || airdropsData.length === 0) return;

    const batch = writeBatch(db);
    const newAirdropsForState: Airdrop[] = [];

    airdropsData.forEach(airdropInputData => {
      const now = Date.now();
      let status: AirdropStatus = (airdropInputData as Airdrop).status || 'Upcoming';
       if (!(airdropInputData as Airdrop).status) {
            if (airdropInputData.startDate && airdropInputData.startDate <= now) status = 'Active';
            const allTasksCompleted = (airdropInputData.tasks || []).length > 0 && (airdropInputData.tasks || []).every(t => t.completed);
            if (allTasksCompleted || (airdropInputData.deadline && airdropInputData.deadline < now)) {
                status = 'Completed';
            } else if (airdropInputData.startDate && airdropInputData.startDate <= now) {
                status = 'Active';
            }
        }

      const docRef = doc(collection(db, 'users', user.uid!, 'airdrops'));
      const airdropForDb = {
        ...prepareAirdropForFirestore(airdropInputData, user.uid),
        status,
      };
      batch.set(docRef, airdropForDb);
      
      newAirdropsForState.push({
        ...(airdropInputData as Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>), // Cast for state
        tokenAmount: (airdropForDb.tokenAmount === null || airdropForDb.tokenAmount === undefined) ? undefined : Number(airdropForDb.tokenAmount),
        tasks: airdropForDb.tasks,
        id: docRef.id,
        userId: user.uid,
        createdAt: Date.now(), 
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
    
    // We pass the full updatedAirdropData to prepareAirdropForFirestore,
    // it will handle userId and createdAt correctly for updates (by keeping existing ones if not meant to change)
    // The status is part of updatedAirdropData and will be preserved or updated by prepareAirdropForFirestore.
    const dataForDb = prepareAirdropForFirestore(updatedAirdropData);
    // remove userId and createdAt if they were added by prepareAirdropForFirestore, as setDoc with merge shouldn't usually set them
    // However, prepareAirdropForFirestore is designed to handle this by checking if currentUserId is passed.
    // For updates, we don't pass currentUserId, so it should use existing userId/createdAt from updatedAirdropData.
    // Let's ensure `userId` and `createdAt` from the original `updatedAirdropData` are used if present,
    // and not overwritten by serverTimestamp() etc.
    // The `prepareAirdropForFirestore` already correctly keeps `userId` and `createdAt` from `updatedAirdropData`
    // if `currentUserId` (the second arg) is not passed.
    // It also handles `status` if it's part of `updatedAirdropData`.

    // Fields like userId and createdAt are typically not part of the object passed to setDoc for an update,
    // unless you intend to change them, which is rare for these fields.
    // The prepareAirdropForFirestore function includes userId and createdAt from the input 'updatedAirdropData'.
    // This is fine for setDoc with merge:true as it will just update existing fields or add new ones.

    try {
      // Only pass fields that are not id, userId, createdAt for the actual update payload unless they are meant to be changed.
      // However, our prepareAirdropForFirestore creates the full object.
      // For setDoc with merge: true, this is acceptable.
      const { id, userId, createdAt, ...payloadForUpdate } = dataForDb; // Exclude these from main payload if not changing

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
