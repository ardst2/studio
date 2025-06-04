
export interface AirdropTask {
  id: string; // UUID for tasks
  text: string;
  completed: boolean;
}

export type AirdropStatus = 'Upcoming' | 'Active' | 'Completed';
export type AirdropFilterStatus = AirdropStatus | 'All';


export interface Airdrop {
  id: string; // Firestore document ID
  userId: string; // Firebase user ID
  name: string;
  startDate?: number; // JS Timestamp (milliseconds)
  deadline?: number; // JS Timestamp (milliseconds)
  description?: string;
  tasks: AirdropTask[];
  status: AirdropStatus; // System-calculated status
  createdAt: number; // JS Timestamp (milliseconds) for client-side sorting, actual stored as Firestore Timestamp

  // New fields
  blockchain?: string;
  registrationDate?: number; // JS Timestamp (milliseconds)
  participationRequirements?: string;
  airdropLink?: string;
  userDefinedStatus?: string; // User-defined status like "Applied", "KYC Done"
  notes?: string;
  walletAddress?: string;
  tokenAmount?: number;
  claimDate?: number; // JS Timestamp (milliseconds)
  airdropType?: string; // e.g., "Retroactive", "Task-based", "Holder airdrop"
  referralCode?: string;
  informationSource?: string; // e.g., "Twitter", "Blog Post", "Friend"
}
