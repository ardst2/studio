
// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import AddAirdropButton from '@/components/dashboard/add-airdrop-button';
import SummaryStats from '@/components/dashboard/summary-stats';
import AirdropList from '@/components/dashboard/airdrop-list';
import AddAirdropModal from '@/components/dashboard/add-airdrop-modal';
import AirdropDetailModal from '@/components/dashboard/AirdropDetailModal';
import FilterSearchAirdrops from '@/components/dashboard/filter-search-airdrops';
import Loader from '@/components/ui/loader';
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop } from '@/types/airdrop';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UserInfoCard from '@/components/dashboard/user-info-card';
import EmptyAirdropDayCard from '@/components/dashboard/empty-airdrop-day-card';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth to check user status

function DashboardPageContent() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading state

  const {
    airdrops: filteredAirdrops, // These are already filtered by status and search term
    allAirdrops, // Unfiltered airdrops for summary stats
    isLoading: airdropsLoading, // Loading state from the store
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
  
  // State for Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAirdropForDetail, setSelectedAirdropForDetail] = useState<Airdrop | null>(null);

  const handleOpenAddModal = (airdropToEdit?: Airdrop) => {
    if (airdropToEdit) {
      setEditingAirdrop(airdropToEdit);
      const draftData = {
        userId: airdropToEdit.userId, // ensure userId is part of the draft if needed
        name: airdropToEdit.name,
        startDate: airdropToEdit.startDate,
        deadline: airdropToEdit.deadline,
        description: airdropToEdit.description,
        tasks: airdropToEdit.tasks.map(task => ({ ...task })), 
      };
      updateNewAirdropDraft(draftData);
    } else {
      setEditingAirdrop(null);
      resetNewAirdropDraft(); // This will use the current user's ID from the store
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
        // Preserve original createdAt and userId for updates
        const updatedData: Airdrop = {
            ...editingAirdrop, 
            ...data,
            tasks: data.tasks ? data.tasks.map(t => ({ ...t, id: t.id || crypto.randomUUID() })) : [],
        };

        // Recalculate status
        const now = Date.now();
        let status: Airdrop['status'] = 'Upcoming';
        if (updatedData.startDate && updatedData.startDate <= now) status = 'Active';
        const allTasksCompleted = updatedData.tasks.length > 0 && updatedData.tasks.every(t => t.completed);
        if (allTasksCompleted || (updatedData.deadline && updatedData.deadline < now)) {
            status = 'Completed';
        } else if (updatedData.startDate && updatedData.startDate <= now) {
            status = 'Active';
        }
        updatedData.status = status;
        
        await storeUpdateAirdrop(updatedData);
        toast({ title: "Airdrop Diperbarui", description: `"${data.name}" berhasil diperbarui.` });
      } else {
        // For new airdrops, userId is already in newAirdropDraft from the store
        const newAirdropDataWithTaskIds = {
            ...data, // data from form
            tasks: data.tasks ? data.tasks.map(t => ({ ...t, id: t.id || crypto.randomUUID() })) : [],
        };
        await storeAddAirdrop(newAirdropDataWithTaskIds);
        toast({ title: "Airdrop Ditambahkan", description: `"${data.name}" berhasil ditambahkan.` });
      }
      handleCloseAddModal();
      // resetNewAirdropDraft() is called by storeAddAirdrop
    } catch (error) {
      console.error("Error saving airdrop:", error);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Terjadi kesalahan saat menyimpan airdrop." });
    }
  };

  const handleDeleteAirdrop = async (airdropId: string) => {
    const airdropToDelete = allAirdrops.find(a => a.id === airdropId);
    try {
      await storeDeleteAirdrop(airdropId);
      toast({ title: "Airdrop Dihapus", description: `"${airdropToDelete?.name}" telah dihapus.` });
    } catch (error) {
      console.error("Error deleting airdrop:", error);
      toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus airdrop." });
    }
  };
  
  const handleTaskToggle = async (airdropId: string, taskId: string) => {
    const airdropToUpdate = allAirdrops.find(a => a.id === airdropId);
    if (airdropToUpdate) {
      const updatedTasks = airdropToUpdate.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      let updatedAirdrop = { ...airdropToUpdate, tasks: updatedTasks };
      
      const now = Date.now();
      let newStatus: Airdrop['status'] = 'Upcoming';
      if (updatedAirdrop.startDate && updatedAirdrop.startDate <= now) newStatus = 'Active';
      const allTasksCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
      if (allTasksCompleted || (updatedAirdrop.deadline && updatedAirdrop.deadline < now)) {
          newStatus = 'Completed';
      } else if (updatedAirdrop.startDate && updatedAirdrop.startDate <= now) {
        newStatus = 'Active';
      }
      updatedAirdrop.status = newStatus;
      
      try {
        await storeUpdateAirdrop(updatedAirdrop);
        // Optional: toast for task toggle
      } catch (error) {
        console.error("Error updating task status:", error);
        toast({ variant: "destructive", title: "Gagal Update Tugas", description: "Terjadi kesalahan." });
      }
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

  // Combined loading state
  if (authLoading || airdropsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader variant="page" size="lg" />
      </div>
    );
  }
  
  // If auth is done, but no user, redirect or show message (handled by useAuth redirect mostly)
  if (!user && !authLoading) {
    // This case should ideally be handled by a route guard or redirect in _app or layout
    // For now, showing a simple message or relying on useAuth's redirect to /login
    return (
         <div className="flex h-screen items-center justify-center bg-background">
            <p>Silakan login untuk mengakses dashboard.</p>
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
            onShowDetail={handleOpenDetailModal}
          />
        </div>
      </main>
      <AddAirdropModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveAirdrop}
        initialData={editingAirdrop ? newAirdropDraft : undefined} // Pass the store's draft for editing
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
  // AuthProvider should wrap this if not already done at a higher level (e.g. layout or _app)
  // Assuming AuthProvider is in RootLayout or a similar higher-order component.
  return <DashboardPageContent />;
}
