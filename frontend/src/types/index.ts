// Queue related types
export type QueueStatus = 'active' | 'paused' | 'closed' | 'archived';

export interface Queue {
  id: string;
  name: string;
  admin_secret: string;
  created_at: string;
  updated_at?: string;
  status: QueueStatus;
}

// Ticket related types
export type TicketStatus = 'waiting' | 'serving' | 'served' | 'skipped' | 'archived';

export interface Ticket {
  id: string;
  queue_id: string;
  name: string;
  ticket_number: number;
  status: TicketStatus;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface QueueInfo {
  currentQueue: Queue | null;
  queueTickets: Ticket[];
  nowServing: Ticket | null;
  waitingCount: number;
  averageWaitTime: number;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Form types
export interface CreateQueueFormData {
  name: string;
}

export interface JoinQueueFormData {
  name: string;
}

export interface AdminLoginFormData {
  adminSecret: string;
}

// Settings and preferences
export interface UserPreferences {
  darkMode: boolean;
  notificationsEnabled: boolean;
}

// Auth related 
export interface AdminAuth {
  queueId: string;
  adminSecret: string;
} 