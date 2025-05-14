-- HYROX Queue System - Complete Deployment SQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create or update queue_rooms table with proper structure
CREATE TABLE IF NOT EXISTS public.queue_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  admin_token TEXT NOT NULL UNIQUE,
  visitor_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or update queue_items table with proper structure
CREATE TABLE IF NOT EXISTS public.queue_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_room_id UUID NOT NULL REFERENCES public.queue_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ticket_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'no_show')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create function to get next ticket number
CREATE OR REPLACE FUNCTION public.next_ticket_number(queue_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
  max_ticket INTEGER;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) INTO max_ticket
  FROM queue_items
  WHERE queue_items.queue_room_id = $1;
  
  RETURN max_ticket + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to help with token usage
CREATE OR REPLACE FUNCTION set_claim(claim TEXT, value TEXT)
RETURNS TEXT AS $$
BEGIN
  PERFORM set_config('request.headers.' || claim, value, true);
  RETURN 'claim set'; -- For backward compatibility
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure RLS is enabled
ALTER TABLE public.queue_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon user
GRANT ALL ON public.queue_rooms TO anon;
GRANT ALL ON public.queue_items TO anon;
GRANT EXECUTE ON FUNCTION public.next_ticket_number TO anon;
GRANT EXECUTE ON FUNCTION public.set_claim TO anon;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can create queue rooms" ON public.queue_rooms;
DROP POLICY IF EXISTS "Public access to queue rooms" ON public.queue_rooms;
DROP POLICY IF EXISTS "Anyone can join a queue" ON public.queue_items;
DROP POLICY IF EXISTS "Anyone can view queue items" ON public.queue_items;
DROP POLICY IF EXISTS "Admin token can update queue rooms" ON public.queue_rooms;
DROP POLICY IF EXISTS "Admin token can manage queue items" ON public.queue_items;

-- Create insertion policies
CREATE POLICY "Anyone can create queue rooms"
  ON public.queue_rooms FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public access to queue rooms"
  ON public.queue_rooms FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Queue item policies
CREATE POLICY "Anyone can join a queue"
  ON public.queue_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view queue items"
  ON public.queue_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin policies using headers
CREATE POLICY "Admin token can update queue rooms"
  ON public.queue_rooms FOR UPDATE
  TO anon, authenticated
  USING (admin_token = current_setting('request.headers.x-admin-token', true));

CREATE POLICY "Admin token can manage queue items"
  ON public.queue_items FOR UPDATE
  TO anon, authenticated
  USING ((SELECT admin_token FROM public.queue_rooms WHERE id = queue_room_id) = 
         current_setting('request.headers.x-admin-token', true));

-- Enable realtime - use Supabase dashboard for this, but this reminds you to do it
COMMENT ON TABLE public.queue_rooms IS 'Enable realtime for this table in Supabase dashboard';
COMMENT ON TABLE public.queue_items IS 'Enable realtime for this table in Supabase dashboard';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS queue_items_queue_room_id_idx ON public.queue_items (queue_room_id);
CREATE INDEX IF NOT EXISTS queue_items_status_idx ON public.queue_items (status); 