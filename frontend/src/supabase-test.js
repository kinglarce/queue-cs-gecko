/**
 * Test script for checking Supabase API authentication
 * Run this in your browser console or Node.js to verify API access
 */

// Supabase API URL
const SUPABASE_URL = 'http://localhost:8000';

// Supabase Anonymous Key (public)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldi1hbm9uLWtleSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE0MjEyMzYyLCJleHAiOjE5Mjk3ODgzNjJ9.zqdHRKBYGjJTUf6_H-qBXwMj_stP4aMhzGYYRLsKEQE';

// Test endpoints to try
const endpoints = [
  '/rest/v1/',
  '/rest/v1/queues?select=*',
  '/rest/v1/tickets?select=*',
];

// Function to test an endpoint
async function testEndpoint(endpoint) {
  console.log(`Testing endpoint: ${SUPABASE_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Data:', data);
      return { success: true, status: response.status, data };
    } else {
      const error = await response.text();
      console.error('Error response:', error);
      return { success: false, status: response.status, error };
    }
  } catch (err) {
    console.error('Fetch error:', err);
    return { success: false, error: err.message };
  }
}

// Test creating a new queue
async function testCreateQueue() {
  console.log('Testing queue creation...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/queues`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Test Queue',
        admin_secret: 'test-secret-' + Date.now(),
        status: 'active'
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Queue created successfully:', data);
      return { success: true, data };
    } else {
      const error = await response.text();
      console.error('Error creating queue:', error);
      return { success: false, error };
    }
  } catch (err) {
    console.error('Fetch error:', err);
    return { success: false, error: err.message };
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== SUPABASE API TEST ===');
  console.log('Using URL:', SUPABASE_URL);
  console.log('Using key:', SUPABASE_ANON_KEY.substring(0, 10) + '...');
  
  // Test basic endpoints
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    console.log('---');
  }
  
  // Test queue creation
  await testCreateQueue();
  
  console.log('=== TEST COMPLETE ===');
}

// Execute tests
runAllTests(); 