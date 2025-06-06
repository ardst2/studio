
// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import SummaryStats from '@/components/dashboard/summary-stats';
import AirdropList from '@/components/dashboard/airdrop-list';
import AddAirdropModal from '@/components/dashboard/add-airdrop-modal';
import AirdropDetailModal from '@/components/dashboard/AirdropDetailModal';
import TodaysDeadlinesModal from '@/components/dashboard/TodaysDeadlinesModal';
import EditProfileModal from '@/components/dashboard/edit-profile-modal';
import AirdropStatsModal from '@/components/dashboard/AirdropStatsModal';
import SheetsImportModal from '@/components/dashboard/SheetsImportModal';
import AiAssistModal from '@/components/dashboard/AiAssistModal';
import ResearchAirdropModal from '@/components/dashboard/ResearchAirdropModal';
// import AddAirdropOptionsModal from '@/components/dashboard/AddAirdropOptionsModal'; // Dihapus
import FilterSearchAirdrops from '@/components/dashboard/filter-search-airdrops';
import Loader from '@/components/ui/loader';
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop } from '@/types/airdrop';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UserInfoCard from '@/components/dashboard/user-info-card';
import EmptyAirdropDayCard from '@/components/dashboard/empty-airdrop-day-card';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { Target, FilePlus2, Sparkles, SearchCheck, FileSpreadsheet } from 'lucide-react';

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
  const [isSheetsImportModalOpen, setIsSheetsImportModalOpen] = useState(false);
  const [isAiAssistModalOpen, setIsAiAssistModalOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  // const [isAddOptionsModalOpen, setIsAddOptionsModalOpen] = useState(false); // Dihapus


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
        blockchain: airdropToEdit.blockchain,
        registrationDate: airdropToEdit.registrationDate,
        participationRequirements: airdropToEdit.participationRequirements,
        airdropLink: airdropToEdit.airdropLink,
        userDefinedStatus: airdropToEdit.userDefinedStatus,
        notes: airdropToEdit.notes,
        walletAddress: airdropToEdit.walletAddress,
        tokenAmount: airdropToEdit.tokenAmount,
        claimDate: airdropToEdit.claimDate,
        airdropType: airdropToEdit.airdropType,
        referralCode: airdropToEdit.referralCode,
        informationSource: airdropToEdit.informationSource,
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

  const handleOpenTodaysDeadlinesModal = () => setIsTodaysDeadlinesModalOpen(true);
  const handleCloseTodaysDeadlinesModal = () => setIsTodaysDeadlinesModalOpen(false);

  const airdropsDueToday = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    return allAirdrops.filter(airdrop => {
      if (!airdrop.deadline) return false;
      const deadlineDate = new Date(airdrop.deadline);
      return deadlineDate >= todayStart && deadlineDate <= todayEnd && airdrop.status !== 'Completed';
    });
  }, [allAirdrops]);

  const handleSelectAirdropFromTodaysList = (airdrop: Airdrop) => handleOpenDetailModal(airdrop);
  const handleOpenEditProfileModal = () => setIsEditProfileModalOpen(true);
  const handleCloseEditProfileModal = () => setIsEditProfileModalOpen(false);

  const handleSaveProfile = async (data: { displayName: string; photoURL?: string }) => {
    if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "Pengguna tidak terautentikasi." });
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL || auth.currentUser.photoURL,
      });
      toast({ title: "Profil Diperbarui", description: "Informasi profil Anda berhasil disimpan." });
      handleCloseEditProfileModal();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Gagal Menyimpan Profil", description: "Terjadi kesalahan saat memperbarui profil." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenStatsModal = () => setIsStatsModalOpen(true);
  const handleCloseStatsModal = () => setIsStatsModalOpen(false);
  const handleOpenSheetsImportModal = () => setIsSheetsImportModalOpen(true);
  const handleCloseSheetsImportModal = () => setIsSheetsImportModalOpen(false);
  const handleOpenAiAssistModal = () => setIsAiAssistModalOpen(true);
  const handleCloseAiAssistModal = () => setIsAiAssistModalOpen(false);
  const handleOpenResearchModal = () => setIsResearchModalOpen(true); 
  const handleCloseResearchModal = () => setIsResearchModalOpen(false);
  // const handleOpenAddOptionsModal = () => setIsAddOptionsModalOpen(true); // Dihapus
  // const handleCloseAddOptionsModal = () => setIsAddOptionsModalOpen(false); // Dihapus


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
        {/* Top row of cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
          <div className="card-gradient-glow-wrapper h-72">
            <UserInfoCard
              airdrops={allAirdrops}
              user={user}
              onOpenProfileModal={handleOpenEditProfileModal}
            />
          </div>
          <div className="card-gradient-glow-wrapper h-72">
            <SummaryStats airdrops={allAirdrops} onOpenStatsModal={handleOpenStatsModal} />
          </div>
          <div className="card-gradient-glow-wrapper h-72">
            <EmptyAirdropDayCard
              onShowTodaysDeadlines={handleOpenTodaysDeadlinesModal}
              onAddNewAirdrop={() => handleOpenAddModal()} // Kembali ke handleOpenAddModal
              airdrops={allAirdrops}
            />
          </div>
          <div className="card-gradient-glow-wrapper h-72"> 
             <Card
              className={cn(
                "shadow-xl w-full h-full bg-card text-card-foreground p-6 flex flex-col items-center justify-center text-center",
                "cursor-pointer transition-all duration-200 ease-in-out"
              )}
              onClick={handleOpenResearchModal}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenResearchModal(); }}
              aria-label="Buka Riset Airdrop AI"
            >
              <CardHeader className="p-0 pb-2 flex flex-col items-center justify-center">
                <SearchCheck className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-lg text-foreground">Riset Airdrop</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-1">
                <p className="text-xs text-muted-foreground">Analisis potensi dari teks atau URL.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lacak & Kelola Airdrop Section - Full Width on md and up */}
        <div className="card-gradient-glow-wrapper">
          <Card className="w-full bg-card text-card-foreground p-6 shadow-xl">
            <CardHeader className="p-0 pb-6 text-left sm:text-center">
              <div className="flex items-center justify-center sm:flex-col mb-2 sm:mb-0">
                <Target className="h-8 w-8 text-gradient-theme mr-3 sm:mr-0 sm:mb-2" />
                <CardTitle className="font-headline text-2xl text-foreground">Lacak &amp; Kelola Airdrop</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-left sm:text-center">
                Pilih salah satu opsi di bawah ini untuk menambahkan dan mengelola peluang airdrop Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Sub-card 1: Tambah Manual */}
                <div className="card-gradient-glow-wrapper">
                  <Card
                    className="w-full bg-input/30 hover:bg-input/70 text-card-foreground p-4 flex flex-col justify-center items-center text-center cursor-pointer h-36"
                    onClick={() => handleOpenAddModal()}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenAddModal(); }}
                    aria-label="Tambah airdrop baru secara manual"
                  >
                    <FilePlus2 className="h-7 w-7 mb-2 text-primary" />
                    <CardTitle className="font-semibold text-base text-foreground">Tambah Manual</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Masukkan detail airdrop secara manual.
                    </p>
                  </Card>
                </div>
                {/* Sub-card 2: Import dari Sheets */}
                <div className="card-gradient-glow-wrapper">
                  <Card
                    className="w-full bg-input/30 hover:bg-input/70 text-card-foreground p-4 flex flex-col justify-center items-center text-center cursor-pointer h-36"
                    onClick={handleOpenSheetsImportModal}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenSheetsImportModal(); }}
                    aria-label="Impor airdrop dari Google Sheets"
                  >
                    <FileSpreadsheet className="h-7 w-7 mb-2 text-primary" />
                    <CardTitle className="font-semibold text-base text-foreground">Import dari Sheets</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tarik data dari Google Sheets.
                    </p>
                  </Card>
                </div>
                {/* Sub-card 3: Bantuan AI Ekstrak */}
                <div className="card-gradient-glow-wrapper">
                  <Card
                    className="w-full bg-input/30 hover:bg-input/70 text-card-foreground p-4 flex flex-col justify-center items-center text-center cursor-pointer h-36"
                    onClick={handleOpenAiAssistModal}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenAiAssistModal(); }}
                    aria-label="Buka Bantuan AI untuk ekstraksi data"
                  >
                    <Sparkles className="h-7 w-7 mb-2 text-primary" />
                    <CardTitle className="font-semibold text-base text-foreground">Bantuan AI Ekstrak</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ekstrak info dari teks atau URL.
                    </p>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Airdrop List Section */}
        <div>
           <h2 className="text-2xl font-headline text-foreground mb-6 mt-10">Airdrop Aktif Anda</h2>
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
      {/* <AddAirdropOptionsModal // Dihapus
        isOpen={isAddOptionsModalOpen}
        onClose={handleCloseAddOptionsModal}
        onOpenAddManual={() => handleOpenAddModal()}
        onOpenImportSheets={handleOpenSheetsImportModal}
        onOpenAiAssist={handleOpenAiAssistModal}
      /> */}
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
      <SheetsImportModal 
        isOpen={isSheetsImportModalOpen}
        onClose={handleCloseSheetsImportModal}
      />
      <AiAssistModal
        isOpen={isAiAssistModalOpen}
        onClose={handleCloseAiAssistModal}
      />
      <ResearchAirdropModal
        isOpen={isResearchModalOpen}
        onClose={handleCloseResearchModal}
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

