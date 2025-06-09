
// src/hooks/use-airdrops-store.ts
"use client";

import type { Airdrop, AirdropTask, AirdropStatus, AirdropFilterStatus } from '@/types/airdrop';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, addDoc, doc, setDoc, deleteDoc, Timestamp, orderBy, serverTimestamp, writeBatch, getDoc, onSnapshot, Unsubscribe
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

// Helper to prepare data for Firestore
const prepareAirdropForFirestore = (
  airdropData: Partial<Omit<Airdrop, 'id' | 'userId' | 'status'>> | Partial<Airdrop>,
  currentUserId?: string,
  isNew?: boolean
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
  }

  if (isNew) {
    data.createdAt = serverTimestamp();
  } else if ('createdAt' in airdropData && typeof airdropData.createdAt === 'number') {
    data.createdAt = Timestamp.fromMillis(airdropData.createdAt);
  }


  if ('status' in airdropData && airdropData.status !== undefined) {
    data.status = airdropData.status;
  }
  if ('userId' in airdropData && airdropData.userId !== undefined && !currentUserId) {
    data.userId = airdropData.userId;
  }

  return data;
};


const mapFirestoreDocToAirdrop = (docData: any, docId: string): Airdrop => {
    const createdAtMillis = docData.createdAt instanceof Timestamp
        ? docData.createdAt.toMillis()
        : (typeof docData.createdAt === 'number'
            ? docData.createdAt
            : (console.warn(`[MAP_FS_DOC] Invalid createdAt type in Firestore doc: ${docId}. Type: ${typeof docData.createdAt}, Value: ${JSON.stringify(docData.createdAt)}. Defaulting to 0.`), 0));

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

  const updateNewAirdropDraft = useCallback((data: Partial<Omit<Airdrop, 'id' | 'createdAt' | 'status'>>) => {
    setNewAirdropDraft(prev => ({ ...prev, ...data, userId: user?.uid || GUEST_USER_ID }));
  }, [user]);

  const resetNewAirdropDraft = useCallback(() => {
    setNewAirdropDraft(getDefaultNewAirdrop(user?.uid || GUEST_USER_ID));
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      set_Airdrops([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log(`[STORE_LISTENER] Setting up Firestore listener for user: ${user.uid}`);
    const airdropsCol = collection(db, 'users', user.uid, 'airdrops');
    const q = query(airdropsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedAirdrops = querySnapshot.docs.map(docSnap =>
        mapFirestoreDocToAirdrop(docSnap.data(), docSnap.id)
      );
      console.log(`[STORE_LISTENER] Received ${fetchedAirdrops.length} airdrops from listener.`);
      set_Airdrops(fetchedAirdrops);
      setIsLoading(false);
    }, (error) => {
      console.error(`[STORE_LISTENER] Error with Firestore listener for user ${user.uid}: `, error);
      toast({ variant: "destructive", title: "Gagal Memuat Data Realtime", description: "Tidak dapat menerima pembaruan airdrop." });
      set_Airdrops([]);
      setIsLoading(false);
    });

    return () => {
      console.log(`[STORE_LISTENER] Unsubscribing Firestore listener for user: ${user.uid}`);
      unsubscribe();
    };
  }, [user]);


  const addAirdrop = useCallback(async (airdropData: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    if (!user?.uid) {
        console.error("[STORE_ADD] User not authenticated, cannot save.");
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

    const airdropForDb = prepareAirdropForFirestore(airdropData, user.uid, true);
    airdropForDb.status = status;

    try {
      console.log("[STORE_ADD] Attempting to add airdrop to Firestore:", airdropForDb.name);
      await addDoc(collection(db, 'users', user.uid, 'airdrops'), airdropForDb);
      console.log("[STORE_ADD] Airdrop successfully added to Firestore. Listener will update UI.");
      resetNewAirdropDraft();
      // No need to manually update state, onSnapshot listener will handle it.
    } catch (error) {
      console.error("[STORE_ADD] Error adding airdrop to Firestore: ", error);
      throw error;
    }
  }, [user, resetNewAirdropDraft]);


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
        ...prepareAirdropForFirestore(singleAirdropInput, user.uid, true),
        status,
      };
      batch.set(docRef, airdropForDb);
    });

    try {
      console.log(`[STORE_ADD_MANY] Attempting to batch add ${airdropsInputData.length} airdrops to Firestore.`);
      await batch.commit();
      console.log(`[STORE_ADD_MANY] Successfully batch added ${airdropsInputData.length} airdrops. Listener will update UI.`);
      // No need to manually update state, onSnapshot listener will handle it.
    } catch (error) {
      console.error("[STORE_ADD_MANY] Error batch adding airdrops to Firestore: ", error);
      throw error;
    }
  }, [user]);


  const updateAirdrop = useCallback(async (updatedAirdropData: Airdrop) => {
    if (!user?.uid || !updatedAirdropData.id) {
        toast({ variant: "destructive", title: "Operasi Gagal", description: "Informasi pengguna atau ID airdrop tidak ditemukan." });
        throw new Error("User not authenticated or Airdrop ID missing");
    }

    const airdropRef = doc(db, 'users', user.uid, 'airdrops', updatedAirdropData.id);
    const dataForDb = prepareAirdropForFirestore(updatedAirdropData, user.uid, false);

    try {
      console.log("[STORE_UPDATE] Attempting to update airdrop in Firestore:", updatedAirdropData.id);
      await setDoc(airdropRef, dataForDb, { merge: true });
      console.log("[STORE_UPDATE] Airdrop successfully updated in Firestore. Listener will update UI.");
      // No need to manually update state, onSnapshot listener will handle it.
    } catch (error) {
      console.error("[STORE_UPDATE] Error updating airdrop in Firestore: ", error);
      throw error;
    }
  }, [user]);

  const deleteAirdrop = useCallback(async (airdropId: string) => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Autentikasi Gagal", description: "Anda harus masuk untuk menghapus airdrop." });
      throw new Error("User not authenticated");
    }
    try {
      console.log("[STORE_DELETE] Attempting to delete airdrop from Firestore:", airdropId);
      await deleteDoc(doc(db, 'users', user.uid, 'airdrops', airdropId));
      console.log("[STORE_DELETE] Airdrop successfully deleted from Firestore. Listener will update UI.");
      // No need for optimistic update, onSnapshot will handle it.
    } catch (error) {
      console.error("[STORE_DELETE] Error deleting airdrop from Firestore: ", error);
      throw error;
    }
  }, [user]);

  const filteredAirdrops = useMemo(() => {
    console.log(`[STORE_MEMO] Recalculating filteredAirdrops. _airdrops count: ${_airdrops.length}, Filter: ${filterStatus}, Search: "${searchTerm}"`);
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

