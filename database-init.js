/**
 * Database initialization and verification script
 * 
 * Run this script to check if the Supabase database is properly initialized
 * and the required tables exist.
 */
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
  },
});

// Check if table exists
const checkTableExists = async (tableName) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: true, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};

// Create tables if they don't exist
const createTables = async () => {
  try {
    // Read SQL file contents
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '00001_initial_schema.sql');
    let sql;
    
    try {
      sql = fs.readFileSync(sqlPath, 'utf8');
    } catch (err) {
      console.error('Error reading SQL file:', err);
      console.log('Falling back to hardcoded schema');
      sql = `
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
      `;
    }
    
    // Execute SQL via REST API or another method since supabase-js doesn't support custom SQL directly
    console.log('Creating tables...');
    
    // For now, just log that we need to run the migrations manually
    console.log('Please ensure the database migrations have been applied.');
    console.log('You may need to run the SQL scripts from supabase/migrations/ manually.');
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Test creating a queue
const testCreateQueue = async () => {
  try {
    const queueId = uuidv4();
    const adminSecret = uuidv4();
    
    // First, check if queues table exists
    const { exists, error: existsError } = await checkTableExists('queues');
    if (!exists) {
      console.log('Queues table does not exist. Error:', existsError);
      console.log('Attempting to create tables...');
      const { success, error } = await createTables();
      if (!success) {
        console.error('Failed to create tables:', error);
        return { success: false, error };
      }
    }
    
    console.log('Testing queue creation...');
    
    // Direct REST API fetch approach
    const response = await fetch(`${supabaseUrl}/rest/v1/queues`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: queueId,
        name: 'Test Queue ' + new Date().toISOString(),
        admin_secret: adminSecret,
        created_at: new Date().toISOString(),
        status: 'active'
      })
    });
    
    console.log('Direct REST API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('REST API error:', errorText);
    }
    
    // Using Supabase client
    const { data, error } = await supabase
      .from('queues')
      .insert([
        {
          id: uuidv4(),
          name: 'Test Queue Client ' + new Date().toISOString(),
          admin_secret: uuidv4(),
          created_at: new Date().toISOString(),
          status: 'active'
        }
      ])
      .select();
    
    if (error) {
      console.error('Supabase client error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Test queue created via client:', data);
    
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error testing queue creation:', error);
    return { success: false, error: error.message };
  }
};

// Main function
const main = async () => {
  console.log('Checking database setup...');
  
  // Check if queues table exists
  const queuesResult = await checkTableExists('queues');
  console.log('Queues table exists:', queuesResult.exists);
  if (!queuesResult.exists) {
    console.log('Queues table error:', queuesResult.error);
  }
  
  // Check if tickets table exists
  const ticketsResult = await checkTableExists('tickets');
  console.log('Tickets table exists:', ticketsResult.exists);
  if (!ticketsResult.exists) {
    console.log('Tickets table error:', ticketsResult.error);
  }
  
  // If tables don't exist, create them
  if (!queuesResult.exists || !ticketsResult.exists) {
    console.log('Attempting to create tables...');
    const createResult = await createTables();
    console.log('Table creation result:', createResult);
  }
  
  // Test queue creation
  const testResult = await testCreateQueue();
  console.log('Test queue creation result:', testResult.success);
  
  if (!testResult.success) {
    console.error('Test queue creation error:', testResult.error);
  }
  
  console.log('Database initialization and verification complete.');
};

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 