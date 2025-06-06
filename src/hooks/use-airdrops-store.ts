
// src/hooks/use-airdrops-store.ts
"use client";

import type { Airdrop, AirdropTask, AirdropStatus, AirdropFilterStatus } from '@/types/airdrop';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { 
  collection, query, where, getDocs, addDoc, doc, setDoc, deleteDoc, Timestamp, orderBy, serverTimestamp, writeBatch, getDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; 

const GUEST_USER_ID = 'guest-user-id';

const getDefaultNewAirdrop = (userId: string): Omit<Airdrop, 'id' | 'createdAt' | 'status'> => ({
  userId: userId,
  name: '',
  startDate: undefined,
  deadline: undefined,
  description: undefined,
  tasks: [],
  blockchain: undefined,
  registrationDate: undefined,
  participationRequirements: undefined,
  airdropLink: undefined,
  userDefinedStatus: undefined,
  notes: undefined,
  walletAddress: undefined,
  tokenAmount: undefined,
  claimDate: undefined,
  airdropType: undefined,
  referralCode: undefined,
  informationSource: undefined,
});

// Helper to prepare data for Firestore, converting undefined to null for optional fields
const prepareAirdropForFirestore = (
  airdropData: Partial<Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>> | Partial<Airdrop>,
  currentUserId?: string 
) => {
  const data: any = { 
    name: airdropData.name || `Unnamed Airdrop ${Date.now()}`,
    tasks: (airdropData.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
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

  if (currentUserId) {
    data.userId = currentUserId;
    data.createdAt = serverTimestamp(); 
  }
  
  if ('status' in airdropData && airdropData.status !== undefined) {
    data.status = airdropData.status;
  }
  if ('userId' in airdropData && airdropData.userId !== undefined && !currentUserId) {
    data.userId = airdropData.userId;
  }
   if ('createdAt' in airdropData && airdropData.createdAt !== undefined && !currentUserId) { 
     if (airdropData.createdAt instanceof Timestamp) {
        data.createdAt = airdropData.createdAt;
     } else if (typeof airdropData.createdAt === 'number') {
        data.createdAt = Timestamp.fromMillis(airdropData.createdAt);
     }
  }
  return data;
};

const mapFirestoreDocToAirdrop = (docData: any, docId: string): Airdrop => {
    return {
        id: docId,
        userId: docData.userId,
        name: docData.name,
        status: docData.status,
        createdAt: docData.createdAt instanceof Timestamp 
            ? docData.createdAt.toMillis() 
            : (typeof docData.createdAt === 'number' ? docData.createdAt 
            : (console.warn(`Invalid createdAt type in Firestore doc: ${docData.id}, type: ${typeof docData.createdAt}, value: ${docData.createdAt}`), 0)),
        
        startDate: docData.startDate instanceof Timestamp ? docData.startDate.toMillis() : (typeof docData.startDate === 'number' ? docData.startDate : undefined),
        deadline: docData.deadline instanceof Timestamp ? docData.deadline.toMillis() : (typeof docData.deadline === 'number' ? docData.deadline : undefined),
        registrationDate: docData.registrationDate instanceof Timestamp ? docData.registrationDate.toMillis() : (typeof docData.registrationDate === 'number' ? docData.registrationDate : undefined),
        claimDate: docData.claimDate instanceof Timestamp ? docData.claimDate.toMillis() : (typeof docData.claimDate === 'number' ? docData.claimDate : undefined),
        
        description: docData.description === null ? undefined : docData.description,
        blockchain: docData.blockchain === null ? undefined : docData.blockchain,
        participationRequirements: docData.participationRequirements === null ? undefined : docData.participationRequirements,
        airdropLink: docData.airdropLink === null ? undefined : docData.airdropLink,
        userDefinedStatus: docData.userDefinedStatus === null ? undefined : docData.userDefinedStatus,
        notes: docData.notes === null ? undefined : docData.notes,
        walletAddress: docData.walletAddress === null ? undefined : docData.walletAddress,
        airdropType: docData.airdropType === null ? undefined : docData.airdropType,
        referralCode: docData.referralCode === null ? undefined : docData.referralCode,
        informationSource: docData.informationSource === null ? undefined : docData.informationSource,
        
        tokenAmount: (docData.tokenAmount === null || docData.tokenAmount === undefined || isNaN(Number(docData.tokenAmount))) 
                       ? undefined 
                       : Number(docData.tokenAmount),
        tasks: (docData.tasks || []).map((task: any) => ({ ...task, id: task.id || uuidv4() })),
    };
};


export const useAirdropsStore = () => {
  const { user } = useAuth();
  const [_airdrops, set_Airdrops] = useState<Airdrop[]>([]);
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
          const fetchedAirdrops = querySnapshot.docs.map(docSnap => 
            mapFirestoreDocToAirdrop(docSnap.data(), docSnap.id)
          );
          set_Airdrops(fetchedAirdrops);
        } catch (error) {
          console.error("Error fetching airdrops: ", error);
          set_Airdrops([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAirdrops();
    } else {
      set_Airdrops([]);
      setIsLoading(false);
    }
  }, [user]);

  const updateNewAirdropDraft = useCallback((data: Partial<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>) => {
    setNewAirdropDraft(prev => ({ ...prev, ...data, userId: user?.uid || GUEST_USER_ID }));
  }, [user]);

  const resetNewAirdropDraft = useCallback(() => {
    setNewAirdropDraft(getDefaultNewAirdrop(user?.uid || GUEST_USER_ID));
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
      status, 
    };

    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'airdrops'), airdropForDb);
      
      // Optimistic update: construct the new airdrop for client state
      const clientCreatedAt = Date.now();
      const newAirdropForState: Airdrop = {
        id: docRef.id, // Use the ID from Firestore
        userId: user.uid,
        createdAt: clientCreatedAt, // Use client-generated timestamp for immediate optimistic update and sorting
        status: status,
        name: airdropData.name || `Unnamed Airdrop ${clientCreatedAt}`,
        
        startDate: airdropData.startDate,
        deadline: airdropData.deadline,
        description: airdropData.description,
        tasks: (airdropData.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
        blockchain: airdropData.blockchain,
        registrationDate: airdropData.registrationDate,
        participationRequirements: airdropData.participationRequirements,
        airdropLink: airdropData.airdropLink,
        userDefinedStatus: airdropData.userDefinedStatus,
        notes: airdropData.notes,
        walletAddress: airdropData.walletAddress,
        tokenAmount: (airdropData.tokenAmount === undefined || airdropData.tokenAmount === null || isNaN(Number(airdropData.tokenAmount))) 
                       ? undefined 
                       : Number(airdropData.tokenAmount),
        claimDate: airdropData.claimDate,
        airdropType: airdropData.airdropType,
        referralCode: airdropData.referralCode,
        informationSource: airdropData.informationSource,
      };

      set_Airdrops(prevAirdrops => {
        const updatedAirdrops = [newAirdropForState, ...prevAirdrops];
        updatedAirdrops.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        console.log("addAirdrop: _airdrops state after update:", updatedAirdrops); // DEBUG
        return updatedAirdrops; 
      });
      resetNewAirdropDraft(); 
    } catch (error) {
      console.error("Error adding airdrop to Firestore: ", error);
      throw error;
    }
  }, [user, resetNewAirdropDraft]);


  const addManyAirdrops = useCallback(async (airdropsInputData: Omit<Airdrop, 'id' | 'userId' | 'createdAt'>[]) => {
    if (!user?.uid) throw new Error("User not authenticated");
    if (!airdropsInputData || airdropsInputData.length === 0) return;

    const batch = writeBatch(db);
    const newAirdropsForStateArray: Airdrop[] = [];
    const batchClientCreatedAt = Date.now(); 

    airdropsInputData.forEach((singleAirdropInput, index) => {
      const now = Date.now(); 
      let status: AirdropStatus = (singleAirdropInput as Airdrop).status || 'Upcoming';
       if (!(singleAirdropInput as Airdrop).status) { 
            if (singleAirdropInput.startDate && singleAirdropInput.startDate <= now) status = 'Active';
            const allTasksCompleted = (singleAirdropInput.tasks || []).length > 0 && (singleAirdropInput.tasks || []).every(t => t.completed);
            if (allTasksCompleted || (singleAirdropInput.deadline && singleAirdropInput.deadline < now)) {
                status = 'Completed';
            } else if (singleAirdropInput.startDate && singleAirdropInput.startDate <= now) {
                status = 'Active';
            }
        }

      const docRef = doc(collection(db, 'users', user.uid!, 'airdrops'));
      const airdropForDb = {
        ...prepareAirdropForFirestore(singleAirdropInput, user.uid), 
        status,
      };
      batch.set(docRef, airdropForDb);
      
      newAirdropsForStateArray.push({
        id: docRef.id,
        userId: user.uid,
        createdAt: batchClientCreatedAt - index, 
        status: status,
        name: singleAirdropInput.name,
        startDate: singleAirdropInput.startDate,
        deadline: singleAirdropInput.deadline,
        description: singleAirdropInput.description,
        tasks: (singleAirdropInput.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
        blockchain: singleAirdropInput.blockchain,
        registrationDate: singleAirdropInput.registrationDate,
        participationRequirements: singleAirdropInput.participationRequirements,
        airdropLink: singleAirdropInput.airdropLink,
        userDefinedStatus: singleAirdropInput.userDefinedStatus,
        notes: singleAirdropInput.notes,
        walletAddress: singleAirdropInput.walletAddress,
        tokenAmount: (singleAirdropInput.tokenAmount === undefined || singleAirdropInput.tokenAmount === null || isNaN(Number(singleAirdropInput.tokenAmount))) 
                       ? undefined 
                       : Number(singleAirdropInput.tokenAmount),
        claimDate: singleAirdropInput.claimDate,
        airdropType: singleAirdropInput.airdropType,
        referralCode: singleAirdropInput.referralCode,
        informationSource: singleAirdropInput.informationSource,
      });
    });

    try {
      await batch.commit();
      set_Airdrops(prevAirdrops => {
        const updatedAirdrops = [...newAirdropsForStateArray, ...prevAirdrops];
        updatedAirdrops.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        console.log("addManyAirdrops: _airdrops state after update:", updatedAirdrops); // DEBUG
        return updatedAirdrops;
      });
    } catch (error) {
      console.error("Error batch adding airdrops to Firestore: ", error);
      throw error;
    }
  }, [user]);


  const updateAirdrop = useCallback(async (updatedAirdropData: Airdrop) => {
    if (!user?.uid || !updatedAirdropData.id) throw new Error("User not authenticated or Airdrop ID missing");
    
    const airdropRef = doc(db, 'users', user.uid, 'airdrops', updatedAirdropData.id);
    const dataForDb = prepareAirdropForFirestore(updatedAirdropData); 
    
    try {
      await setDoc(airdropRef, dataForDb, { merge: true }); 

      const clientSideUpdatedAirdrop = mapFirestoreDocToAirdrop(
          { 
              ...dataForDb, 
              createdAt: updatedAirdropData.createdAt, 
              userId: updatedAirdropData.userId, 
          }, 
          updatedAirdropData.id
      );

      set_Airdrops(prevAirdrops => {
        const updatedList = prevAirdrops.map(a => a.id === clientSideUpdatedAirdrop.id ? clientSideUpdatedAirdrop : a);
        updatedList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return updatedList;
      });
    } catch (error) {
      console.error("Error updating airdrop in Firestore: ", error);
      throw error;
    }
  }, [user]);

  const deleteAirdrop = useCallback(async (airdropId: string) => {
    if (!user?.uid) throw new Error("User not authenticated");
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'airdrops', airdropId));
      set_Airdrops(prev => prev.filter(a => a.id !== airdropId)); 
    } catch (error) {
      console.error("Error deleting airdrop from Firestore: ", error);
      throw error;
    }
  }, [user]);

  const filteredAirdrops = useMemo(() => {
    console.log("Recomputing filteredAirdrops. _airdrops count:", _airdrops.length, "Filter:", filterStatus, "Search:", searchTerm); // DEBUG
    return _airdrops 
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
  }, [_airdrops, filterStatus, searchTerm]);

  return {
    airdrops: filteredAirdrops,
    allAirdrops: _airdrops, 
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


    