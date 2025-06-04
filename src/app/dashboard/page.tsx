
// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import AddAirdropButton from '@/components/dashboard/add-airdrop-button';
import SummaryStats from '@/components/dashboard/summary-stats';
import AirdropList from '@/components/dashboard/airdrop-list';
import AddAirdropModal from '@/components/dashboard/add-airdrop-modal';
import AirdropDetailModal from '@/components/dashboard/AirdropDetailModal'; // Import new modal
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState<Airdrop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAirdropForDetail, setSelectedAirdropForDetail] = useState<Airdrop | null>(null);


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);


  const handleOpenAddModal = (airdropToEdit?: Airdrop) => {
    if (airdropToEdit) {
      setEditingAirdrop(airdropToEdit);
      const draftData = {
        name: airdropToEdit.name,
        startDate: airdropToEdit.startDate,
        deadline: airdropToEdit.deadline,
        description: airdropToEdit.description,
        tasks: airdropToEdit.tasks.map(task => ({ ...task })), 
      };
      updateNewAirdropDraft(draftData);
    } else {
      setEditingAirdrop(null);
      resetNewAirdropDraft();
    }
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingAirdrop(null);
  };

  const handleSaveAirdrop = async (data: Omit<Airdrop, 'id' | 'userId' | 'createdAt' | 'status'>) => {
    try {
      if (editingAirdrop) {
        const updatedData: Airdrop = {
            ...editingAirdrop,
            ...data,
             tasks: data.tasks ? data.tasks.map(t => ({ ...t, id: t.id || crypto.randomUUID() })) : [],
        };
        const now = Date.now();
        let status: Airdrop['status'] = 'Upcoming';
        if (updatedData.startDate && updatedData.startDate <= now) status = 'Active';
        const allTasksCompleted = updatedData.tasks.length > 0 && updatedData.tasks.every(t => t.completed);
        if (allTasksCompleted || (updatedData.deadline && updatedData.deadline < now)) {
             status = 'Completed';
        } else if (updatedData.startDate && updatedData.startDate <= now) { // Ensure active if not completed yet but started
            status = 'Active';
        } else {
            status = 'Upcoming'; // Default to upcoming if no other conditions met
        }
        updatedData.status = status;

        storeUpdateAirdrop(updatedData);
        toast({ title: "Airdrop Diperbarui", description: `"${data.name}" berhasil diperbarui.` });
      } else {
        const newAirdropDataWithTaskIds = {
            ...data,
            tasks: data.tasks ? data.tasks.map(t => ({ ...t, id: t.id || crypto.randomUUID() })) : [],
        };
        storeAddAirdrop(newAirdropDataWithTaskIds);
        toast({ title: "Airdrop Ditambahkan", description: `"${data.name}" berhasil ditambahkan.` });
      }
      handleCloseAddModal();
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
      
      const now = Date.now();
      let newStatus: Airdrop['status'] = 'Upcoming';
      if (updatedAirdrop.startDate && updatedAirdrop.startDate <= now) newStatus = 'Active';
      const allTasksCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
      if (allTasksCompleted || (updatedAirdrop.deadline && updatedAirdrop.deadline < now)) {
          newStatus = 'Completed';
      }
      // This 'else if' ensures it stays 'Active' if tasks are not all complete and deadline hasn't passed.
      else if (updatedAirdrop.startDate && updatedAirdrop.startDate <= now) {
        newStatus = 'Active';
      }
      
      updatedAirdrop.status = newStatus;
      storeUpdateAirdrop(updatedAirdrop);
    }
  };

  // Handlers for Detail Modal
  const handleOpenDetailModal = (airdrop: Airdrop) => {
    setSelectedAirdropForDetail(airdrop);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedAirdropForDetail(null);
    setIsDetailModalOpen(false);
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
          <UserInfoCard airdrops={allAirdrops} />
          <Card className="shadow-xl h-full bg-card text-card-foreground p-6 flex flex-col justify-center">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-headline text-xl text-foreground">Kelola Airdrop Anda</CardTitle>
              <CardDescription className="text-muted-foreground">
                Pantau peluang baru dan tugas yang sedang berjalan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AddAirdropButton onClick={() => handleOpenAddModal()} />
            </CardContent>
          </Card>
          <SummaryStats airdrops={allAirdrops} />
          <EmptyAirdropDayCard onAddNewAirdrop={() => handleOpenAddModal()} />
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
            onEditAirdrop={handleOpenAddModal}
            onDeleteAirdrop={handleDeleteAirdrop}
            onTaskToggle={handleTaskToggle}
            onShowDetail={handleOpenDetailModal} // Pass handler
          />
        </div>
      </main>
      <AddAirdropModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveAirdrop}
        initialData={editingAirdrop ? newAirdropDraft : undefined}
      />
      <AirdropDetailModal 
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        airdrop={selectedAirdropForDetail}
      />
       <footer className="py-6 px-4 md:px-8 border-t border-border/50 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AirdropAce. Ditenagai oleh antusiasme Web3.
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardPageContent />;
}

