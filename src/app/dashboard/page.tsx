
// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import AddAirdropButton from '@/components/dashboard/add-airdrop-button';
import SummaryStats from '@/components/dashboard/summary-stats';
import AirdropList from '@/components/dashboard/airdrop-list';
import AddAirdropModal from '@/components/dashboard/add-airdrop-modal';
import AirdropDetailModal from '@/components/dashboard/AirdropDetailModal';
import TodaysDeadlinesModal from '@/components/dashboard/TodaysDeadlinesModal';
import EditProfileModal from '@/components/dashboard/edit-profile-modal';
import AirdropStatsModal from '@/components/dashboard/AirdropStatsModal'; 
import FilterSearchAirdrops from '@/components/dashboard/filter-search-airdrops';
import Loader from '@/components/ui/loader';
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop } from '@/types/airdrop';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UserInfoCard from '@/components/dashboard/user-info-card';
import EmptyAirdropDayCard from '@/components/dashboard/empty-airdrop-day-card';
import { useAuth } from '@/hooks/use-auth';
import { auth, storage, storageRef, uploadBytes, getDownloadURL } from '@/lib/firebase'; // Import storage and methods
import { updateProfile } from 'firebase/auth';

function DashboardPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const {
    airdrops: filteredAirdrops,
    allAirdrops,
    isLoading: airdropsLoading,
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAirdropForDetail, setSelectedAirdropForDetail] = useState<Airdrop | null>(null);
  const [isTodaysDeadlinesModalOpen, setIsTodaysDeadlinesModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false); 


  const handleOpenAddModal = (airdropToEdit?: Airdrop) => {
    if (airdropToEdit) {
      setEditingAirdrop(airdropToEdit);
      const draftData = {
        userId: airdropToEdit.userId,
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
        } else if (updatedData.startDate && updatedData.startDate <= now) {
            status = 'Active';
        }
        updatedData.status = status;
        
        await storeUpdateAirdrop(updatedData);
        toast({ title: "Airdrop Diperbarui", description: `"${updatedData.name}" berhasil diperbarui.` });
      } else {
        const newAirdropDataWithTaskIds = {
            ...data,
            tasks: data.tasks ? data.tasks.map(t => ({ ...t, id: t.id || crypto.randomUUID() })) : [],
        };
        await storeAddAirdrop(newAirdropDataWithTaskIds);
        toast({ title: "Airdrop Ditambahkan", description: `"${data.name}" berhasil ditambahkan.` });
      }
      handleCloseAddModal();
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
      } catch (error) {
        console.error("Error updating task status:", error);
        toast({ variant: "destructive", title: "Gagal Update Tugas", description: "Terjadi kesalahan." });
      }
    }
  };

  const handleOpenDetailModal = (airdrop: Airdrop) => {
    setSelectedAirdropForDetail(airdrop);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedAirdropForDetail(null);
    setIsDetailModalOpen(false);
  };

  const handleOpenTodaysDeadlinesModal = () => {
    setIsTodaysDeadlinesModalOpen(true);
  };

  const handleCloseTodaysDeadlinesModal = () => {
    setIsTodaysDeadlinesModalOpen(false);
  };
  
  const airdropsDueToday = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return allAirdrops.filter(airdrop => {
      if (!airdrop.deadline) return false;
      const deadlineDate = new Date(airdrop.deadline);
      return deadlineDate >= todayStart && deadlineDate <= todayEnd && airdrop.status !== 'Completed';
    });
  }, [allAirdrops]);

  const handleSelectAirdropFromTodaysList = (airdrop: Airdrop) => {
    handleOpenDetailModal(airdrop);
  };

  const handleOpenEditProfileModal = () => setIsEditProfileModalOpen(true);
  const handleCloseEditProfileModal = () => setIsEditProfileModalOpen(false);

  const handleSaveProfile = async (data: { displayName: string; photoFile?: File }) => {
    if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "Pengguna tidak terautentikasi." });
      return;
    }
    setIsSavingProfile(true);
    try {
      let photoURLToUpdate: string | null = auth.currentUser.photoURL; // Default to existing

      if (data.photoFile) {
        toast({ title: "Mengunggah Foto...", description: "Harap tunggu sebentar." });
        const file = data.photoFile;
        const fileRef = storageRef(storage, `profilePictures/${auth.currentUser.uid}/${file.name}`);
        const uploadResult = await uploadBytes(fileRef, file);
        photoURLToUpdate = await getDownloadURL(uploadResult.ref);
        toast({ title: "Foto Terunggah", description: "Foto profil berhasil diunggah." });
      }

      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: photoURLToUpdate, 
      });
      
      // The useAuth hook's onAuthStateChanged will pick up the profile update automatically
      toast({ title: "Profil Diperbarui", description: "Informasi profil Anda berhasil disimpan." });
      handleCloseEditProfileModal();
    } catch (error) {
      console.error("Error updating profile:", error);
      let errorMessage = "Terjadi kesalahan saat memperbarui profil.";
      if (error instanceof Error && error.message.includes('storage/object-not-found')) {
        errorMessage = "Gagal mendapatkan URL foto setelah unggah.";
      } else if (error instanceof Error && error.message.includes('storage/unauthorized')) {
        errorMessage = "Tidak diizinkan mengunggah foto. Periksa aturan penyimpanan Anda.";
      }
      toast({ variant: "destructive", title: "Gagal Menyimpan Profil", description: errorMessage });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenStatsModal = () => setIsStatsModalOpen(true);
  const handleCloseStatsModal = () => setIsStatsModalOpen(false);


  if (authLoading || airdropsLoading || (!authLoading && !user) ) {
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
          <UserInfoCard 
            airdrops={allAirdrops} 
            user={user} 
            onOpenProfileModal={handleOpenEditProfileModal} 
          />
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
          <SummaryStats airdrops={allAirdrops} onOpenStatsModal={handleOpenStatsModal} />
          <EmptyAirdropDayCard 
            onShowTodaysDeadlines={handleOpenTodaysDeadlinesModal}
            onAddNewAirdrop={() => handleOpenAddModal()} 
            airdrops={allAirdrops} 
          />
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
        initialData={editingAirdrop ? newAirdropDraft : undefined}
      />
      <AirdropDetailModal 
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        airdrop={selectedAirdropForDetail}
      />
      <TodaysDeadlinesModal
        isOpen={isTodaysDeadlinesModalOpen}
        onClose={handleCloseTodaysDeadlinesModal}
        airdropsDueToday={airdropsDueToday}
        onSelectAirdrop={handleSelectAirdropFromTodaysList}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={handleCloseEditProfileModal}
        user={user}
        onSave={handleSaveProfile}
        isSaving={isSavingProfile}
      />
      <AirdropStatsModal 
        isOpen={isStatsModalOpen}
        onClose={handleCloseStatsModal}
        airdrops={allAirdrops}
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
