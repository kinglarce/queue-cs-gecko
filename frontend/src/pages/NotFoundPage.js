import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Page Not Found</h1>
            <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/" className="btn-primary px-8 py-3">
              Return Home
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default NotFoundPage; 