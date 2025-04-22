import { useState, useEffect, useCallback } from 'react';
import { Queue, Ticket } from '../types';
import { apiService } from '../services/api';

/**
 * Hook to manage queue data and operations
 */
export function useQueue(queueId: string | undefined) {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeListener, setActiveListener] = useState<{ unsubscribe: () => void } | null>(null);

  // Calculate derived values
  const waitingTickets = tickets.filter(ticket => ticket.status === 'waiting');
  const servingTickets = tickets.filter(ticket => ticket.status === 'serving');
  const servedTickets = tickets.filter(ticket => ticket.status === 'served');
  const skippedTickets = tickets.filter(ticket => ticket.status === 'skipped');
  
  // Get the ticket currently being served
  const nowServing = servingTickets.length > 0 ? servingTickets[0] : null;
  
  // Count of waiting tickets
  const waitingCount = waitingTickets.length;
  
  // Default average wait time per person (in minutes)
  const defaultWaitTime = Number(process.env.REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON) || 3;

  /**
   * Load queue and tickets
   */
  const loadQueueData = useCallback(async () => {
    if (!queueId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load queue details
      const queueResult = await apiService.getQueueById(queueId);
      if (queueResult.error) {
        throw new Error(queueResult.error);
      }
      
      setQueue(queueResult.data);
      
      // Load tickets
      const ticketsResult = await apiService.getQueueTickets(queueId);
      if (ticketsResult.error) {
        throw new Error(ticketsResult.error);
      }
      
      setTickets(ticketsResult.data || []);
    } catch (err: any) {
      console.error('Error loading queue data:', err);
      setError(err.message || 'Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  }, [queueId]);

  /**
   * Setup realtime listener for queue changes
   */
  const setupListener = useCallback(() => {
    if (!queueId) return;
    
    // Clean up any existing listener
    if (activeListener) {
      activeListener.unsubscribe();
    }
    
    // Setup new listener
    const listener = apiService.setupQueueListener(queueId, () => {
      // Reload queue data when changes are detected
      loadQueueData();
    });
    
    setActiveListener(listener);
    
    return () => {
      if (listener) {
        listener.unsubscribe();
      }
    };
  }, [queueId, loadQueueData, activeListener]);

  /**
   * Join queue (create a ticket)
   */
  const joinQueue = useCallback(async (name: string): Promise<Ticket | null> => {
    if (!queueId) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.joinQueue(queueId, name);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Reload queue data to get updated tickets
      await loadQueueData();
      
      return result.data;
    } catch (err: any) {
      console.error('Error joining queue:', err);
      setError(err.message || 'Failed to join queue');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [queueId, loadQueueData]);

  /**
   * Call next ticket (requires admin authentication)
   */
  const callNext = useCallback(async (adminSecret: string): Promise<boolean> => {
    if (!queueId) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.callNext(queueId, adminSecret);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Reload queue data to get updated tickets
      await loadQueueData();
      
      return result.data || false;
    } catch (err: any) {
      console.error('Error calling next:', err);
      setError(err.message || 'Failed to call next ticket');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [queueId, loadQueueData]);

  /**
   * Get ticket position in queue
   */
  const getTicketPosition = useCallback((ticketId: string): number => {
    const waitingTickets = tickets
      .filter(ticket => ticket.status === 'waiting')
      .sort((a, b) => a.ticket_number - b.ticket_number);
    
    const index = waitingTickets.findIndex(ticket => ticket.id === ticketId);
    return index === -1 ? -1 : index + 1;
  }, [tickets]);

  /**
   * Calculate estimated wait time
   */
  const calculateWaitTime = useCallback((position: number): number => {
    return position * defaultWaitTime;
  }, [defaultWaitTime]);
  
  /**
   * Clean up listener on unmount
   */
  const cleanupListener = useCallback(() => {
    if (activeListener) {
      activeListener.unsubscribe();
      setActiveListener(null);
    }
  }, [activeListener]);

  // Load queue data on mount or when queueId changes
  useEffect(() => {
    if (queueId) {
      loadQueueData();
    }
  }, [queueId, loadQueueData]);

  // Setup listener on mount or when queueId changes
  useEffect(() => {
    if (queueId) {
      const cleanup = setupListener();
      return cleanup;
    }
  }, [queueId, setupListener]);

  return {
    // State
    queue,
    tickets,
    isLoading,
    error,
    
    // Derived state
    waitingTickets,
    servingTickets,
    servedTickets,
    skippedTickets,
    nowServing,
    waitingCount,
    
    // Actions
    loadQueueData,
    joinQueue,
    callNext,
    getTicketPosition,
    calculateWaitTime,
    cleanupListener
  };
}

/**
 * Hook for creating a new queue
 */
export function useCreateQueue() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createQueue = async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.createQueue(name);
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    } catch (err: any) {
      console.error('Error creating queue:', err);
      setError(err.message || 'Failed to create queue');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    createQueue,
    isLoading,
    error
  };
}

/**
 * Hook for admin authentication
 */
export function useAdminAuth(queueId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const verifyAdmin = async (adminSecret: string) => {
    if (!queueId) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.verifyAdmin(queueId, adminSecret);
      const isValid = !!result.data && !result.error;
      
      setIsAdmin(isValid);
      return isValid;
    } catch (err: any) {
      console.error('Error verifying admin:', err);
      setError(err.message || 'Failed to verify admin credentials');
      setIsAdmin(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isAdmin,
    verifyAdmin,
    isLoading,
    error
  };
} 