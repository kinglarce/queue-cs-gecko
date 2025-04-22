import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Queue, Ticket, QueueInfo, ApiResponse } from '../types';

/**
 * Backend Service Abstraction
 * This service layer abstracts the backend implementation (Supabase, Firebase, mock server)
 * allowing us to switch between them without changing the application code.
 */
class ApiService {
  private supabase: SupabaseClient;
  private mockMode: boolean = false;
  private mockApiUrl: string | null = null;

  constructor() {
    // Get environment variables
    const apiUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
    const apiKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
    
    // Check if we're in mock mode
    this.mockMode = process.env.REACT_APP_USE_MOCK_API === 'true';
    this.mockApiUrl = process.env.REACT_APP_MOCK_API_URL || 'http://localhost:8000';
    
    // Initialize appropriate client
    this.supabase = createClient(apiUrl, apiKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      },
      global: {
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    });
    
    console.log(`API Service initialized: ${this.mockMode ? 'Mock Mode' : 'Supabase Mode'}`);
  }

  /**
   * Health check to verify backend connectivity
   */
  async healthCheck(): Promise<ApiResponse<boolean>> {
    try {
      if (this.mockMode) {
        // Use fetch for mock server
        const response = await fetch(`${this.mockApiUrl}/queues?_limit=1`);
        return {
          data: response.ok,
          error: response.ok ? null : 'Mock server health check failed'
        };
      } else {
        // Use Supabase for production
        const { data, error } = await this.supabase
          .from('queues')
          .select('id')
          .limit(1);
        
        return {
          data: !error,
          error: error ? error.message : null
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: `Health check failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Create a new queue
   */
  async createQueue(name: string): Promise<ApiResponse<{ queueId: string; adminSecret: string }>> {
    try {
      if (this.mockMode) {
        // Generate UUID and admin secret for mock mode
        const queueId = crypto.randomUUID();
        const adminSecret = Math.random().toString(36).substring(2, 15);
        
        const queue = {
          id: queueId,
          name,
          admin_secret: adminSecret,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        };
        
        const response = await fetch(`${this.mockApiUrl}/queues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(queue)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create queue');
        }
        
        return {
          data: { queueId, adminSecret },
          error: null
        };
      } else {
        // Generate admin secret - this would typically be done by the server
        // but for this example we'll do it client-side
        const adminSecret = Math.random().toString(36).substring(2, 15);
        
        const { data, error } = await this.supabase
          .from('queues')
          .insert([
            { 
              name, 
              admin_secret: adminSecret,
              status: 'active'
            }
          ])
          .select('id')
          .single();
        
        if (error) {
          throw error;
        }
        
        return {
          data: { queueId: data.id, adminSecret },
          error: null
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: `Failed to create queue: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Get queue by ID
   */
  async getQueueById(queueId: string): Promise<ApiResponse<Queue>> {
    try {
      if (this.mockMode) {
        const response = await fetch(`${this.mockApiUrl}/queues/${queueId}`);
        
        if (!response.ok) {
          throw new Error('Queue not found');
        }
        
        const queue = await response.json();
        return {
          data: queue,
          error: null
        };
      } else {
        const { data, error } = await this.supabase
          .from('queues')
          .select('*')
          .eq('id', queueId)
          .single();
        
        if (error) {
          throw error;
        }
        
        return {
          data: data as Queue,
          error: null
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: `Failed to get queue: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Get all tickets for a queue
   */
  async getQueueTickets(queueId: string): Promise<ApiResponse<Ticket[]>> {
    try {
      if (this.mockMode) {
        const response = await fetch(`${this.mockApiUrl}/tickets?queue_id=${queueId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get tickets');
        }
        
        const tickets = await response.json();
        return {
          data: tickets,
          error: null
        };
      } else {
        const { data, error } = await this.supabase
          .from('tickets')
          .select('*')
          .eq('queue_id', queueId)
          .order('created_at', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        return {
          data: data as Ticket[],
          error: null
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: `Failed to get tickets: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Join a queue (create a ticket)
   */
  async joinQueue(queueId: string, name: string): Promise<ApiResponse<Ticket>> {
    try {
      if (this.mockMode) {
        // Get existing tickets to determine ticket number
        const response = await fetch(`${this.mockApiUrl}/tickets?queue_id=${queueId}`);
        if (!response.ok) {
          throw new Error('Failed to get tickets');
        }
        
        const tickets = await response.json();
        const ticketNumber = tickets.length > 0 
          ? Math.max(...tickets.map((t: Ticket) => t.ticket_number)) + 1 
          : 1;
          
        const newTicket = {
          id: crypto.randomUUID(),
          queue_id: queueId,
          name,
          ticket_number: ticketNumber,
          status: 'waiting',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const createResponse = await fetch(`${this.mockApiUrl}/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTicket)
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create ticket');
        }
        
        const ticket = await createResponse.json();
        return {
          data: ticket,
          error: null
        };
      } else {
        const { data, error } = await this.supabase
          .from('tickets')
          .insert([
            { 
              queue_id: queueId, 
              name,
              status: 'waiting'
            }
          ])
          .select('*')
          .single();
        
        if (error) {
          throw error;
        }
        
        return {
          data: data as Ticket,
          error: null
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: `Failed to join queue: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Call next ticket (change status from waiting to serving)
   */
  async callNext(queueId: string, adminSecret: string): Promise<ApiResponse<boolean>> {
    try {
      // First verify admin access
      const verifyResult = await this.verifyAdmin(queueId, adminSecret);
      if (verifyResult.error) {
        throw new Error(verifyResult.error);
      }
      
      if (this.mockMode) {
        // Get waiting tickets
        const response = await fetch(`${this.mockApiUrl}/tickets?queue_id=${queueId}&status=waiting&_sort=ticket_number&_order=asc&_limit=1`);
        if (!response.ok) {
          throw new Error('Failed to get tickets');
        }
        
        const tickets = await response.json();
        if (tickets.length === 0) {
          return {
            data: false,
            error: 'No waiting tickets'
          };
        }
        
        // Update ticket status
        const ticket = tickets[0];
        const updateResponse = await fetch(`${this.mockApiUrl}/tickets/${ticket.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'serving',
            updated_at: new Date().toISOString()
          })
        });
        
        if (!updateResponse.ok) {
          throw new Error('Failed to update ticket');
        }
        
        return {
          data: true,
          error: null
        };
      } else {
        // Get next waiting ticket
        const { data: tickets, error: ticketsError } = await this.supabase
          .from('tickets')
          .select('*')
          .eq('queue_id', queueId)
          .eq('status', 'waiting')
          .order('ticket_number', { ascending: true })
          .limit(1);
        
        if (ticketsError) {
          throw ticketsError;
        }
        
        if (!tickets || tickets.length === 0) {
          return {
            data: false,
            error: 'No waiting tickets'
          };
        }
        
        // Update ticket status
        const { error: updateError } = await this.supabase
          .from('tickets')
          .update({ 
            status: 'serving',
            updated_at: new Date().toISOString()
          })
          .eq('id', tickets[0].id);
        
        if (updateError) {
          throw updateError;
        }
        
        return {
          data: true,
          error: null
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: `Failed to call next: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Verify admin access
   */
  async verifyAdmin(queueId: string, adminSecret: string): Promise<ApiResponse<Queue>> {
    try {
      if (this.mockMode) {
        const response = await fetch(`${this.mockApiUrl}/queues/${queueId}`);
        
        if (!response.ok) {
          throw new Error('Queue not found');
        }
        
        const queue = await response.json();
        if (queue.admin_secret !== adminSecret) {
          throw new Error('Invalid admin secret');
        }
        
        return {
          data: queue,
          error: null
        };
      } else {
        const { data, error } = await this.supabase
          .from('queues')
          .select('*')
          .eq('id', queueId)
          .eq('admin_secret', adminSecret)
          .single();
        
        if (error) {
          throw new Error('Invalid admin credentials');
        }
        
        return {
          data: data as Queue,
          error: null
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: `Admin verification failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Setup realtime listener for queue changes
   */
  setupQueueListener(queueId: string, onTicketsChange: () => void): { unsubscribe: () => void } {
    if (this.mockMode) {
      // Mock polling for changes every 5 seconds
      const interval = setInterval(async () => {
        console.log('Polling for changes in mock mode');
        onTicketsChange();
      }, 5000);
      
      return {
        unsubscribe: () => clearInterval(interval)
      };
    } else {
      // Use Supabase realtime subscription
      const subscription = this.supabase
        .channel(`queue-${queueId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tickets',
          filter: `queue_id=eq.${queueId}`
        }, () => {
          console.log('Realtime update received');
          onTicketsChange();
        })
        .subscribe();
      
      return {
        unsubscribe: () => {
          this.supabase.removeChannel(subscription);
        }
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Re-export for testing/mocking
export default ApiService; 