import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import VisitorPage from './pages/VisitorPage';
import StatusDisplayPage from './pages/StatusDisplayPage';
import NotFoundPage from './pages/NotFoundPage';
import CreateQueuePage from './pages/CreateQueuePage';
import QRPosterPage from './pages/QRPosterPage';
import ExampleFormPage from './pages/ExampleFormPage';

// Supabase Client
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Log Supabase configuration for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');

// Create Supabase client with comprehensive headers
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Client-Info': 'queue-management-system'
    },
  },
});

const App: React.FC = () => {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateQueuePage />} />
          <Route path="/admin/:queueId" element={<AdminPage />} />
          <Route path="/queue/:queueId" element={<VisitorPage />} />
          <Route path="/status/:queueId" element={<StatusDisplayPage />} />
          <Route path="/poster/:queueId" element={<QRPosterPage />} />
          <Route path="/examples/form" element={<ExampleFormPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 