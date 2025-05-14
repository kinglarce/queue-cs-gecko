/**
 * Application configuration
 * This file centralizes all environment variables and configuration settings
 */

// Get environment variables with fallbacks
const getEnv = (key: string, defaultValue: string = ''): string => {
  // Check if running in browser
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key as keyof typeof window.ENV]) {
    return window.ENV[key as keyof typeof window.ENV] as string;
  }
  
  // Check process.env (during build/development)
  return process.env[key] || defaultValue;
};

// Supabase configuration
export const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL', '');
export const SUPABASE_ANON_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY', '');

// Application configuration
export const APP_TITLE = getEnv('REACT_APP_TITLE', 'HYROX Customer Support Queue');
export const BASE_URL = getEnv('REACT_APP_BASE_URL', window.location.origin);

// Constants for local storage keys
export const LOCAL_STORAGE_KEYS = {
  ADMIN_TOKEN: 'hyrox_queue_admin_token',
  VISITOR_TOKEN: 'hyrox_queue_visitor_token'
};

// Configuration validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase configuration. Make sure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set.'
  );
} 