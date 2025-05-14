import { createClient } from '@supabase/supabase-js';
import { ActiveSubscriptions } from '../types/models';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Make sure we have the environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anonymous Key. Please check your environment variables.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    eventsPerSecond: 10
  },
  global: {
    headers: {
      'x-client-info': 'queue-cs-gecko'
    }
  }
});

// Track active subscriptions to clean up properly
export const activeSubscriptions: ActiveSubscriptions = {};

/**
 * Set admin token for Row Level Security policies
 * @param token Admin token to set
 */
export const setAdminToken = (token: string): void => {
  try {
    // Store token
    localStorage.setItem('adminToken', token);
    
    // Set token as header for RLS policies
    supabase.headers = {
      ...supabase.headers,
      'x-admin-token': token
    };
  } catch (error) {
    console.error('Error setting admin token:', error);
  }
};

/**
 * Set visitor token for Row Level Security policies
 * @param token Visitor token to set 
 */
export const setVisitorToken = (token: string): void => {
  try {
    // Store token
    localStorage.setItem('visitorToken', token);
    
    // Set token as header for RLS policies
    supabase.headers = {
      ...supabase.headers,
      'x-visitor-token': token
    };
  } catch (error) {
    console.error('Error setting visitor token:', error);
  }
};

/**
 * Clear admin token
 */
export const clearAdminToken = (): void => {
  try {
    // Remove token from storage
    localStorage.removeItem('adminToken');
    
    // Remove token from headers
    if (supabase.headers && supabase.headers['x-admin-token']) {
      // Create new headers object without the admin token
      const { 'x-admin-token': _, ...restHeaders } = supabase.headers;
      supabase.headers = restHeaders;
    }
  } catch (error) {
    console.error('Error clearing admin token:', error);
  }
};

/**
 * Clear visitor token
 */
export const clearVisitorToken = (): void => {
  try {
    // Remove token from storage
    localStorage.removeItem('visitorToken');
    
    // Remove token from headers
    if (supabase.headers && supabase.headers['x-visitor-token']) {
      // Create new headers object without the visitor token
      const { 'x-visitor-token': _, ...restHeaders } = supabase.headers;
      supabase.headers = restHeaders;
    }
  } catch (error) {
    console.error('Error clearing visitor token:', error);
  }
}; 