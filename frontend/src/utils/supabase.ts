import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Queue management functions
export const createQueueRoom = async (name: string, description: string) => {
  const adminToken = generateRandomToken();
  const visitorToken = generateRandomToken();
  
  const { data, error } = await supabase.from('queue_rooms').insert({
    name,
    description,
    admin_token: adminToken,
    visitor_token: visitorToken,
    admin_id: (await supabase.auth.getUser()).data.user?.id
  }).select();
  
  return { data, error };
};

export const joinQueue = async (queueRoomId: string, name: string) => {
  // Get next ticket number
  const { data: nextTicketData } = await supabase.rpc('next_ticket_number', {
    queue_room_id: queueRoomId
  });
  
  const ticketNumber = nextTicketData || 1;
  
  const { data, error } = await supabase.from('queue_items').insert({
    queue_room_id: queueRoomId,
    name,
    status: 'waiting',
    ticket_number: ticketNumber
  }).select();
  
  return { data, error };
};

export const getQueuePosition = async (queueItemId: string, queueRoomId: string) => {
  // Get position in queue (how many people are ahead)
  const { data, error } = await supabase
    .from('queue_items')
    .select('ticket_number')
    .eq('queue_room_id', queueRoomId)
    .eq('status', 'waiting')
    .order('ticket_number', { ascending: true });
    
  if (error || !data) return { position: 0, error };
  
  // Find position of current item
  const myItem = await supabase
    .from('queue_items')
    .select('ticket_number')
    .eq('id', queueItemId)
    .single();
    
  if (!myItem.data) return { position: 0, error: myItem.error };
  
  const position = data.findIndex(item => item.ticket_number === myItem.data.ticket_number) + 1;
  return { position, error: null };
};

export const callNext = async (queueRoomId: string) => {
  // Get the next waiting customer
  const { data: nextInLine } = await supabase
    .from('queue_items')
    .select('*')
    .eq('queue_room_id', queueRoomId)
    .eq('status', 'waiting')
    .order('ticket_number', { ascending: true })
    .limit(1)
    .single();
    
  if (!nextInLine) return { data: null, error: 'No one in queue' };
  
  // Update their status to serving
  const { data, error } = await supabase
    .from('queue_items')
    .update({ status: 'serving' })
    .eq('id', nextInLine.id)
    .select();
    
  return { data, error };
};

// Helper function to generate random tokens
const generateRandomToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}; 