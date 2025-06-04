
// src/components/dashboard/dashboard-header.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Bell, Download, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAirdropsStore } from '@/hooks/use-airdrops-store';
import type { Airdrop } from '@/types/airdrop';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useState } from 'react';

const DashboardHeader = () => {
  const { toast } = useToast();
  const { allAirdrops } = useAirdropsStore();

  const [downloadPopoverOpen, setDownloadPopoverOpen] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationMessage, _setNotificationMessage] = useState("Tidak ada notifikasi baru saat ini."); // Content is static for now

  const handleDownloadAirdropsClick = () => {
    if (allAirdrops.length === 0) {
      setDownloadMessage("Tidak ada data untuk diunduh.");
      setDownloadPopoverOpen(true);
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
      setDownloadMessage("Data airdrop sedang diunduh sebagai CSV.");
    } else {
      setDownloadMessage("Gagal Mengunduh: Browser Anda tidak mendukung fitur unduhan ini.");
    }
    setDownloadPopoverOpen(true);
  };

  const handleNotificationsClick = () => {
    // Popover is controlled by PopoverTrigger, this can be empty or set message if dynamic
    // For this case, the message is static in PopoverContent
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
        <Popover open={downloadPopoverOpen} onOpenChange={setDownloadPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Download Data Airdrop" 
              onClick={handleDownloadAirdropsClick} 
              className="header-icon-button"
            >
              <Download className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-3 popover-gradient-border text-sm" 
            align="end" 
            sideOffset={10}
            onOpenAutoFocus={(e) => e.preventDefault()} 
          >
            {downloadMessage || " "}
          </PopoverContent>
        </Popover>

        <Popover open={notificationPopoverOpen} onOpenChange={setNotificationPopoverOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Notifications" 
              onClick={handleNotificationsClick} 
              className="header-icon-button"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-3 popover-gradient-border text-sm" 
            align="end" 
            sideOffset={10}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {notificationMessage}
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" aria-label="Sign Out" onClick={handleSignOutClick} className="header-icon-button">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;

    