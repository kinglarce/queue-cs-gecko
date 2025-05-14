import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, LOCAL_STORAGE_KEYS } from '../config';
import { ActiveSubscriptions } from '../types/models';

// Create Supabase client
export const supabase: any = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
  realtime: {
    eventsPerSecond: 10
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
    localStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_TOKEN, token);
    
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
    localStorage.setItem(LOCAL_STORAGE_KEYS.VISITOR_TOKEN, token);
    
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
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ADMIN_TOKEN);
    
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
    localStorage.removeItem(LOCAL_STORAGE_KEYS.VISITOR_TOKEN);
    
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