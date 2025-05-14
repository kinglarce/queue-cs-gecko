// Queue Room types
export type QueueRoomStatus = 'active' | 'paused' | 'closed';

export interface QueueRoom {
  id: string;
  name: string;
  description: string | null;
  admin_token: string;
  visitor_token: string;
  status: QueueRoomStatus;
  estimated_wait_time: number | null;
  admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueueRoomWithUrls extends QueueRoom {
  adminUrl: string;
  visitorUrl: string;
}

// Queue Item types
export type QueueItemStatus = 'waiting' | 'serving' | 'completed' | 'no_show';

export interface QueueItem {
  id: string;
  queue_room_id: string;
  name: string;
  ticket_number: number;
  status: QueueItemStatus;
  joined_at: string;
  serving_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// Form types
export interface CreateQueueFormData {
  name: string;
  description?: string;
}

export interface JoinQueueFormData {
  name: string;
}

// Subscription type for Supabase realtime
export interface SubscriptionObject {
  unsubscribe: () => void;
}

// Map of active subscriptions
export interface ActiveSubscriptions {
  [key: string]: any; // This will be updated with the proper RealtimeChannel type
}

// Response when creating a queue room
export interface QueueRoomResponse {
  room: QueueRoom;
  adminUrl: string;
  visitorUrl: string;
} 