export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string; // e.g., "Pemburu Airdrop"
}
