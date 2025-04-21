-- Fix authentication and permissions for Supabase

-- Make sure the anonymous role has appropriate permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Make sure service role has full permissions
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute permission on the ticket number generator function
GRANT EXECUTE ON FUNCTION public.generate_ticket_number() TO anon;
GRANT EXECUTE ON FUNCTION public.generate_ticket_number() TO service_role;

-- Disable RLS for service_role to allow admin operations
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create or replace policies with more explicit permissions
DROP POLICY IF EXISTS "Public queues are viewable by everyone" ON public.queues;
CREATE POLICY "Public queues are viewable by everyone" 
    ON public.queues FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Queues can be inserted by anyone" ON public.queues;
CREATE POLICY "Queues can be inserted by anyone" 
    ON public.queues FOR INSERT 
    WITH CHECK (true);
    
DROP POLICY IF EXISTS "Queues can be updated by admin" ON public.queues;
CREATE POLICY "Queues can be updated by admin" 
    ON public.queues FOR UPDATE 
    USING (true);
    
DROP POLICY IF EXISTS "Tickets are viewable by everyone" ON public.tickets;
CREATE POLICY "Tickets are viewable by everyone" 
    ON public.tickets FOR SELECT 
    USING (true);
    
DROP POLICY IF EXISTS "Tickets can be inserted by anyone" ON public.tickets;
CREATE POLICY "Tickets can be inserted by anyone" 
    ON public.tickets FOR INSERT 
    WITH CHECK (true);
    
DROP POLICY IF EXISTS "Tickets can be updated" ON public.tickets;
CREATE POLICY "Tickets can be updated" 
    ON public.tickets FOR UPDATE 
    USING (true);
    
-- Make sure service role bypasses RLS
ALTER TABLE public.queues FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
ALTER TABLE public.queues DISABLE ROW LEVEL SECURITY FOR service_role;
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY FOR service_role; 