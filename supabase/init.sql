-- Queue Rooms table: Stores info about each queue room
CREATE TABLE IF NOT EXISTS public.queue_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_id UUID,
  admin_token TEXT NOT NULL UNIQUE,
  visitor_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Queue Items table: Stores individual queue entries
CREATE TABLE IF NOT EXISTS public.queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_room_id UUID NOT NULL REFERENCES public.queue_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'serving', 'served', 'skipped')),
  ticket_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_method TEXT, -- 'none', 'browser', 'sms', etc.
  contact_info TEXT -- For SMS notification (future feature)
);

-- Queue Statistics table: Stores stats for each queue room
CREATE TABLE IF NOT EXISTS public.queue_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_room_id UUID NOT NULL REFERENCES public.queue_rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_served INTEGER NOT NULL DEFAULT 0,
  total_skipped INTEGER NOT NULL DEFAULT 0,
  avg_wait_time INTERVAL,
  peak_queue_length INTEGER NOT NULL DEFAULT 0
);

-- Functions for queue management
CREATE OR REPLACE FUNCTION public.next_ticket_number(queue_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1 INTO next_number
  FROM public.queue_items
  WHERE queue_items.queue_room_id = $1;
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (works even without RLS for local development)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 