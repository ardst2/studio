// src/components/dashboard/airdrop-list.tsx
"use client";

import type { Airdrop } from '@/types/airdrop';
import AirdropItem from './airdrop-item';
import { AnimatePresence, motion } from 'framer-motion';
import { PackageOpen } from 'lucide-react';

interface AirdropListProps {
  airdrops: Airdrop[];
  onEditAirdrop: (airdrop: Airdrop) => void;
  onDeleteAirdrop: (airdropId: string) => void;
  onTaskToggle: (airdropId: string, taskId: string) => void;
  onShowDetail: (airdrop: Airdrop) => void; // New prop
}

const AirdropList = ({ airdrops, onEditAirdrop, onDeleteAirdrop, onTaskToggle, onShowDetail }: AirdropListProps) => {
  if (airdrops.length === 0) {
    return (
      <div className="text-center py-12">
        <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-xl font-semibold text-foreground">Belum Ada Airdrop</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Mulai tambahkan airdrop baru untuk dilacak.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {airdrops.map((airdrop, index) => (
          <motion.div
            key={airdrop.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="h-full"
          >
            <AirdropItem
              airdrop={airdrop}
              onEdit={onEditAirdrop}
              onDelete={onDeleteAirdrop}
              onTaskToggle={onTaskToggle}
              onShowDetail={onShowDetail} // Pass down
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AirdropList;
