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
  status: AirdropStatus;
  createdAt: number; // JS Timestamp (milliseconds) for client-side sorting, actual stored as Firestore Timestamp
}
