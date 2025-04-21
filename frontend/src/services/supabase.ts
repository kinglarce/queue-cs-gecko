import { SupabaseClient } from '@supabase/supabase-js';
import { ApiResponse, Queue, Ticket, QueueStatus, TicketStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../App';

// Error handling helper
const handleApiError = (error: any): string => {
  console.error('API Error:', error);
  
  // Try to extract the most useful error message
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  if (error?.details) return error.details;
  
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

      console.log('Creating queue with:', { queueId, name, adminSecret });
      
      // Create the queue data object
      const queueData = {
        id: queueId,
        name,
        admin_secret: adminSecret,
        created_at: new Date().toISOString(),
        status: 'active' as QueueStatus
      };
      
      console.log('About to send request to Supabase');
      
      // Attempt to insert with the Supabase client
      const { data, error } = await supabase
        .from('queues')
        .insert(queueData)
        .select();
      
      if (error) {
        console.error('Supabase client error:', error);
        
        // Log details about the error to help diagnose
        if (error.code) console.error('Error code:', error.code);
        if (error.details) console.error('Error details:', error.details);
        if (error.hint) console.error('Error hint:', error.hint);
        
        // Try direct approach if Supabase client fails
        try {
          const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
          const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
          
          console.log('Attempting direct API call to:', `${supabaseUrl}/rest/v1/queues`);
          console.log('With data:', JSON.stringify(queueData, null, 2));
          
          const directResponse = await fetch(`${supabaseUrl}/rest/v1/queues`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(queueData)
          });
          
          console.log('Direct API call response status:', directResponse.status);
          
          let responseBody: any;
          try {
            responseBody = await directResponse.text();
            console.log('Response body:', responseBody);
            
            // Try to parse as JSON if possible
            try {
              responseBody = JSON.parse(responseBody);
            } catch (e) {
              // Keep as text if it's not valid JSON
            }
          } catch (e) {
            console.error('Failed to read response body:', e);
          }
          
          if (!directResponse.ok) {
            return { 
              data: null, 
              error: `API Error (${directResponse.status}): ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}` 
            };
          }
          
          // If we reached here, direct insertion worked
          console.log('Direct insertion successful');
          return {
            data: {
              queueId,
              adminSecret
            },
            error: null
          };
        } catch (directError) {
          console.error('Direct API call failed:', directError);
          return { 
            data: null, 
            error: `Failed to create queue: ${handleApiError(error)}. Direct API attempt also failed: ${handleApiError(directError)}` 
          };
        }
      }
      
      // Original Supabase call worked
      console.log('Queue created successfully:', data);
      return {
        data: {
          queueId,
          adminSecret
        },
        error: null
      };
    } catch (error) {
      console.error('Uncaught error in createQueue:', error);
      return { 
        data: null, 
        error: `Unexpected error: ${handleApiError(error)}` 
      };
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