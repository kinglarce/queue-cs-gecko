import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import CreateQueue from './components/CreateQueue';
import AdminView from './components/AdminView';
import VisitorView from './components/VisitorView';
import './styles.css';

function App() {
  useEffect(() => {
    // Set page title from environment variable
    document.title = process.env.REACT_APP_TITLE || 'HYROX Customer Support';
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateQueue />} />
          <Route path="/admin/:roomId" element={<AdminView />} />
          <Route path="/join/:roomId" element={<VisitorView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App; 