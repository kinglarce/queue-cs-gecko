import React, { useState, useEffect } from 'react';
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

// Log all React environment variables for debugging
console.log('========== Environment Variables Debug Info ==========');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY (first 10 chars):', 
  process.env.REACT_APP_SUPABASE_ANON_KEY ? process.env.REACT_APP_SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'not defined');
console.log('REACT_APP_TITLE:', process.env.REACT_APP_TITLE);
console.log('REACT_APP_VERSION:', process.env.REACT_APP_VERSION);
console.log('REACT_APP_API_TIMEOUT:', process.env.REACT_APP_API_TIMEOUT);
console.log('REACT_APP_ENABLE_NOTIFICATIONS:', process.env.REACT_APP_ENABLE_NOTIFICATIONS);
console.log('REACT_APP_ENABLE_SMS_NOTIFICATIONS:', process.env.REACT_APP_ENABLE_SMS_NOTIFICATIONS);
console.log('REACT_APP_ENABLE_DARK_MODE:', process.env.REACT_APP_ENABLE_DARK_MODE);
console.log('REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON:', process.env.REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON);
console.log('Using values:');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('======================================================');

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

/**
 * Check if Supabase is accessible
 */
export const checkSupabaseHealth = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    // Try to ping the health endpoint first
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`);
    
    if (!healthResponse.ok) {
      console.error('Supabase health check failed:', await healthResponse.text());
      return { 
        ok: false, 
        message: `Supabase health check failed with status ${healthResponse.status}` 
      };
    }
    
    // Try to make a simple query to verify database connection
    const { data, error } = await supabase
      .from('queues')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Supabase query check failed:', error);
      return { 
        ok: false, 
        message: `Database check failed: ${error.message || error.code}` 
      };
    }
    
    return { ok: true, message: 'Supabase connection is healthy' };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { 
      ok: false, 
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

const App: React.FC = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  useEffect(() => {
    const verifySupabaseConnection = async () => {
      setCheckingConnection(true);
      const status = await checkSupabaseHealth();
      setSupabaseStatus(status);
      setCheckingConnection(false);
      
      // Log detailed connection status
      if (status.ok) {
        console.log('✅ Supabase connection verified successfully');
      } else {
        console.error('❌ Supabase connection verification failed:', status.message);
      }
    };

    verifySupabaseConnection();
  }, []);

  if (checkingConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Initializing Application</h2>
          <p className="text-gray-500">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (supabaseStatus && !supabaseStatus.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white shadow-lg rounded-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Connection Error</h2>
          <p className="text-gray-500 mb-4">{supabaseStatus.message}</p>
          <div className="bg-gray-100 p-4 rounded text-left text-sm mb-4">
            <p className="font-mono mb-2">URL: {supabaseUrl}</p>
            <p className="font-mono">Key: {supabaseAnonKey.substring(0, 10)}...</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

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