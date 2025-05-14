import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Generate a random token for admin or visitor access
export const generateToken = () => {
  return uuidv4().replace(/-/g, '');
};

// Create a new queue room
export const createQueueRoom = async (name, description) => {
  const adminToken = generateToken();
  const visitorToken = generateToken();
  
  const { data, error } = await supabase
    .from('queue_rooms')
    .insert({
      name,
      description,
      admin_token: adminToken,
      visitor_token: visitorToken
    })
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return {
    ...data,
    adminUrl: `${window.location.origin}/admin/${data.id}?token=${adminToken}`,
    visitorUrl: `${window.location.origin}/join/${data.id}?token=${visitorToken}`
  };
};

// Get a queue room by ID
export const getQueueRoom = async (roomId, token) => {
  const { data, error } = await supabase
    .from('queue_rooms')
    .select('*')
    .eq('id', roomId)
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
};

// Get all queue items for a room
export const getQueueItems = async (roomId) => {
  const { data, error } = await supabase
    .from('queue_items')
    .select('*')
    .eq('queue_room_id', roomId)
    .order('ticket_number', { ascending: true });
    
  if (error) {
    throw error;
  }
  
  return data;
};

// Add a person to the queue
export const joinQueue = async (roomId, name) => {
  // Get the next ticket number
  const { data: ticketNumber, error: ticketError } = await supabase
    .rpc('next_ticket_number', { queue_room_id: roomId });
    
  if (ticketError) {
    throw ticketError;
  }
  
  // Create the queue item
  const { data, error } = await supabase
    .from('queue_items')
    .insert({
      queue_room_id: roomId,
      name,
      ticket_number: ticketNumber,
      status: 'waiting'
    })
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
};

// Update the status of a queue item
export const updateQueueItemStatus = async (itemId, status) => {
  const updateData = { status };
  
  // Add timestamps based on status
  if (status === 'serving') {
    updateData.served_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'no_show') {
    updateData.completed_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('queue_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
};

// Get a person's position in the queue
export const getQueuePosition = async (roomId, ticketNumber) => {
  const { data, error } = await supabase
    .from('queue_items')
    .select('ticket_number')
    .eq('queue_room_id', roomId)
    .eq('status', 'waiting')
    .order('ticket_number', { ascending: true });
    
  if (error) {
    throw error;
  }
  
  const position = data.findIndex(item => item.ticket_number === ticketNumber) + 1;
  return position > 0 ? position : null;
}; 