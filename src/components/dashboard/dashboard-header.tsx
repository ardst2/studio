
// src/components/dashboard/dashboard-header.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Bell, Download, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop } from '@/types/airdrop';

const DashboardHeader = () => {
  const { toast } = useToast();
  const { allAirdrops } = useAirdropsStore();

  const handleDownloadAirdrops = () => {
    if (allAirdrops.length === 0) {
      toast({ title: "Tidak Ada Data", description: "Tidak ada airdrop untuk diunduh." });
      return;
    }

    const header = "ID,Nama,Tanggal Mulai,Deadline,Deskripsi,Status,Tugas (Total),Tugas (Selesai)\n";
    const rows = allAirdrops.map(airdrop => {
      const startDate = airdrop.startDate ? new Date(airdrop.startDate).toLocaleDateString('id-ID') : 'N/A';
      const deadline = airdrop.deadline ? new Date(airdrop.deadline).toLocaleDateString('id-ID') : 'N/A';
      const description = (airdrop.description || '').replace(/"/g, '""'); // Escape double quotes
      const totalTasks = airdrop.tasks.length;
      const completedTasks = airdrop.tasks.filter(t => t.completed).length;
      
      return `"${airdrop.id}","${airdrop.name}","${startDate}","${deadline}","${description}","${airdrop.status}",${totalTasks},${completedTasks}`;
    }).join("\n");

    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "airdrops_data.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Unduhan Dimulai", description: "Data airdrop sedang diunduh sebagai CSV." });
    } else {
      toast({ variant: "destructive", title: "Gagal Mengunduh", description: "Browser Anda tidak mendukung fitur unduhan ini." });
    }
  };

  const handleNotificationsClick = () => {
    toast({
      title: "Notifikasi",
      description: "Tidak ada notifikasi baru saat ini.",
    });
  };

  const handleSignOutClick = () => {
    toast({
      title: "Keluar",
      description: "Fitur keluar saat ini dinonaktifkan karena tidak ada sesi login.",
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-foreground">Selamat Datang!</h1>
        <p className="text-md text-muted-foreground">Berikut ringkasan airdrop Anda.</p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Download Data Airdrop" onClick={handleDownloadAirdrops}>
          <Download className="h-5 w-5 text-foreground/80 hover:text-foreground" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" onClick={handleNotificationsClick}>
          <Bell className="h-5 w-5 text-foreground/80 hover:text-foreground" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Sign Out" onClick={handleSignOutClick}>
          <LogOut className="h-5 w-5 text-foreground/80 hover:text-foreground" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
