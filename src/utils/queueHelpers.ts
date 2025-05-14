import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { BASE_URL } from '../config';
import { 
  QueueRoom, 
  QueueItem, 
  QueueItemStatus, 
  CreateQueueFormData, 
  QueueRoomResponse 
} from '../types/models';

/**
 * Generate a secure random token for room access
 * @returns A random UUID token
 */
export const generateToken = (): string => {
  return uuidv4();
};

/**
 * Create a new queue room
 * @param nameOrData Queue room name or data object with name and description
 * @param description Queue room description (optional if first parameter is an object)
 * @returns The created room data with admin and visitor URLs
 */
export const createQueueRoom = async (
  nameOrData: string | CreateQueueFormData, 
  description?: string
): Promise<QueueRoomResponse> => {
  try {
    const adminToken = generateToken();
    const visitorToken = generateToken();
    
    const name = typeof nameOrData === 'string' ? nameOrData : nameOrData.name;
    const desc = typeof nameOrData === 'string' ? description || null : nameOrData.description || null;
    
    // Create new queue room in database
    const { data: roomData, error } = await supabase
      .from('queue_rooms')
      .insert({
        name: name,
        description: desc,
        status: 'active',
        admin_token: adminToken,
        visitor_token: visitorToken
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to create queue: ${error.message}`);
    }
    
    if (!roomData) throw new Error('Failed to create queue room: No data returned');
    
    // Generate URLs for admin and visitor access
    const baseUrl = window.location.origin;
    const adminUrl = `${baseUrl}/admin/${roomData.id}?token=${adminToken}`;
    const visitorUrl = `${baseUrl}/join/${roomData.id}?token=${visitorToken}`;
    
    return { 
      ...roomData,
      adminUrl, 
      visitorUrl 
    };
  } catch (error: any) {
    console.error('Error creating queue room:', error);
    throw error;
  }
};

/**
 * Get a queue room by ID
 * @param roomId The queue room ID
 * @returns The queue room data
 */
export const getQueueRoom = async (roomId: string): Promise<QueueRoom> => {
  try {
    const { data, error } = await supabase
      .from('queue_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Queue room not found');
    
    return data as QueueRoom;
  } catch (error) {
    console.error('Error getting queue room:', error);
    throw error;
  }
};

/**
 * Get all queue items for a specific room
 * @param roomId The queue room ID
 * @returns Array of queue items
 */
export const getQueueItems = async (roomId: string): Promise<QueueItem[]> => {
  try {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('queue_room_id', roomId)
      .order('ticket_number', { ascending: true });
    
    if (error) throw error;
    
    return data as QueueItem[] || [];
  } catch (error) {
    console.error('Error getting queue items:', error);
    throw error;
  }
};

/**
 * Add a person to the queue
 * @param roomId The queue room ID
 * @param name The person's name
 * @returns The created queue item
 */
export const joinQueue = async (roomId: string, name: string): Promise<QueueItem> => {
  try {
    // Get the next available ticket number
    const { data: maxTicket } = await supabase
      .from('queue_items')
      .select('ticket_number')
      .eq('queue_room_id', roomId)
      .order('ticket_number', { ascending: false })
      .limit(1)
      .single();
    
    const nextTicket = maxTicket ? maxTicket.ticket_number + 1 : 1;
    
    // Add the new person to the queue
    const { data: newItem, error } = await supabase
      .from('queue_items')
      .insert({
        queue_room_id: roomId,
        name: name,
        ticket_number: nextTicket,
        status: 'waiting'
      })
      .select()
      .single();
    
    if (error) throw error;
    if (!newItem) throw new Error('Failed to join queue');
    
    return newItem as QueueItem;
  } catch (error) {
    console.error('Error joining queue:', error);
    throw error;
  }
};

/**
 * Update the status of a queue item
 * @param itemId The queue item ID
 * @param status The new status
 * @returns The updated queue item
 */
export const updateQueueItemStatus = async (itemId: string, status: QueueItemStatus): Promise<QueueItem> => {
  try {
    // Prepare update data with timestamp for status change
    const updateData: Partial<QueueItem> = { status };
    
    // Add appropriate timestamp based on the status
    if (status === 'serving') {
      updateData.serving_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'no_show') {
      updateData.completed_at = new Date().toISOString();
    }
    
    // Update the item
    const { data: updatedItem, error } = await supabase
      .from('queue_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) throw error;
    if (!updatedItem) throw new Error('Failed to update queue item');
    
    return updatedItem as QueueItem;
  } catch (error) {
    console.error('Error updating queue item status:', error);
    throw error;
  }
};

/**
 * Get a person's position in the queue
 * @param roomId The queue room ID
 * @param ticketNumber The person's ticket number
 * @returns The position in the queue (1-indexed)
 */
export const getQueuePosition = async (roomId: string, ticketNumber: number): Promise<number> => {
  try {
    // Get all waiting items with lower ticket numbers
    const { data, error } = await supabase
      .from('queue_items')
      .select('ticket_number')
      .eq('queue_room_id', roomId)
      .eq('status', 'waiting')
      .lt('ticket_number', ticketNumber)
      .order('ticket_number', { ascending: true });
    
    if (error) throw error;
    
    // Position is the count of items with lower ticket numbers plus 1
    return (data?.length || 0) + 1;
  } catch (error) {
    console.error('Error getting queue position:', error);
    throw error;
  }
}; 