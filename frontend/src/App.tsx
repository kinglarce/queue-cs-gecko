import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Pages
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import VisitorPage from './pages/VisitorPage';
import StatusDisplayPage from './pages/StatusDisplayPage';
import NotFoundPage from './pages/NotFoundPage';
import CreateQueuePage from './pages/CreateQueuePage';
import QRPosterPage from './pages/QRPosterPage';
import ExampleFormPage from './pages/ExampleFormPage';
import JoinQueuePage from './pages/JoinQueuePage';

// Services
import { apiService } from './services/api';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('Initializing Supabase with:', { supabaseUrl, supabaseKeyPrefix: supabaseKey.substring(0, 10) + '...' });

// Export supabase client for use in other modules
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Log all React environment variables for debugging
console.log('========== Environment Variables Debug Info ==========');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY (first 10 chars):', 
  process.env.REACT_APP_SUPABASE_ANON_KEY ? process.env.REACT_APP_SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'not defined');
console.log('REACT_APP_TITLE:', process.env.REACT_APP_TITLE);
console.log('REACT_APP_VERSION:', process.env.REACT_APP_VERSION);
console.log('REACT_APP_USE_MOCK_API:', process.env.REACT_APP_USE_MOCK_API);
console.log('REACT_APP_MOCK_API_URL:', process.env.REACT_APP_MOCK_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('======================================================');

/**
 * Check if API is accessible
 */
export const checkApiHealth = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    // First try a direct Supabase health check
    console.log('Attempting direct Supabase health check...');
    try {
      const { data, error } = await supabase.from('queues').select('id').limit(1);
      
      console.log('Supabase health check result:', { data, error });
      
      if (!error) {
        return { ok: true, message: 'Supabase connection is healthy' };
      } else {
        console.error('Supabase direct check failed with error:', error);
      }
    } catch (supabaseError) {
      console.warn('Direct Supabase check failed with exception:', supabaseError);
    }
    
    // Fall back to API service health check
    console.log('Falling back to API service health check...');
    const healthResult = await apiService.healthCheck();
    
    if (!healthResult.data) {
      console.error('API health check failed:', healthResult.error);
      return { 
        ok: false, 
        message: `API health check failed: ${healthResult.error || 'Unknown error'}` 
      };
    }
    
    return { ok: true, message: 'API connection is healthy' };
  } catch (error) {
    console.error('API connection error:', error);
    return { 
      ok: false, 
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

const App: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  useEffect(() => {
    const verifyApiConnection = async () => {
      setCheckingConnection(true);
      const status = await checkApiHealth();
      setApiStatus(status);
      setCheckingConnection(false);
      
      // Log detailed connection status
      if (status.ok) {
        console.log('✅ API connection verified successfully');
      } else {
        console.error('❌ API connection verification failed:', status.message);
      }
    };

    verifyApiConnection();
  }, []);

  if (checkingConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Initializing Application</h2>
          <p className="text-gray-500">Connecting to API...</p>
        </div>
      </div>
    );
  }

  if (apiStatus && !apiStatus.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white shadow-lg rounded-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Connection Error</h2>
          <p className="text-gray-500 mb-4">{apiStatus.message}</p>
          <div className="bg-gray-100 p-4 rounded text-left text-sm mb-4">
            <p className="font-mono mb-2">API URL: {process.env.REACT_APP_SUPABASE_URL || process.env.REACT_APP_MOCK_API_URL || 'Not configured'}</p>
            <p className="font-mono">Mode: {process.env.REACT_APP_USE_MOCK_API === 'true' ? 'Mock API' : 'Supabase'}</p>
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
          <Route path="/join" element={<JoinQueuePage />} />
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