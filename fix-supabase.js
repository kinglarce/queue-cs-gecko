/**
 * Supabase Fix Script
 * 
 * This script helps to diagnose and fix Supabase issues by:
 * 1. Checking if Supabase is running correctly
 * 2. Creating the necessary tables if they don't exist
 * 3. Setting up proper permissions
 * 
 * Run with: node fix-supabase.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

const execPromise = util.promisify(execSync);

// Configuration
const supabaseUrl = 'http://localhost:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.9LMdtDQybMqgw4rYkVz4qVfU7CRo9bctZO-DVODZpkg';
const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

console.log('========= Supabase Fix Tool =========');
console.log('URL:', supabaseUrl);
console.log('Keys:', {
  anon: supabaseAnonKey.substring(0, 15) + '...',
  service: supabaseServiceKey.substring(0, 15) + '...'
});

// ANSI color codes for prettier output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Log with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Function to check if Supabase is accessible
async function checkSupabaseStatus() {
  log('\n📡 Checking Supabase status...', colors.cyan);
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (response.ok) {
      log('✅ Supabase is running and accessible!', colors.green);
      return true;
    } else {
      const text = await response.text();
      log(`❌ Supabase is running but returned status ${response.status}:`, colors.red);
      log(text, colors.yellow);
      return false;
    }
  } catch (error) {
    log('❌ Failed to connect to Supabase:', colors.red);
    log(`${error.message}`, colors.yellow);
    return false;
  }
}

// Function to restart the Docker containers
async function restartContainers() {
  log('\n🔄 Attempting to restart Docker containers...', colors.cyan);
  try {
    log('Stopping containers...', colors.yellow);
    await execPromise('docker-compose down');
    
    log('Starting containers...', colors.yellow);
    await execPromise('docker-compose up -d');
    
    log('✅ Containers restarted successfully!', colors.green);
    
    // Wait for services to initialize
    log('⏳ Waiting 10 seconds for services to initialize...', colors.yellow);
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;
  } catch (error) {
    log('❌ Failed to restart containers:', colors.red);
    log(`${error.message}`, colors.yellow);
    return false;
  }
}

// Function to apply SQL migrations
async function applyMigrations() {
  log('\n📝 Checking for migration files...', colors.cyan);
  
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    log('❌ Migrations directory not found!', colors.red);
    return false;
  }
  
  // Get all SQL files in the migrations directory
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure they're applied in order
    
  if (migrationFiles.length === 0) {
    log('❌ No SQL migration files found!', colors.red);
    log('Creating a local SQL schema file...', colors.yellow);
    
    await createLocalSQLFile();
    return false;
  }
  
  log(`Found ${migrationFiles.length} migration files.`, colors.blue);
  
  // Apply each migration
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    log(`Applying migration: ${file}...`, colors.yellow);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Use the Supabase REST API to run the SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      });
      
      if (response.ok) {
        log(`✅ Migration ${file} applied successfully!`, colors.green);
      } else {
        const errorText = await response.text();
        log(`❌ Failed to apply migration ${file}:`, colors.red);
        log(errorText, colors.yellow);
        return false;
      }
    } catch (error) {
      log(`❌ Error applying migration ${file}:`, colors.red);
      log(`${error.message}`, colors.yellow);
      return false;
    }
  }
  
  log('✅ All migrations applied successfully!', colors.green);
  return true;
}

// Function to test creating a queue
async function testCreateQueue() {
  log('\n🧪 Testing queue creation...', colors.cyan);
  
  const testQueue = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Queue',
    admin_secret: '00000000-0000-0000-0000-000000000002',
    created_at: new Date().toISOString(),
    status: 'active'
  };
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/queues`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testQueue)
    });
    
    if (response.ok) {
      log('✅ Queue creation test passed!', colors.green);
      
      // Clean up the test queue
      log('Cleaning up test queue...', colors.yellow);
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/queues?id=eq.${testQueue.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Admin-Secret': testQueue.admin_secret
        }
      });
      
      if (deleteResponse.ok) {
        log('✅ Test queue cleaned up successfully!', colors.green);
      } else {
        log('⚠️ Could not clean up test queue. Manual cleanup may be required.', colors.yellow);
      }
      
      return true;
    } else {
      const errorText = await response.text();
      log('❌ Queue creation test failed:', colors.red);
      log(errorText, colors.yellow);
      return false;
    }
  } catch (error) {
    log('❌ Queue creation test failed:', colors.red);
    log(`${error.message}`, colors.yellow);
    return false;
  }
}

// Function to create a local SQL file with the schema
async function createLocalSQLFile() {
  // Create migrations directory if it doesn't exist
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const filePath = path.join(migrationsDir, `${timestamp}_initial_schema.sql`);
  
  const sql = `
-- Create queues table
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    admin_secret UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'paused', 'closed'))
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY,
    queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'called', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    called_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Set up RLS policies
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to queues
CREATE POLICY "Allow anonymous read access to queues"
  ON public.queues FOR SELECT
  USING (true);

-- Allow queue creation by anyone
CREATE POLICY "Allow queue creation by anyone"
  ON public.queues FOR INSERT
  WITH CHECK (true);

-- Allow update only with admin_secret
CREATE POLICY "Allow update with admin_secret"
  ON public.queues FOR UPDATE
  USING (admin_secret = current_setting('app.admin_secret', true)::uuid);

-- Allow anonymous read access to tickets
CREATE POLICY "Allow anonymous read access to tickets"
  ON public.tickets FOR SELECT
  USING (true);

-- Allow ticket creation by anyone
CREATE POLICY "Allow ticket creation by anyone"
  ON public.tickets FOR INSERT
  WITH CHECK (true);

-- Create function to set app.admin_secret from request header
CREATE OR REPLACE FUNCTION public.set_admin_secret()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.admin_secret', 
    nullif(current_setting('request.headers', true)::json->>'admin-secret', ''), 
    true);
END;
$$;

-- Add REST API trigger to set admin_secret
CREATE OR REPLACE FUNCTION public.rest_admin_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.set_admin_secret();
  RETURN NEW;
END;
$$;

-- Add trigger to queues table
DROP TRIGGER IF EXISTS before_rest_queues ON public.queues;
CREATE TRIGGER before_rest_queues
  BEFORE UPDATE OR DELETE ON public.queues
  FOR EACH ROW EXECUTE FUNCTION public.rest_admin_secret();

-- Allow queue administrators to manage tickets
CREATE POLICY "Allow admin to update tickets"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.queues 
      WHERE queues.id = tickets.queue_id
      AND queues.admin_secret = current_setting('app.admin_secret', true)::uuid
    )
  );

-- Add UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `;
  
  fs.writeFileSync(filePath, sql);
  
  log(`✅ Created initial schema file: ${filePath}`, colors.green);
  log('Please run this script again to apply the migration.', colors.magenta);
  
  return true;
}

// Main function to execute all the fixes
async function main() {
  log('🔧 HYROX Queue Supabase Diagnostic Tool 🔧', colors.cyan);
  log('==========================================', colors.cyan);
  
  // Step 1: Check if Supabase is running
  const isRunning = await checkSupabaseStatus();
  
  // Step 2: Restart containers if Supabase is not running
  if (!isRunning) {
    log('\n⚠️ Supabase is not running or not accessible.', colors.yellow);
    const restarted = await restartContainers();
    
    if (!restarted) {
      log('\n❌ Failed to restart Supabase. Please check Docker is running and try manually:', colors.red);
      log('docker-compose down && docker-compose up -d', colors.yellow);
      return;
    }
    
    // Check status again after restart
    const isRunningAfterRestart = await checkSupabaseStatus();
    if (!isRunningAfterRestart) {
      log('\n❌ Supabase is still not accessible after restart.', colors.red);
      log('Please check your Docker configuration and network settings.', colors.yellow);
      return;
    }
  }
  
  // Step 3: Apply migrations
  const migrationsApplied = await applyMigrations();
  
  // Step 4: Test queue creation
  if (migrationsApplied) {
    const queueCreationWorks = await testCreateQueue();
    
    if (queueCreationWorks) {
      log('\n🎉 Success! Your Supabase setup is working correctly.', colors.green);
      log('You should now be able to create queues in the application.', colors.green);
    } else {
      log('\n❌ Queue creation still not working.', colors.red);
      log('Please check the following:', colors.yellow);
      log('1. Your Supabase anon key is correct in .env', colors.yellow);
      log('2. The RLS policies are configured correctly', colors.yellow);
      log('3. Network connectivity between frontend and Supabase', colors.yellow);
    }
  } else {
    log('\n⚠️ Could not apply migrations. Try running this script again.', colors.yellow);
  }
}

// Run the main function
main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
}); 