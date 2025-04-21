import { create } from 'zustand';
import { QueueService, TicketService, setupQueueListener } from '@/services/supabase';
import { Queue, Ticket, TicketStatus } from '@/types';

interface QueueState {
  // Queue data
  currentQueue: Queue | null;
  queueTickets: Ticket[];
  
  // Status indicators
  isLoading: boolean;
  error: string | null;
  
  // Queue statistics
  nowServing: Ticket | null;
  waitingCount: number;
  averageWaitTime: number;
  
  // Active listener
  activeListener: { unsubscribe: () => void } | null;
  
  // Actions
  createQueue: (name: string) => Promise<{ queueId: string; adminSecret: string } | null>;
  loadQueue: (queueId: string) => Promise<Queue | null>;
  joinQueue: (queueId: string, name: string) => Promise<Ticket | null>;
  callNext: (queueId: string, adminSecret: string) => Promise<boolean>;
  skipTicket: (queueId: string, ticketId: string, adminSecret: string) => Promise<boolean>;
  resetQueue: (queueId: string, adminSecret: string) => Promise<boolean>;
  setupQueueListener: (queueId: string) => { unsubscribe: () => void };
  cleanupListener: () => void;
  
  // Computed helpers
  getWaitingTickets: () => Ticket[];
  getServingTickets: () => Ticket[];
  getServedTickets: () => Ticket[];
  getSkippedTickets: () => Ticket[];
  getTicketPosition: (ticketId: string) => number;
  calculateWaitTime: (position: number) => number;
}

const DEFAULT_WAIT_TIME = Number(process.env.REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON) || 3;

const useQueueStore = create<QueueState>((set, get) => ({
  // Initial state
  currentQueue: null,
  queueTickets: [],
  isLoading: false,
  error: null,
  nowServing: null,
  waitingCount: 0,
  averageWaitTime: 0,
  activeListener: null,
  
  // Create a new queue
  createQueue: async (name) => {
    set({ isLoading: true, error: null });
    
    const { data, error } = await QueueService.createQueue(name);
    
    if (error) {
      set({ error, isLoading: false });
      return null;
    }
    
    set({ isLoading: false });
    return data;
  },
  
  // Load a queue by ID
  loadQueue: async (queueId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Fetch queue data
      const { data: queue, error: queueError } = await QueueService.getQueueById(queueId);
      
      if (queueError) {
        set({ error: queueError, isLoading: false });
        return null;
      }
      
      // Fetch tickets for the queue
      const { data: tickets, error: ticketsError } = await TicketService.getQueueTickets(queueId);
      
      if (ticketsError) {
        set({ error: ticketsError, isLoading: false });
        return null;
      }
      
      // Process the data
      const ticketsArray = tickets || [];
      const servingTicket = ticketsArray.find(ticket => ticket.status === 'serving');
      const waitingTickets = ticketsArray.filter(ticket => ticket.status === 'waiting');
      
      set({
        currentQueue: queue,
        queueTickets: ticketsArray,
        nowServing: servingTicket || null,
        waitingCount: waitingTickets.length,
        // Simple average wait time calculation
        averageWaitTime: waitingTickets.length * DEFAULT_WAIT_TIME,
        isLoading: false
      });
      
      return queue;
    } catch (err: any) {
      set({ 
        error: err.message || 'Failed to load queue', 
        isLoading: false 
      });
      return null;
    }
  },
  
  // Join a queue (create a ticket)
  joinQueue: async (queueId, name) => {
    set({ isLoading: true, error: null });
    
    const { data: ticket, error } = await TicketService.joinQueue(queueId, name);
    
    if (error) {
      set({ error, isLoading: false });
      return null;
    }
    
    // Refresh the queue data
    await get().loadQueue(queueId);
    
    set({ isLoading: false });
    return ticket;
  },
  
  // Call the next customer
  callNext: async (queueId, adminSecret) => {
    set({ isLoading: true, error: null });
    
    const { data, error } = await TicketService.callNext(queueId, adminSecret);
    
    if (error) {
      set({ error, isLoading: false });
      return false;
    }
    
    // Refresh the queue data
    await get().loadQueue(queueId);
    
    set({ isLoading: false });
    return data || false;
  },
  
  // Skip a ticket
  skipTicket: async (queueId, ticketId, adminSecret) => {
    set({ isLoading: true, error: null });
    
    const { data, error } = await TicketService.skipTicket(queueId, ticketId, adminSecret);
    
    if (error) {
      set({ error, isLoading: false });
      return false;
    }
    
    // Refresh the queue data
    await get().loadQueue(queueId);
    
    set({ isLoading: false });
    return data || false;
  },
  
  // Reset the queue
  resetQueue: async (queueId, adminSecret) => {
    set({ isLoading: true, error: null });
    
    const { data, error } = await QueueService.resetQueue(queueId, adminSecret);
    
    if (error) {
      set({ error, isLoading: false });
      return false;
    }
    
    // Refresh the queue data
    await get().loadQueue(queueId);
    
    set({ isLoading: false });
    return data || false;
  },
  
  // Setup realtime listener for queue updates
  setupQueueListener: (queueId) => {
    // First clean up any existing listener
    get().cleanupListener();
    
    // Set up a new listener
    const listener = setupQueueListener(queueId, () => {
      get().loadQueue(queueId);
    });
    
    set({ activeListener: listener });
    
    return listener;
  },
  
  // Cleanup listener on unmount
  cleanupListener: () => {
    const { activeListener } = get();
    if (activeListener) {
      activeListener.unsubscribe();
      set({ activeListener: null });
    }
  },
  
  // Helper getters for ticket filtering
  getWaitingTickets: () => {
    return get().queueTickets.filter(ticket => ticket.status === 'waiting')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
  
  getServingTickets: () => {
    return get().queueTickets.filter(ticket => ticket.status === 'serving');
  },
  
  getServedTickets: () => {
    return get().queueTickets.filter(ticket => ticket.status === 'served')
      .sort((a, b) => {
        // Sort by completed_at if available, otherwise updated_at
        const aTime = a.completed_at ? new Date(a.completed_at).getTime() : new Date(a.updated_at || a.created_at).getTime();
        const bTime = b.completed_at ? new Date(b.completed_at).getTime() : new Date(b.updated_at || b.created_at).getTime();
        return bTime - aTime; // Most recent first
      });
  },
  
  getSkippedTickets: () => {
    return get().queueTickets.filter(ticket => ticket.status === 'skipped');
  },
  
  // Get a ticket's position in the waiting queue
  getTicketPosition: (ticketId) => {
    const { queueTickets } = get();
    const ticket = queueTickets.find(t => t.id === ticketId);
    
    if (!ticket || ticket.status !== 'waiting') return -1;
    
    const waitingTickets = get().getWaitingTickets();
    return waitingTickets.findIndex(t => t.id === ticketId) + 1;
  },
  
  // Calculate estimated wait time based on position
  calculateWaitTime: (position) => {
    if (position <= 0) return 0;
    return position * DEFAULT_WAIT_TIME;
  }
}));

export default useQueueStore; 