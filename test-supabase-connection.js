/**
 * Supabase Connection Tester
 * 
 * This script tests the connection to Supabase using environment variables
 * and performs basic CRUD operations to verify functionality.
 * 
 * Run with: node test-supabase-connection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Get configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:8000';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Print configuration
console.log(`${colors.bright}Supabase Connection Test${colors.reset}`);
console.log(`URL: ${colors.cyan}${supabaseUrl}${colors.reset}`);
console.log(`Anonymous Key: ${colors.cyan}${supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'NOT SET'}${colors.reset}`);
console.log(`Service Key: ${colors.cyan}${supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + '...' : 'NOT SET'}${colors.reset}`);
console.log('-'.repeat(50));

if (!supabaseAnonKey) {
  console.error(`${colors.red}ERROR: SUPABASE_ANON_KEY is not set in environment variables${colors.reset}`);
  process.exit(1);
}

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

/**
 * Test 1: Basic connectivity check
 */
async function testConnection() {
  console.log(`${colors.bright}Test 1: Basic Connectivity${colors.reset}`);
  
  try {
    const { data, error } = await supabaseAnon.from('queues').select('count');
    
    if (error) {
      console.error(`${colors.red}Failed to connect to Supabase: ${error.message}${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}Successfully connected to Supabase!${colors.reset}`);
    return true;
  } catch (err) {
    console.error(`${colors.red}Exception connecting to Supabase: ${err.message}${colors.reset}`);
    return false;
  }
}

/**
 * Test 2: Create a test queue
 */
async function testCreateQueue() {
  console.log(`\n${colors.bright}Test 2: Create Queue${colors.reset}`);
  
  const testQueue = {
    id: uuidv4(),
    name: `Test Queue ${new Date().toISOString()}`,
    admin_secret: `test-secret-${Date.now()}`,
    status: 'active'
  };
  
  try {
    const { data, error } = await supabaseAnon
      .from('queues')
      .insert(testQueue)
      .select()
      .single();
    
    if (error) {
      console.error(`${colors.red}Failed to create test queue: ${error.message}${colors.reset}`);
      return null;
    }
    
    console.log(`${colors.green}Successfully created queue:${colors.reset}`);
    console.log(`Queue ID: ${colors.cyan}${data.id}${colors.reset}`);
    console.log(`Queue Name: ${colors.cyan}${data.name}${colors.reset}`);
    return data;
  } catch (err) {
    console.error(`${colors.red}Exception creating queue: ${err.message}${colors.reset}`);
    return null;
  }
}

/**
 * Test 3: Create a ticket in the queue
 */
async function testCreateTicket(queueId) {
  console.log(`\n${colors.bright}Test 3: Create Ticket${colors.reset}`);
  
  if (!queueId) {
    console.log(`${colors.yellow}Skipping ticket creation - no queue available${colors.reset}`);
    return null;
  }
  
  const testTicket = {
    id: uuidv4(),
    queue_id: queueId,
    name: `Test Visitor ${new Date().toISOString()}`,
    status: 'waiting'
  };
  
  try {
    const { data, error } = await supabaseAnon
      .from('tickets')
      .insert(testTicket)
      .select()
      .single();
    
    if (error) {
      console.error(`${colors.red}Failed to create test ticket: ${error.message}${colors.reset}`);
      return null;
    }
    
    console.log(`${colors.green}Successfully created ticket:${colors.reset}`);
    console.log(`Ticket ID: ${colors.cyan}${data.id}${colors.reset}`);
    console.log(`Ticket Number: ${colors.cyan}${data.ticket_number}${colors.reset}`);
    console.log(`Visitor Name: ${colors.cyan}${data.name}${colors.reset}`);
    return data;
  } catch (err) {
    console.error(`${colors.red}Exception creating ticket: ${err.message}${colors.reset}`);
    return null;
  }
}

/**
 * Test 4: Retrieve queue with tickets
 */
async function testRetrieveQueueWithTickets(queueId) {
  console.log(`\n${colors.bright}Test 4: Retrieve Queue with Tickets${colors.reset}`);
  
  if (!queueId) {
    console.log(`${colors.yellow}Skipping retrieval - no queue available${colors.reset}`);
    return false;
  }
  
  try {
    // Get queue
    const { data: queue, error: queueError } = await supabaseAnon
      .from('queues')
      .select('*')
      .eq('id', queueId)
      .single();
    
    if (queueError) {
      console.error(`${colors.red}Failed to retrieve queue: ${queueError.message}${colors.reset}`);
      return false;
    }
    
    // Get tickets
    const { data: tickets, error: ticketsError } = await supabaseAnon
      .from('tickets')
      .select('*')
      .eq('queue_id', queueId);
    
    if (ticketsError) {
      console.error(`${colors.red}Failed to retrieve tickets: ${ticketsError.message}${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}Successfully retrieved queue and tickets:${colors.reset}`);
    console.log(`Queue Name: ${colors.cyan}${queue.name}${colors.reset}`);
    console.log(`Number of Tickets: ${colors.cyan}${tickets.length}${colors.reset}`);
    return true;
  } catch (err) {
    console.error(`${colors.red}Exception retrieving data: ${err.message}${colors.reset}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // Test basic connectivity
    const connected = await testConnection();
    if (!connected) {
      console.log(`${colors.red}${colors.bright}Basic connectivity test failed. Aborting further tests.${colors.reset}`);
      return;
    }
    
    // Create a test queue
    const queue = await testCreateQueue();
    
    // Create a test ticket
    const ticket = await testCreateTicket(queue?.id);
    
    // Retrieve queue with tickets
    await testRetrieveQueueWithTickets(queue?.id);
    
    console.log(`\n${colors.green}${colors.bright}All tests completed.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Unexpected error during tests: ${error.message}${colors.reset}`);
  }
}

// Execute the tests
runTests(); 