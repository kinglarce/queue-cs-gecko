-- Simplified HYROX Customer Support Queue System - Database Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create queue rooms table with minimal fields
CREATE TABLE public.queue_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  admin_token TEXT NOT NULL UNIQUE,
  visitor_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  estimated_wait_time INTEGER,
  admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create queue items table with minimal fields
CREATE TABLE public.queue_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_room_id UUID NOT NULL REFERENCES public.queue_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ticket_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'no_show')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Create simple function to get next ticket number
CREATE OR REPLACE FUNCTION public.next_ticket_number(queue_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) INTO last_number
  FROM public.queue_items
  WHERE queue_items.queue_room_id = $1;
  
  RETURN last_number + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up simple RLS (Row Level Security)
ALTER TABLE public.queue_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_items ENABLE ROW LEVEL SECURITY;

-- Queue room policies
CREATE POLICY "Anyone can create queue rooms"
  ON public.queue_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage their queue rooms"
  ON public.queue_rooms FOR ALL
  USING (admin_token = current_setting('app.admin_token', true));

CREATE POLICY "Visitors can view queue rooms"
  ON public.queue_rooms FOR SELECT
  USING (visitor_token = current_setting('app.visitor_token', true));

-- Queue item policies
CREATE POLICY "Anyone can join a queue"
  ON public.queue_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage queue items"
  ON public.queue_items FOR ALL
  USING ((SELECT admin_token FROM public.queue_rooms WHERE id = queue_room_id) = current_setting('app.admin_token', true));

CREATE POLICY "Visitors can view queue items"
  ON public.queue_items FOR SELECT
  USING ((SELECT visitor_token FROM public.queue_rooms WHERE id = queue_room_id) = current_setting('app.visitor_token', true));

-- Create update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_queue_rooms_updated_at
BEFORE UPDATE ON public.queue_rooms
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Grant permissions to anonymous users (with RLS protection)
GRANT ALL ON public.queue_rooms TO anon;
GRANT ALL ON public.queue_items TO anon;
GRANT EXECUTE ON FUNCTION public.next_ticket_number TO anon; 