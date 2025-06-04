export interface AirdropTask {
  id: string;
  text: string;
  completed: boolean;
}

export type AirdropStatus = 'Upcoming' | 'Active' | 'Completed';
export type AirdropFilterStatus = AirdropStatus | 'All';


export interface Airdrop {
  id: string; // Firestore document ID or local UUID
  userId: string; // Firebase user ID
  name: string;
  startDate?: number; // Timestamp (Date.now() or serverTimestamp())
  deadline?: number; // Timestamp
  description?: string;
  tasks: AirdropTask[];
  status: AirdropStatus;
  createdAt: number; // Timestamp
  // Progress can be calculated: (completed tasks / total tasks) * 100
}
