// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/dashboard/dashboard-header';
// UserProfileCard is removed as it depends on user auth
import AddAirdropButton from '@/components/dashboard/add-airdrop-button';
import SummaryStats from '@/components/dashboard/summary-stats';
import CalendarReminder from '@/components/dashboard/calendar-reminder';
import AirdropList from '@/components/dashboard/airdrop-list';
import AddAirdropModal from '@/components/dashboard/add-airdrop-modal';
import FilterSearchAirdrops from '@/components/dashboard/filter-search-airdrops';
import Loader from '@/components/ui/loader';
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop } from '@/types/airdrop';
import { useToast } from "@/hooks/use-toast";
import { Card } from '@/components/ui/card'; // Keep Card for UI
import { PackageX } from 'lucide-react';

function DashboardPageContent() {
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
  } = useAirdropsStore(); // No longer passing userId

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState<Airdrop | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Basic loading state

  useEffect(() => {
    // Simulate initial data loading if necessary, or remove if store handles it
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Adjust timing as needed
    return () => clearTimeout(timer);
  }, []);


  const handleOpenModal = (airdropToEdit?: Airdrop) => {
    if (airdropToEdit) {
      setEditingAirdrop(airdropToEdit);
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
      resetNewAirdropDraft();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAirdrop(null);
  };

  const handleSaveAirdrop = async (data: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    try {
      if (editingAirdrop) {
        const updatedData: Airdrop = {
            ...editingAirdrop,
            ...data,
        };
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

  if (isLoading) {
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
          {/* UserProfileCard removed from here */}
          <div className="lg:col-span-1 space-y-6 xl:space-y-8">
            <SummaryStats airdrops={allAirdrops} />
            {/* You might want to add another component here or adjust layout */}
          </div>
          <div className="lg:col-span-2 space-y-6 xl:space-y-8">
             <Card className="p-6 shadow-xl">
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
        initialData={editingAirdrop ? newAirdropDraft : undefined}
      />
       <footer className="py-6 px-4 md:px-8 border-t text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AirdropAce. Powered by Web3 enthusiasm.
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}
