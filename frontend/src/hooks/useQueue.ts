import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueueService, TicketService, setupQueueListener } from '@/services/supabase';
import { Ticket, Queue } from '@/types';

/**
 * Custom hook for loading and managing queue data
 */
export function useQueue(queueId: string | undefined) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  
  // Query for fetching queue data
  const queueQuery = useQuery({
    queryKey: ['queue', queueId],
    queryFn: async () => {
      if (!queueId) throw new Error('Queue ID is required');
      const response = await QueueService.getQueueById(queueId);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!queueId,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Query for fetching tickets
  const ticketsQuery = useQuery({
    queryKey: ['tickets', queueId],
    queryFn: async () => {
      if (!queueId) throw new Error('Queue ID is required');
      const response = await TicketService.getQueueTickets(queueId);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!queueId,
    staleTime: 1000 * 10, // 10 seconds
  });
  
  // Derived data
  const isLoading = queueQuery.isLoading || ticketsQuery.isLoading;
  const queue = queueQuery.data;
  const tickets = ticketsQuery.data || [];
  const nowServing = tickets.find(ticket => ticket.status === 'serving') || null;
  const waitingTickets = tickets.filter(ticket => ticket.status === 'waiting').sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const servedTickets = tickets.filter(ticket => ticket.status === 'served').sort(
    (a, b) => new Date(b.completed_at || b.updated_at || b.created_at).getTime() - 
              new Date(a.completed_at || a.updated_at || a.created_at).getTime()
  );
  const skippedTickets = tickets.filter(ticket => ticket.status === 'skipped');
  
  // Set up real-time listener
  useEffect(() => {
    if (!queueId) return;
    
    const listener = setupQueueListener(queueId, () => {
      // Invalidate queries when data changes
      queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
      queryClient.invalidateQueries({ queryKey: ['tickets', queueId] });
    });
    
    return () => {
      listener.unsubscribe();
    };
  }, [queueId, queryClient]);
  
  // Join queue mutation
  const joinQueueMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!queueId) throw new Error('Queue ID is required');
      const response = await TicketService.joinQueue(queueId, name);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', queueId] });
    }
  });
  
  // Call next mutation
  const callNextMutation = useMutation({
    mutationFn: async ({ adminSecret }: { adminSecret: string }) => {
      if (!queueId) throw new Error('Queue ID is required');
      const response = await TicketService.callNext(queueId, adminSecret);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', queueId] });
    }
  });
  
  // Skip ticket mutation
  const skipTicketMutation = useMutation({
    mutationFn: async ({ ticketId, adminSecret }: { ticketId: string; adminSecret: string }) => {
      if (!queueId) throw new Error('Queue ID is required');
      const response = await TicketService.skipTicket(queueId, ticketId, adminSecret);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', queueId] });
    }
  });
  
  // Reset queue mutation
  const resetQueueMutation = useMutation({
    mutationFn: async ({ adminSecret }: { adminSecret: string }) => {
      if (!queueId) throw new Error('Queue ID is required');
      const response = await QueueService.resetQueue(queueId, adminSecret);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', queueId] });
    }
  });
  
  return {
    // Queries
    queue,
    tickets,
    nowServing,
    waitingTickets,
    servedTickets,
    skippedTickets,
    waitingCount: waitingTickets.length,
    
    // Status
    isLoading,
    error: error || queueQuery.error?.message || ticketsQuery.error?.message,
    
    // Mutations
    joinQueue: joinQueueMutation.mutate,
    isJoining: joinQueueMutation.isPending,
    
    callNext: callNextMutation.mutate,
    isCalling: callNextMutation.isPending,
    
    skipTicket: skipTicketMutation.mutate,
    isSkipping: skipTicketMutation.isPending,
    
    resetQueue: resetQueueMutation.mutate,
    isResetting: resetQueueMutation.isPending,
    
    // Helper functions
    getTicketPosition: (ticketId: string) => {
      return waitingTickets.findIndex(t => t.id === ticketId) + 1;
    },
    
    calculateWaitTime: (position: number) => {
      const defaultWaitTime = Number(process.env.REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON) || 3;
      return position <= 0 ? 0 : position * defaultWaitTime;
    }
  };
}

/**
 * Custom hook for creating a new queue
 */
export function useCreateQueue() {
  const queryClient = useQueryClient();
  
  const createQueueMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await QueueService.createQueue(name);
      if (response.error) throw new Error(response.error);
      return response.data;
    }
  });
  
  return {
    createQueue: createQueueMutation.mutate,
    isCreating: createQueueMutation.isPending,
    error: createQueueMutation.error?.message || null,
    data: createQueueMutation.data
  };
}

/**
 * Custom hook for admin authentication
 */
export function useAdminAuth(queueId: string | undefined) {
  const [adminSecret, setAdminSecret] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Check local storage for saved credentials
  useEffect(() => {
    if (!queueId) return;
    
    const savedSecret = localStorage.getItem(`admin_${queueId}`);
    if (savedSecret) {
      setAdminSecret(savedSecret);
      setIsAuthenticated(true);
    }
  }, [queueId]);
  
  // Verify admin credentials
  const verifyAdmin = useMutation({
    mutationFn: async (secret: string) => {
      if (!queueId) throw new Error('Queue ID is required');
      const response = await QueueService.verifyAdmin(queueId, secret);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      if (data && queueId) {
        localStorage.setItem(`admin_${queueId}`, adminSecret);
        setIsAuthenticated(true);
      }
    }
  });
  
  return {
    adminSecret,
    setAdminSecret,
    isAuthenticated,
    verifyAdmin: () => verifyAdmin.mutate(adminSecret),
    isVerifying: verifyAdmin.isPending,
    error: verifyAdmin.error?.message || null,
    logout: () => {
      if (queueId) {
        localStorage.removeItem(`admin_${queueId}`);
      }
      setAdminSecret('');
      setIsAuthenticated(false);
    }
  };
} 