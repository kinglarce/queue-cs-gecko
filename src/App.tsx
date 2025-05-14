import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from '@mui/material';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import CreateQueue from './components/CreateQueue';
import AdminView from './components/AdminView';
import VisitorView from './components/VisitorView';

const App: React.FC = () => {
  useEffect(() => {
    // Set page title from environment variable
    document.title = process.env.REACT_APP_TITLE || 'HYROX Customer Support';
    
    // Log environment for debugging
    console.log('Environment check:', {
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Not set',
      baseUrl: process.env.REACT_APP_BASE_URL || window.location.origin
    });
  }, []);

  return (
    <Router>
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateQueue />} />
            <Route path="/admin/:roomId" element={<AdminView />} />
            <Route path="/join/:roomId" element={<VisitorView />} />
            <Route path="/queue/:roomId" element={<VisitorView />} /> {/* Fallback for compatibility */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Layout>
    </Router>
  );
};

export default App; 