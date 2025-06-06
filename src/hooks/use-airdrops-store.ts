
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
  currentUserId?: string // This is only for NEW documents to set userId and createdAt
) => {
  const data: any = { // This will be the Firestore document
    name: airdropData.name || `Unnamed Airdrop ${Date.now()}`, // Ensure name is always present
    tasks: (airdropData.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
    
    // Explicitly handle all optional fields, converting undefined to null for Firestore
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
    data.createdAt = serverTimestamp(); // Firestore server timestamp
  }
  
  // For updates, status might be part of airdropData if it's a full Airdrop object
  if ('status' in airdropData && airdropData.status !== undefined) {
    data.status = airdropData.status;
  }
   // For updates, userId and createdAt might already exist
  if ('userId' in airdropData && airdropData.userId !== undefined && !currentUserId) {
    data.userId = airdropData.userId;
  }
   if ('createdAt' in airdropData && airdropData.createdAt !== undefined && !currentUserId) { 
     if (airdropData.createdAt instanceof Timestamp) {
        data.createdAt = airdropData.createdAt;
     } else if (typeof airdropData.createdAt === 'number') {
        // This case should ideally not happen if createdAt is always serverTimestamp for new,
        // and passed as number for updates (and then converted to Timestamp if needed)
        // For simplicity here, we assume updates pass it as number if it's from client state.
        data.createdAt = Timestamp.fromMillis(airdropData.createdAt);
     }
  }
  return data;
};

// Helper to map Firestore doc data to client-side Airdrop type
const mapFirestoreDocToAirdrop = (docData: any, docId: string): Airdrop => {
    return {
        id: docId,
        userId: docData.userId,
        name: docData.name,
        status: docData.status,
        createdAt: docData.createdAt instanceof Timestamp 
            ? docData.createdAt.toMillis() 
            : (typeof docData.createdAt === 'number' ? docData.createdAt : Date.now()),
        
        startDate: docData.startDate instanceof Timestamp 
            ? docData.startDate.toMillis() 
            : (typeof docData.startDate === 'number' ? docData.startDate : undefined),
        deadline: docData.deadline instanceof Timestamp 
            ? docData.deadline.toMillis() 
            : (typeof docData.deadline === 'number' ? docData.deadline : undefined),
        registrationDate: docData.registrationDate instanceof Timestamp 
            ? docData.registrationDate.toMillis() 
            : (typeof docData.registrationDate === 'number' ? docData.registrationDate : undefined),
        claimDate: docData.claimDate instanceof Timestamp 
            ? docData.claimDate.toMillis() 
            : (typeof docData.claimDate === 'number' ? docData.claimDate : undefined),
        
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
          const q = query(airdropsCol, orderBy('createdAt', 'desc')); // Firestore sorts by its timestamp
          const querySnapshot = await getDocs(q);
          const fetchedAirdrops = querySnapshot.docs.map(docSnap => 
            mapFirestoreDocToAirdrop(docSnap.data(), docSnap.id)
          );
          // Client-side sort might still be needed if Firestore's serverTimestamp resolution varies slightly
          // or if createdAt can be non-Timestamp in old data.
          // fetchedAirdrops.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
      ...prepareAirdropForFirestore(airdropData, user.uid), //Pass user.uid for new doc
      status, 
    };
    // airdropForDb.createdAt will be a serverTimestamp() sentinel

    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'airdrops'), airdropForDb);
      
      // Construct the object for local state using the original input (airdropData)
      // and the new info (id, userId, calculated status, and a consistent client-side createdAt)
      const clientCreatedAt = Date.now(); 
      const newAirdropForState: Airdrop = {
        id: docRef.id,
        userId: user.uid,
        createdAt: clientCreatedAt, // Use client-generated timestamp for immediate optimistic update and sorting
        status: status,
        name: airdropData.name, // From input
        
        // Optional fields from airdropData - ensure they are number | undefined, string | undefined etc.
        // as per Airdrop type. airdropData (input from modal) should already be in this format.
        startDate: airdropData.startDate,
        deadline: airdropData.deadline,
        description: airdropData.description,
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
        tasks: (airdropData.tasks || []).map(task => ({ ...task, id: task.id || uuidv4() })),
      };

      setAirdrops(prevAirdrops => {
        const updatedAirdrops = [newAirdropForState, ...prevAirdrops];
        updatedAirdrops.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sort by client createdAt
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
    const clientCreatedAt = Date.now(); // Use a single timestamp for all client-side new items in this batch

    airdropsInputData.forEach((singleAirdropInput, index) => {
      const now = Date.now(); // For status calculation per item
      let status: AirdropStatus = (singleAirdropInput as Airdrop).status || 'Upcoming';
       if (!(singleAirdropInput as Airdrop).status) { // if status not provided, calculate it
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
        ...prepareAirdropForFirestore(singleAirdropInput, user.uid), // Pass user.uid for new doc
        status,
      };
      batch.set(docRef, airdropForDb);
      
      newAirdropsForStateArray.push({
        id: docRef.id,
        userId: user.uid,
        createdAt: clientCreatedAt - index, // Slightly offset to maintain order if needed, or use consistent clientCreatedAt
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
      setAirdrops(prevAirdrops => {
        const updatedAirdrops = [...newAirdropsForStateArray, ...prevAirdrops];
        updatedAirdrops.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
    // For updates, do not pass currentUserId to prepareAirdropForFirestore, 
    // as we don't want to overwrite userId or createdAt with serverTimestamp
    const dataForDb = prepareAirdropForFirestore(updatedAirdropData); 
    
    try {
      await setDoc(airdropRef, dataForDb, { merge: true }); 

      // Ensure the updatedAirdropData for client state is consistent
      const clientSideUpdatedAirdrop = mapFirestoreDocToAirdrop(
          { // Simulate what would come back from Firestore if we re-fetched
              ...dataForDb, // Has Firestore Timestamps for dates if they were updated
              // If dataForDb used serverTimestamp for createdAt, it won't be a JS number here
              // So, we should use the existing client-side createdAt for the update
              createdAt: updatedAirdropData.createdAt, // Keep original client-side createdAt
              userId: updatedAirdropData.userId, // Keep original userId
          }, 
          updatedAirdropData.id
      );

      setAirdrops(prevAirdrops => {
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
      setAirdrops(prev => prev.filter(a => a.id !== airdropId)); // No re-sort needed for delete
    } catch (error) {
      console.error("Error deleting airdrop from Firestore: ", error);
      throw error;
    }
  }, [user]);

  const filteredAirdrops = useMemo(() => {
    return airdrops // Already sorted
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
    allAirdrops: airdrops, // This is the raw, sorted list
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
