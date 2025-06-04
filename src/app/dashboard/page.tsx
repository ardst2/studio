
// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import AddAirdropButton from '@/components/dashboard/add-airdrop-button';
import SummaryStats from '@/components/dashboard/summary-stats';
import AirdropList from '@/components/dashboard/airdrop-list';
import AddAirdropModal from '@/components/dashboard/add-airdrop-modal';
import FilterSearchAirdrops from '@/components/dashboard/filter-search-airdrops';
import Loader from '@/components/ui/loader';
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop } from '@/types/airdrop';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UserInfoCard from '@/components/dashboard/user-info-card';
import EmptyAirdropDayCard from '@/components/dashboard/empty-airdrop-day-card';

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
  } = useAirdropsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState<Airdrop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
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
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader variant="page" size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
          <UserInfoCard />
          <Card className="shadow-xl h-full bg-card text-card-foreground p-6 flex flex-col justify-center">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-headline text-xl text-foreground">Kelola Airdrop Anda</CardTitle>
              <CardDescription className="text-muted-foreground">
                Pantau peluang baru dan tugas yang sedang berjalan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AddAirdropButton onClick={() => handleOpenModal()} />
            </CardContent>
          </Card>
          <SummaryStats airdrops={allAirdrops} />
          <EmptyAirdropDayCard onAddNewAirdrop={() => handleOpenModal()} />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-headline text-foreground mb-6">Airdrop Anda</h2>
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
       <footer className="py-6 px-4 md:px-8 border-t border-border/50 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AirdropAce. Ditenagai oleh antusiasme Web3.
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  // Removed AuthProvider as login is no longer part of the flow
  return <DashboardPageContent />;
}
