// Declaration file for modules without TypeScript definitions

declare module '@mui/material';
declare module '@mui/icons-material/*';
declare module '@mui/material/styles';
declare module '@mui/material/colors';
declare module '@supabase/supabase-js';
declare module 'qrcode.react';

// Extend Window interface to include custom properties
interface Window {
  ENV?: {
    REACT_APP_SUPABASE_URL?: string;
    REACT_APP_SUPABASE_ANON_KEY?: string;
    REACT_APP_TITLE?: string;
    REACT_APP_BASE_URL?: string;
  }
} 