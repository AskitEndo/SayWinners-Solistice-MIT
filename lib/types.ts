// lib/types.ts
import { v4 as uuidv4 } from "uuid"; // We'll install uuid soon

export interface User {
  id: string; // UUID
  faceImagesCaptured: boolean; // Flag indicating if face images have been captured
  name: string;
  email: string;
  age: number; // Or string if preferred
  address: string; // Mock data
  bankAccountNumber: string; // Mock data
  accountBalance: number; // User's personal balance, starts at 10,000 INR
  registeredAt: string; // ISO Date string
}

export type RequestType = "loan" | "deposit";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface Request {
  id: string; // UUID
  userId: string; // ID of the user making the request
  type: RequestType;
  title?: string; // Only for loans
  category?: string; // Optional category for loans
  amount: number; // Amount in INR
  details: string; // Reason/description
  status: RequestStatus;
  createdAt: string; // ISO Date string
  votesRequired: number; // Calculated when created (80% of current users)
  approvedBy: string[]; // List of user IDs who voted 'approve'
  rejectedBy: string[]; // List of user IDs who voted 'reject'
  processedAt?: string; // ISO Date string when status changed from pending
}

export interface GlobalState {
  totalFund: number; // The central pool of money in INR
  lastUpdated: string; // ISO Date string
}

// Note: We don't strictly need a separate `votes.json` if we embed
// `approvedBy` and `rejectedBy` directly into the `Request` object,
// which simplifies lookups. Let's proceed with this approach.
