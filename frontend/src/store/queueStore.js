import { create } from 'zustand';
import { supabase } from '../App';
import { v4 as uuidv4 } from 'uuid';

const useQueueStore = create((set, get) => ({
  // Queue-related state
  currentQueue: null,
  queueTickets: [],
  isLoading: false,
  error: null,
  
  // Queue stats
  nowServing: null,
  waitingCount: 0,
  averageWaitTime: 0,
  
  // Create a new queue
  createQueue: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const queueId = uuidv4();
      const adminSecret = uuidv4();
      
      const { data, error } = await supabase
        .from('queues')
        .insert([
          { 
            id: queueId, 
            name, 
            admin_secret: adminSecret,
            created_at: new Date().toISOString(),
            status: 'active'
          }
        ])
        .select();
      
      if (error) throw error;
      
      set({ 
        currentQueue: data[0],
        isLoading: false
      });

      return {
        queueId,
        adminSecret
      };
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return null;
    }
  },
  
  // Load a queue by ID
  loadQueue: async (queueId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: queue, error: queueError } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .single();
      
      if (queueError) throw queueError;
      
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('queue_id', queueId)
        .order('created_at', { ascending: true });
      
      if (ticketsError) throw ticketsError;
      
      // Find the ticket currently being served
      const servingTicket = tickets.find(ticket => ticket.status === 'serving');
      
      // Count the waiting tickets
      const waitingTickets = tickets.filter(ticket => ticket.status === 'waiting');
      
      set({ 
        currentQueue: queue,
        queueTickets: tickets,
        nowServing: servingTicket || null,
        waitingCount: waitingTickets.length,
        isLoading: false
      });
      
      return queue;
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return null;
    }
  },
  
  // Join a queue (create a ticket)
  joinQueue: async (queueId, name) => {
    set({ isLoading: true, error: null });
    try {
      // Get the queue to make sure it exists
      const { data: queue, error: queueError } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .single();
      
      if (queueError) throw queueError;
      
      // Get the count of tickets to assign the next number
      const { data: ticketCount, error: countError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact' })
        .eq('queue_id', queueId);
      
      if (countError) throw countError;
      
      const ticketNumber = (ticketCount?.length || 0) + 1;
      
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([
          {
            id: uuidv4(),
            queue_id: queueId,
            name,
            ticket_number: ticketNumber,
            status: 'waiting',
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (ticketError) throw ticketError;
      
      // Refresh the queue data
      await get().loadQueue(queueId);
      
      set({ isLoading: false });
      return ticket[0];
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return null;
    }
  },
  
  // Call the next ticket
  callNext: async (queueId, adminSecret) => {
    set({ isLoading: true, error: null });
    try {
      // Verify admin credentials
      const { data: queue, error: queueError } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .eq('admin_secret', adminSecret)
        .single();
      
      if (queueError) throw new Error('Unauthorized access');
      
      // Set any currently serving ticket to served
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'served', completed_at: new Date().toISOString() })
        .eq('queue_id', queueId)
        .eq('status', 'serving');
      
      if (updateError) throw updateError;
      
      // Get the next waiting ticket
      const { data: nextTickets, error: nextError } = await supabase
        .from('tickets')
        .select('*')
        .eq('queue_id', queueId)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (nextError) throw nextError;
      
      if (nextTickets && nextTickets.length > 0) {
        // Update the next ticket to serving
        const { error: serveError } = await supabase
          .from('tickets')
          .update({ status: 'serving', updated_at: new Date().toISOString() })
          .eq('id', nextTickets[0].id);
        
        if (serveError) throw serveError;
      }
      
      // Refresh the queue data
      await get().loadQueue(queueId);
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Skip a ticket
  skipTicket: async (queueId, ticketId, adminSecret) => {
    set({ isLoading: true, error: null });
    try {
      // Verify admin credentials
      const { data: queue, error: queueError } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .eq('admin_secret', adminSecret)
        .single();
      
      if (queueError) throw new Error('Unauthorized access');
      
      // Update the ticket to skipped
      const { error: skipError } = await supabase
        .from('tickets')
        .update({ status: 'skipped', updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      if (skipError) throw skipError;
      
      // Refresh the queue data
      await get().loadQueue(queueId);
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Reset the queue
  resetQueue: async (queueId, adminSecret) => {
    set({ isLoading: true, error: null });
    try {
      // Verify admin credentials
      const { data: queue, error: queueError } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .eq('admin_secret', adminSecret)
        .single();
      
      if (queueError) throw new Error('Unauthorized access');
      
      // Mark all tickets as archived
      const { error: resetError } = await supabase
        .from('tickets')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('queue_id', queueId);
      
      if (resetError) throw resetError;
      
      // Refresh the queue data
      await get().loadQueue(queueId);
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      return false;
    }
  },

  // Set up real-time listener for queue updates
  setupQueueListener: (queueId) => {
    // Return the subscription so it can be unsubscribed when needed
    return supabase
      .channel(`queue:${queueId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets',
          filter: `queue_id=eq.${queueId}` 
        }, 
        () => {
          // When any ticket changes, reload the queue data
          get().loadQueue(queueId);
        }
      )
      .subscribe();
  }
}));

export default useQueueStore;