// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/use-auth'; // Ensure AuthProvider is here or in a layout
import DashboardHeader from '@/components/dashboard/dashboard-header';
import UserProfileCard from '@/components/dashboard/user-profile-card';
import AddAirdropButton from '@/components/dashboard/add-airdrop-button';
import SummaryStats from '@/components/dashboard/summary-stats';
import CalendarReminder from '@/components/dashboard/calendar-reminder';
import AirdropList from '@/components/dashboard/airdrop-list';
import AddAirdropModal from '@/components/dashboard/add-airdrop-modal';
import FilterSearchAirdrops from '@/components/dashboard/filter-search-airdrops';
import Loader from '@/components/ui/loader';
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop, AirdropTask } from '@/types/airdrop';
import { useToast } from "@/hooks/use-toast";
import { PackageX } from 'lucide-react';

function DashboardPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const {
    airdrops: filteredAirdrops,
    allAirdrops,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    addAirdrop: storeAddAirdrop,
    updateAirdrop: storeUpdateAirdrop,
    deleteAirdrop: storeDeleteAirdrop,
    newAirdropDraft,
    updateNewAirdropDraft,
    resetNewAirdropDraft,
  } = useAirdropsStore(user?.uid || null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState<Airdrop | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleOpenModal = (airdropToEdit?: Airdrop) => {
    if (airdropToEdit) {
      setEditingAirdrop(airdropToEdit);
      // Populate draft with editingAirdrop data
      const draftData = {
        name: airdropToEdit.name,
        startDate: airdropToEdit.startDate,
        deadline: airdropToEdit.deadline,
        description: airdropToEdit.description,
        tasks: airdropToEdit.tasks,
      };
      updateNewAirdropDraft(draftData);
    } else {
      setEditingAirdrop(null);
      resetNewAirdropDraft(); // Use default draft for new airdrop
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAirdrop(null);
    // Data is kept in newAirdropDraft via useAirdropsStore, so no need to clear explicitly unless intended
  };

  const handleSaveAirdrop = async (data: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    try {
      if (editingAirdrop) {
        // This is a simplified update. A real app would merge, preserve ID, etc.
        // For now, we'll treat it as adding a new one and deleting the old for simplicity of the store.
        // Or, better, implement a proper update in useAirdropsStore.
        // For now, let's assume updateAirdrop in store handles it.
        const updatedData: Airdrop = {
            ...editingAirdrop, // Preserves id, userId, createdAt
            ...data, // Overwrites with new form data
            // Status needs to be re-evaluated or passed through
        };
         // Re-evaluate status
        const now = Date.now();
        let status: Airdrop['status'] = 'Upcoming';
        if (updatedData.startDate && updatedData.startDate <= now) status = 'Active';
        const allTasksCompleted = updatedData.tasks.length > 0 && updatedData.tasks.every(t => t.completed);
        if (allTasksCompleted || (updatedData.deadline && updatedData.deadline < now)) status = 'Completed';
        updatedData.status = status;

        storeUpdateAirdrop(updatedData);
        toast({ title: "Airdrop Diperbarui", description: `"${data.name}" berhasil diperbarui.` });
      } else {
        storeAddAirdrop(data);
        toast({ title: "Airdrop Ditambahkan", description: `"${data.name}" berhasil ditambahkan.` });
      }
      handleCloseModal();
      resetNewAirdropDraft();
    } catch (error) {
      console.error("Error saving airdrop:", error);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Terjadi kesalahan saat menyimpan airdrop." });
    }
  };

  const handleDeleteAirdrop = (airdropId: string) => {
    const airdropToDelete = allAirdrops.find(a => a.id === airdropId);
    storeDeleteAirdrop(airdropId);
    toast({ title: "Airdrop Dihapus", description: `"${airdropToDelete?.name}" telah dihapus.` });
  };
  
  const handleTaskToggle = (airdropId: string, taskId: string) => {
    const airdropToUpdate = allAirdrops.find(a => a.id === airdropId);
    if (airdropToUpdate) {
      const updatedTasks = airdropToUpdate.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      const updatedAirdrop = { ...airdropToUpdate, tasks: updatedTasks };
      // Re-evaluate status based on tasks completion and deadline
      const allTasksCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
      if (allTasksCompleted || (updatedAirdrop.deadline && updatedAirdrop.deadline < Date.now())) {
        updatedAirdrop.status = 'Completed';
      } else if (updatedAirdrop.startDate && updatedAirdrop.startDate <= Date.now()) {
        updatedAirdrop.status = 'Active';
      } else {
        updatedAirdrop.status = 'Upcoming';
      }
      storeUpdateAirdrop(updatedAirdrop);
    }
  };


  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader variant="page" size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
          <div className="lg:col-span-1 space-y-6 xl:space-y-8">
            <UserProfileCard />
            <SummaryStats airdrops={allAirdrops} />
          </div>
          <div className="lg:col-span-2 space-y-6 xl:space-y-8">
             <Card className="p-6 shadow-xl"> {/* Wrapper for button, or place button differently */}
                <h2 className="text-2xl font-headline mb-2">Kelola Peluangmu</h2>
                <p className="text-muted-foreground mb-4">Jangan lewatkan kesempatan emas. Tambahkan airdrop baru untuk dilacak!</p>
                <AddAirdropButton onClick={() => handleOpenModal()} />
            </Card>
            <CalendarReminder airdrops={allAirdrops} />
          </div>
        </div>

        <div>
          <FilterSearchAirdrops 
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
          />
          <AirdropList
            airdrops={filteredAirdrops}
            onEditAirdrop={handleOpenModal}
            onDeleteAirdrop={handleDeleteAirdrop}
            onTaskToggle={handleTaskToggle}
          />
        </div>
      </main>
      <AddAirdropModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAirdrop}
        initialData={editingAirdrop ? newAirdropDraft : undefined} // Pass draft if editing
      />
       <footer className="py-6 px-4 md:px-8 border-t text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AirdropAce. Powered by Web3 enthusiasm.
      </footer>
    </div>
  );
}


export default function DashboardPage() {
  // AuthProvider should wrap the component that uses useAuth
  // If RootLayout already has AuthProvider, this might be redundant
  // For this structure, let's assume AuthProvider is needed here or a layout specific to dashboard.
  return (
    <AuthProvider>
      <DashboardPageContent />
    </AuthProvider>
  );
}
