-- Create tables for the queue management system

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "anon.role" TO 'anon';
ALTER DATABASE postgres SET "service_role.role" TO 'service_role';

-- Create queues table
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    admin_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'archived'))
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY,
    queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ticket_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'served', 'skipped', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS tickets_queue_id_idx ON public.tickets (queue_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON public.tickets (status);
CREATE INDEX IF NOT EXISTS queues_status_idx ON public.queues (status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for queues
CREATE POLICY "Public queues are viewable by everyone" 
    ON public.queues FOR SELECT 
    USING (true);

CREATE POLICY "Queues can be inserted by anyone" 
    ON public.queues FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Queues can be updated by admin" 
    ON public.queues FOR UPDATE 
    USING (true);

-- Create policies for tickets
CREATE POLICY "Tickets are viewable by everyone" 
    ON public.tickets FOR SELECT 
    USING (true);

CREATE POLICY "Tickets can be inserted by anyone" 
    ON public.tickets FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Tickets can be updated" 
    ON public.tickets FOR UPDATE 
    USING (true);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    last_number INTEGER;
BEGIN
    -- Get the last ticket number for this queue
    SELECT COALESCE(MAX(ticket_number), 0) INTO last_number
    FROM public.tickets
    WHERE queue_id = NEW.queue_id;
    
    -- Set the new ticket number
    NEW.ticket_number := last_number + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign ticket numbers
CREATE TRIGGER set_ticket_number
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_number(); 