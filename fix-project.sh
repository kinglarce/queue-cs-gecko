#!/bin/bash

echo "==== Fixing Queue CS Gecko System Project ===="

# Stop all services first
echo "Stopping all running services..."
docker-compose down

# Remove unused volumes
echo "Removing volumes for a clean start..."
docker volume rm queue_pg_data || true

# Fix database configuration
echo "Creating correct database initialization SQL..."
cat > supabase/init-fixed.sql << EOL
-- Create tables for the queue management system
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles if they don't exist
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
\$\$;

-- Create queues table
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    admin_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'archived'))
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Grant access to roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE ON public.queues, public.tickets TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public queues are viewable by everyone" 
    ON public.queues FOR SELECT 
    USING (true);

CREATE POLICY "Queues can be inserted by anyone" 
    ON public.queues FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Queues can be updated by anyone" 
    ON public.queues FOR UPDATE 
    USING (true);

CREATE POLICY "Tickets are viewable by everyone" 
    ON public.tickets FOR SELECT 
    USING (true);

CREATE POLICY "Tickets can be inserted by anyone" 
    ON public.tickets FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Tickets can be updated by anyone" 
    ON public.tickets FOR UPDATE 
    USING (true);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS \$\$
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
\$\$ LANGUAGE plpgsql;

-- Create trigger to automatically assign ticket numbers
DROP TRIGGER IF EXISTS set_ticket_number ON public.tickets;

CREATE TRIGGER set_ticket_number
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_number();
EOL

# Update init.sql with our fixed version
echo "Updating init.sql file..."
cp supabase/init-fixed.sql supabase/init.sql

# Create a more robust postgres config file
echo "Creating optimized postgres.conf file..."
cat > supabase/postgres.conf << EOL
# PostgreSQL configuration file for Supabase

# Write-Ahead Log settings
wal_level = logical
max_wal_senders = 10
max_replication_slots = 10

# Connection settings
listen_addresses = '*'
max_connections = 100

# Performance settings
shared_buffers = 128MB
work_mem = 16MB
maintenance_work_mem = 64MB

# Security settings
password_encryption = md5
EOL

# Create setup script for frontend
echo "Creating setup script for frontend container..."
cat > frontend/setup.sh << EOL
#!/bin/bash

echo "=== Installing Required Dependencies ==="

# Install dependencies with legacy peer deps flag
npm install --legacy-peer-deps --save @hookform/resolvers zod class-variance-authority

# Touch files to trigger recompilation
touch src/components/ContactForm.tsx
touch src/components/JoinQueueForm.tsx
touch src/components/LoginForm.tsx

echo "Setup complete! All dependencies installed."
EOL

chmod +x frontend/setup.sh

# Remove unnecessary files
echo "Cleaning up unnecessary files..."
rm -f supabase/init-fixed.sql
rm -f db.json
rm -f fix-project.sh
rm -f fix-dependencies.sh
rm -f supabase/init-correct.sql

# Start the services
echo "Starting PostgreSQL..."
docker-compose up -d postgres

echo "Waiting for PostgreSQL to start up (30 seconds)..."
sleep 30

echo "Starting Supabase..."
docker-compose up -d supabase

echo "Waiting for Supabase to initialize (30 seconds)..."
sleep 30

# Run our setup script inside the frontend container
echo "Starting frontend and running setup script..."
docker-compose up -d frontend
docker-compose exec frontend sh -c "chmod +x /app/setup.sh && /app/setup.sh"

# Start Nginx
echo "Starting Nginx..."
docker-compose up -d nginx

echo "==== Setup Complete! ===="
echo "Your application should now be accessible at:"
echo "- Frontend: http://localhost:80"
echo "- Supabase Studio: http://localhost:9000"
echo ""
echo "If you still have issues, run: docker-compose logs [service_name]" 