import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl flex items-center justify-center">
            <span role="img" aria-label="gecko" className="inline-block mr-4 text-5xl">🦎</span>
            Queue CS Gecko System
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            A modern digital queue management system designed to streamline customer service operations.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
          <Link
            to="/create"
            className="w-full md:w-64 flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
          >
            Create a Queue
          </Link>
          <Link
            to="/join"
            className="w-full md:w-64 flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
          >
            Join a Queue
          </Link>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900">Real-time Updates</h3>
            <p className="mt-2 text-gray-500">Get real-time notifications and updates about your position in the queue.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900">Digital Check-in</h3>
            <p className="mt-2 text-gray-500">Skip the physical lines with our digital check-in system and QR codes.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900">Wait Time Estimation</h3>
            <p className="mt-2 text-gray-500">Accurate wait time estimations to help you better plan your visit.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage; 