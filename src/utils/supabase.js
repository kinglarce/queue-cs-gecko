import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to set the admin token in the Supabase client
export const setAdminToken = (token) => {
  if (!token) return;
  
  // Set the token in local storage
  localStorage.setItem('adminToken', token);
  
  // Set the token for Supabase RLS policies
  supabase.rpc('set_claim', { claim: 'app.admin_token', value: token })
    .catch(console.error);
};

// Helper function to set the visitor token in the Supabase client
export const setVisitorToken = (token) => {
  if (!token) return;
  
  // Set the token in local storage
  localStorage.setItem('visitorToken', token);
  
  // Set the token for Supabase RLS policies
  supabase.rpc('set_claim', { claim: 'app.visitor_token', value: token })
    .catch(console.error);
};

// Function to clear all tokens
export const clearTokens = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('visitorToken');
  
  // Clear the tokens from Supabase
  supabase.rpc('set_claim', { claim: 'app.admin_token', value: null })
    .catch(console.error);
  supabase.rpc('set_claim', { claim: 'app.visitor_token', value: null })
    .catch(console.error);
}; 