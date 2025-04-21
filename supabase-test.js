/**
 * Supabase connection test script
 * Uses http module to directly test connection to Supabase
 */
const http = require('http');
const https = require('https');

// Configuration
const supabaseUrl = 'http://localhost:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.9LMdtDQybMqgw4rYkVz4qVfU7CRo9bctZO-DVODZpkg';

// Extract host and port from URL
const urlParts = supabaseUrl.replace('http://', '').replace('https://', '').split(':');
const host = urlParts[0];
const port = urlParts[1] || 80;

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        let parsedBody;
        try {
          parsedBody = JSON.parse(responseBody);
        } catch (e) {
          parsedBody = responseBody;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsedBody
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  try {
    console.log('Testing Supabase health check...');
    const response = await makeRequest('/health');
    
    console.log(`Health check status: ${response.status}`);
    console.log(`Health check response:`, response.body);
    
    return { success: response.status >= 200 && response.status < 300, ...response };
  } catch (error) {
    console.error('Health check error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testListTables() {
  try {
    console.log('\nTesting listing tables with anon key...');
    const response = await makeRequest('/rest/v1/', 'GET', {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    });
    
    console.log(`List tables status: ${response.status}`);
    console.log('List tables response:', response.body);
    
    return { success: response.status >= 200 && response.status < 300, ...response };
  } catch (error) {
    console.error('List tables error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testServiceKeyAccess() {
  try {
    console.log('\nTesting access with service role key...');
    const response = await makeRequest('/rest/v1/', 'GET', {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    });
    
    console.log(`Service role access status: ${response.status}`);
    console.log('Service role response:', response.body);
    
    return { success: response.status >= 200 && response.status < 300, ...response };
  } catch (error) {
    console.error('Service role access error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testCreateTable() {
  try {
    console.log('\nTesting creating queues table with service role key...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.queues (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        admin_secret TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'archived'))
      );
    `;
    
    const response = await makeRequest('/rest/v1/rpc/sql', 'POST', {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }, { query: createTableQuery });
    
    console.log(`Create table status: ${response.status}`);
    console.log('Create table response:', response.body);
    
    return { success: response.status >= 200 && response.status < 300, ...response };
  } catch (error) {
    console.error('Create table error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testCreateQueue() {
  try {
    console.log('\nTesting inserting a test queue...');
    const queueId = '00000000-0000-0000-0000-000000000000';
    const adminSecret = 'test-admin-secret';
    
    const response = await makeRequest('/rest/v1/queues', 'POST', {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Prefer': 'return=representation'
    }, {
      id: queueId,
      name: 'Test Queue',
      admin_secret: adminSecret,
      created_at: new Date().toISOString(),
      status: 'active'
    });
    
    console.log(`Create queue status: ${response.status}`);
    console.log('Create queue response:', response.body);
    
    return { success: response.status >= 200 && response.status < 300, ...response };
  } catch (error) {
    console.error('Create queue error:', error.message);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  console.log(`Testing connection to Supabase at ${supabaseUrl} (${host}:${port})`);
  
  // Test health check
  await testHealthCheck();
  
  // Test listing tables with anon key
  await testListTables();
  
  // Test access with service role key
  await testServiceKeyAccess();
  
  // Test creating a table
  await testCreateTable();
  
  // Test creating a queue
  await testCreateQueue();
  
  console.log('\nDiagnostic tests complete');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 