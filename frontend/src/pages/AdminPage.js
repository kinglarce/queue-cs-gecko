import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useQueueStore from '../store/queueStore';
import QRCodeGenerator from '../components/QRCodeGenerator';

function AdminPage() {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const [adminSecret, setAdminSecret] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    currentQueue, 
    queueTickets, 
    nowServing, 
    waitingCount,
    isLoading, 
    loadQueue, 
    callNext,
    skipTicket,
    resetQueue,
    setupQueueListener
  } = useQueueStore();
  
  // Check for saved admin secret in localStorage
  useEffect(() => {
    const savedSecret = localStorage.getItem(`admin_${queueId}`);
    if (savedSecret) {
      setAdminSecret(savedSecret);
      setAuthorized(true);
    }
  }, [queueId]);
  
  // Load queue data when authorized
  useEffect(() => {
    if (authorized && queueId) {
      loadQueue(queueId);
      
      // Set up realtime listener
      const subscription = setupQueueListener(queueId);
      
      // Clean up listener on unmount
      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [authorized, queueId, loadQueue, setupQueueListener]);
  
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminSecret.trim()) {
      // For now we're just accepting any secret, in a real app you'd validate with the server
      setAuthorized(true);
      localStorage.setItem(`admin_${queueId}`, adminSecret);
    } else {
      setError('Please enter the admin secret');
    }
  };
  
  const handleCallNext = async () => {
    try {
      await callNext(queueId, adminSecret);
    } catch (err) {
      setError(err.message || 'Failed to call next customer');
    }
  };
  
  const handleSkipTicket = async (ticketId) => {
    try {
      await skipTicket(queueId, ticketId, adminSecret);
    } catch (err) {
      setError(err.message || 'Failed to skip customer');
    }
  };
  
  const handleResetQueue = async () => {
    if (window.confirm('Are you sure you want to reset the queue? This will archive all current tickets.')) {
      try {
        await resetQueue(queueId, adminSecret);
      } catch (err) {
        setError(err.message || 'Failed to reset queue');
      }
    }
  };
  
  if (!authorized) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow py-12">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Queue Admin Login</h1>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleAdminLogin}>
                <div className="mb-4">
                  <label htmlFor="adminSecret" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Secret
                  </label>
                  <input
                    type="password"
                    id="adminSecret"
                    className="input"
                    placeholder="Enter your admin secret"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn-primary w-full"
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }
  
  if (isLoading && !currentQueue) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">Loading queue information...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!currentQueue) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Queue Not Found</h1>
              <p className="text-lg text-gray-600 mb-8">The queue you're looking for doesn't exist or has been deleted.</p>
              <Link to="/" className="btn-primary">
                Return Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Filter tickets by status
  const waitingTickets = queueTickets.filter(ticket => ticket.status === 'waiting');
  const servingTickets = queueTickets.filter(ticket => ticket.status === 'serving');
  const servedTickets = queueTickets.filter(ticket => ticket.status === 'served');
  const skippedTickets = queueTickets.filter(ticket => ticket.status === 'skipped');
  
  // Create sharable links
  const visitorLink = `${window.location.origin}/queue/${queueId}`;
  const statusDisplayLink = `${window.location.origin}/status/${queueId}`;
  const posterLink = `${window.location.origin}/poster/${queueId}`;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{currentQueue.name}</h1>
            <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
              <Link to={`/poster/${queueId}`} className="btn-outline" target="_blank">
                View Poster
              </Link>
              <Link to={`/status/${queueId}`} className="btn-outline" target="_blank">
                View Status Display
              </Link>
              <button 
                onClick={handleResetQueue} 
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Reset Queue
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Queue Stats */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Queue Information</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Now Serving</p>
                      <p className="text-3xl font-bold text-primary-600">
                        {nowServing ? `#${nowServing.ticket_number}` : '-'}
                      </p>
                    </div>
                    
                    <div className="bg-secondary-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Waiting</p>
                      <p className="text-3xl font-bold text-secondary-600">
                        {waitingCount}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <button
                      onClick={handleCallNext}
                      disabled={waitingCount === 0 || isLoading}
                      className={`w-full py-3 btn ${
                        waitingCount === 0 || isLoading
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      {isLoading ? 'Processing...' : 'Call Next'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">QR Code</h2>
                  <QRCodeGenerator url={visitorLink} size={220} />
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Visitor Link:</h3>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={visitorLink}
                        className="input text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(visitorLink);
                          alert('Link copied to clipboard!');
                        }}
                        className="ml-2 btn-outline"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Waiting List */}
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Waiting List</h2>
                  
                  {waitingTickets.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">No customers are currently waiting</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Waiting Since
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {waitingTickets.map(ticket => (
                            <tr key={ticket.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                #{ticket.ticket_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {ticket.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(ticket.created_at).toLocaleTimeString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  onClick={() => handleSkipTicket(ticket.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Skip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              
              {nowServing && (
                <div className="mt-6 bg-green-50 rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-green-800 mb-2">Now Serving</h2>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-bold text-green-600">#{nowServing.ticket_number}</p>
                        <p className="text-green-800">{nowServing.name}</p>
                      </div>
                      <button
                        onClick={handleCallNext}
                        className="btn btn-primary"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recently Served */}
              {servedTickets.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Recently Served</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Served At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {servedTickets.slice(0, 5).map(ticket => (
                            <tr key={ticket.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                #{ticket.ticket_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {ticket.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {ticket.completed_at 
                                  ? new Date(ticket.completed_at).toLocaleTimeString()
                                  : new Date(ticket.updated_at).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default AdminPage; 