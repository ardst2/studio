
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
import { toast } from "@/hooks/use-toast";

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
    const createdAtMillis = docData.createdAt instanceof Timestamp 
        ? docData.createdAt.toMillis() 
        : (typeof docData.createdAt === 'number' 
            ? docData.createdAt 
            : (console.warn(`Invalid createdAt type in Firestore doc: ${docId}, type: ${typeof docData.createdAt}, value: ${docData.createdAt}. Defaulting to 0.`), 0));

    return {
        id: docId,
        userId: docData.userId,
        name: docData.name,
        status: docData.status,
        createdAt: createdAtMillis,
        
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

  const fetchUserAirdrops = useCallback(async (currentUserId: string) => {
    console.log("fetchUserAirdrops called for user:", currentUserId);
    setIsLoading(true);
    try {
        const airdropsCol = collection(db, 'users', currentUserId, 'airdrops');
        const q = query(airdropsCol, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedAirdrops = querySnapshot.docs.map(docSnap =>
            mapFirestoreDocToAirdrop(docSnap.data(), docSnap.id)
        );
        set_Airdrops(fetchedAirdrops);
        console.log(`Fetched ${fetchedAirdrops.length} airdrops for user ${currentUserId}.`);
    } catch (error) {
        console.error(`Error fetching airdrops for user ${currentUserId}: `, error);
        toast({ variant: "destructive", title: "Gagal Memuat Data", description: "Tidak dapat mengambil daftar airdrop dari database."});
        set_Airdrops([]);
    } finally {
        setIsLoading(false);
    }
  }, []); // No dependencies needed as setIsLoading and set_Airdrops are stable from useState

  useEffect(() => {
    if (user?.uid) {
      fetchUserAirdrops(user.uid);
    } else {
      set_Airdrops([]);
      setIsLoading(false);
    }
  }, [user, fetchUserAirdrops]);

  const updateNewAirdropDraft = useCallback((data: Partial<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>) => {
    setNewAirdropDraft(prev => ({ ...prev, ...data, userId: user?.uid || GUEST_USER_ID }));
  }, [user]);

  const resetNewAirdropDraft = useCallback(() => {
    setNewAirdropDraft(getDefaultNewAirdrop(user?.uid || GUEST_USER_ID));
  }, [user]);

  const addAirdrop = useCallback(async (airdropData: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    if (!user?.uid) {
        console.error("addAirdrop: User not authenticated, cannot save.");
        toast({ variant: "destructive", title: "Autentikasi Gagal", description: "Anda harus masuk untuk menyimpan airdrop." });
        throw new Error("User not authenticated");
    }

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
      console.log("Attempting to add airdrop to Firestore:", airdropForDb.name);
      await addDoc(collection(db, 'users', user.uid, 'airdrops'), airdropForDb);
      console.log("Airdrop successfully added to Firestore:", airdropForDb.name);
      
      // Re-fetch all airdrops to ensure UI consistency
      await fetchUserAirdrops(user.uid);
      resetNewAirdropDraft(); 
    } catch (error) {
      console.error("Error adding airdrop to Firestore: ", error);
      // The toast will be handled by the calling component (e.g., AiAssistModal)
      throw error; 
    }
  }, [user, fetchUserAirdrops, resetNewAirdropDraft]);


  const addManyAirdrops = useCallback(async (airdropsInputData: Omit<Airdrop, 'id' | 'userId' | 'createdAt'>[]) => {
    if (!user?.uid) {
        toast({ variant: "destructive", title: "Autentikasi Gagal", description: "Anda harus masuk untuk menyimpan airdrop." });
        throw new Error("User not authenticated");
    }
    if (!airdropsInputData || airdropsInputData.length === 0) return;

    const batch = writeBatch(db);
    
    airdropsInputData.forEach((singleAirdropInput) => {
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
    });

    try {
      console.log(`Attempting to batch add ${airdropsInputData.length} airdrops to Firestore.`);
      await batch.commit();
      console.log(`Successfully batch added ${airdropsInputData.length} airdrops.`);
      
      // Re-fetch all airdrops to ensure UI consistency
      await fetchUserAirdrops(user.uid);
    } catch (error) {
      console.error("Error batch adding airdrops to Firestore: ", error);
      throw error;
    }
  }, [user, fetchUserAirdrops]);


  const updateAirdrop = useCallback(async (updatedAirdropData: Airdrop) => {
    if (!user?.uid || !updatedAirdropData.id) {
        toast({ variant: "destructive", title: "Operasi Gagal", description: "Informasi pengguna atau ID airdrop tidak ditemukan." });
        throw new Error("User not authenticated or Airdrop ID missing");
    }
    
    const airdropRef = doc(db, 'users', user.uid, 'airdrops', updatedAirdropData.id);
    // Ensure `createdAt` is not overwritten with serverTimestamp if it already exists
    const existingAirdrop = _airdrops.find(a => a.id === updatedAirdropData.id);
    const dataForDb = prepareAirdropForFirestore(updatedAirdropData); 
    if (existingAirdrop?.createdAt && dataForDb.createdAt && dataForDb.createdAt instanceof Timestamp && dataForDb.createdAt.isEqual(serverTimestamp() as Timestamp) ) {
       dataForDb.createdAt = Timestamp.fromMillis(existingAirdrop.createdAt);
    }
    
    try {
      console.log("Attempting to update airdrop in Firestore:", updatedAirdropData.id);
      await setDoc(airdropRef, dataForDb, { merge: true }); 
      console.log("Airdrop successfully updated in Firestore:", updatedAirdropData.id);

      // Re-fetch all airdrops to ensure UI consistency
      // Alternatively, could update local state optimistically if preferred for performance on updates
      await fetchUserAirdrops(user.uid);
    } catch (error) {
      console.error("Error updating airdrop in Firestore: ", error);
      throw error;
    }
  }, [user, _airdrops, fetchUserAirdrops]);

  const deleteAirdrop = useCallback(async (airdropId: string) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Autentikasi Gagal", description: "Anda harus masuk untuk menghapus airdrop." });
      throw new Error("User not authenticated");
    }
    try {
      console.log("Attempting to delete airdrop from Firestore:", airdropId);
      await deleteDoc(doc(db, 'users', user.uid, 'airdrops', airdropId));
      console.log("Airdrop successfully deleted from Firestore:", airdropId);
      // Optimistic update for delete is usually fine and responsive
      set_Airdrops(prev => prev.filter(a => a.id !== airdropId)); 
    } catch (error) {
      console.error("Error deleting airdrop from Firestore: ", error);
      throw error;
    }
  }, [user]);

  const filteredAirdrops = useMemo(() => {
    console.log(`useMemo for filteredAirdrops: _airdrops count: ${_airdrops.length}, Filter: ${filterStatus}, Search: "${searchTerm}"`);
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
