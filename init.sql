CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

-- Create test table
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample data
INSERT INTO public.queues (name) VALUES ('Default Queue') ON CONFLICT DO NOTHING;

-- Setup permissions
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON public.queues FOR SELECT USING (true);
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.queues TO anon; 