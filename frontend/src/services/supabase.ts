import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse, Queue, Ticket, QueueStatus, TicketStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
  },
});

// Error handling helper
const handleApiError = (error: any): string => {
  console.error('API Error:', error);
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  return 'An unexpected error occurred';
};

// Queue API
export const QueueService = {
  /**
   * Create a new queue
   * @param name - The name of the queue
   * @returns ApiResponse with the created queue and admin information
   */
  async createQueue(name: string): Promise<ApiResponse<{ queueId: string; adminSecret: string }>> {
    try {
      // Generate UUIDs for id and admin_secret
      const queueId = uuidv4();
      const adminSecret = uuidv4();
      
      // Create a queue record
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
      
      if (error) {
        console.error('Error creating queue:', error);
        return { data: null, error: error.message };
      }
      
      return {
        data: {
          queueId,
          adminSecret
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: handleApiError(error) };
    }
  },
  
  /**
   * Get queue by ID
   * @param queueId - The ID of the queue to retrieve
   * @returns ApiResponse with the queue data
   */
  async getQueueById(queueId: string): Promise<ApiResponse<Queue>> {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: handleApiError(error) 
      };
    }
  },
  
  /**
   * Verify admin credentials for a queue
   * @param queueId - The ID of the queue
   * @param adminSecret - The admin secret for the queue
   * @returns ApiResponse with the queue if credentials are valid
   */
  async verifyAdmin(queueId: string, adminSecret: string): Promise<ApiResponse<Queue>> {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .eq('admin_secret', adminSecret)
        .single();
      
      if (error) throw new Error('Invalid admin credentials');
      
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: handleApiError(error) 
      };
    }
  },

  /**
   * Reset a queue (archive all tickets)
   * @param queueId - The ID of the queue to reset
   * @param adminSecret - The admin secret for the queue
   * @returns ApiResponse indicating success or failure
   */
  async resetQueue(queueId: string, adminSecret: string): Promise<ApiResponse<boolean>> {
    try {
      // First verify admin credentials
      const verifyResult = await this.verifyAdmin(queueId, adminSecret);
      if (verifyResult.error) throw new Error(verifyResult.error);
      
      // Mark all tickets as archived
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'archived' as TicketStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('queue_id', queueId);
      
      if (error) throw error;
      
      return { data: true, error: null };
    } catch (error) {
      return { 
        data: false, 
        error: handleApiError(error) 
      };
    }
  }
};

// Ticket API
export const TicketService = {
  /**
   * Get all tickets for a queue
   * @param queueId - The ID of the queue
   * @returns ApiResponse with the tickets
   */
  async getQueueTickets(queueId: string): Promise<ApiResponse<Ticket[]>> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('queue_id', queueId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: [], 
        error: handleApiError(error) 
      };
    }
  },
  
  /**
   * Join a queue (create a ticket)
   * @param queueId - The ID of the queue to join
   * @param name - The name of the person joining
   * @returns ApiResponse with the created ticket
   */
  async joinQueue(queueId: string, name: string): Promise<ApiResponse<Ticket>> {
    try {
      // Verify queue exists
      const { data: queue, error: queueError } = await QueueService.getQueueById(queueId);
      if (queueError) throw new Error(queueError);
      
      // Get count of existing tickets to determine ticket number
      const { data: existingTickets, error: countError } = await this.getQueueTickets(queueId);
      if (countError) throw new Error(countError);
      
      const ticketNumber = (existingTickets?.length || 0) + 1;
      
      // Create the ticket
      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            id: uuidv4(),
            queue_id: queueId,
            name,
            ticket_number: ticketNumber,
            status: 'waiting' as TicketStatus,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: handleApiError(error) 
      };
    }
  },
  
  /**
   * Call the next customer in the queue
   * @param queueId - The ID of the queue
   * @param adminSecret - The admin secret for the queue
   * @returns ApiResponse indicating success or failure
   */
  async callNext(queueId: string, adminSecret: string): Promise<ApiResponse<boolean>> {
    try {
      // Verify admin credentials
      const verifyResult = await QueueService.verifyAdmin(queueId, adminSecret);
      if (verifyResult.error) throw new Error(verifyResult.error);
      
      // Mark any currently serving ticket as served
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          status: 'served' as TicketStatus, 
          completed_at: new Date().toISOString() 
        })
        .eq('queue_id', queueId)
        .eq('status', 'serving');
      
      if (updateError) throw updateError;
      
      // Get the next waiting ticket
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('queue_id', queueId)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (ticketsError) throw ticketsError;
      
      if (tickets && tickets.length > 0) {
        // Update the next ticket to serving
        const { error: serveError } = await supabase
          .from('tickets')
          .update({ 
            status: 'serving' as TicketStatus, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', tickets[0].id);
        
        if (serveError) throw serveError;
      }
      
      return { data: true, error: null };
    } catch (error) {
      return { 
        data: false, 
        error: handleApiError(error) 
      };
    }
  },
  
  /**
   * Skip a ticket in the queue
   * @param queueId - The ID of the queue
   * @param ticketId - The ID of the ticket to skip
   * @param adminSecret - The admin secret for the queue
   * @returns ApiResponse indicating success or failure
   */
  async skipTicket(queueId: string, ticketId: string, adminSecret: string): Promise<ApiResponse<boolean>> {
    try {
      // Verify admin credentials
      const verifyResult = await QueueService.verifyAdmin(queueId, adminSecret);
      if (verifyResult.error) throw new Error(verifyResult.error);
      
      // Update the ticket to skipped
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: 'skipped' as TicketStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      return { data: true, error: null };
    } catch (error) {
      return { 
        data: false, 
        error: handleApiError(error) 
      };
    }
  }
};

// Realtime subscription helper
export const setupQueueListener = (
  queueId: string,
  onTicketsChange: () => void
): { unsubscribe: () => void } => {
  const channel = supabase
    .channel(`queue:${queueId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'tickets',
        filter: `queue_id=eq.${queueId}` 
      }, 
      () => {
        onTicketsChange();
      }
    )
    .subscribe();
  
  return {
    unsubscribe: () => {
      channel.unsubscribe();
    }
  };
}; 