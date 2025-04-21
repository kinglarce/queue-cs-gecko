import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useQueueStore from '../store/queueStore';

function StatusDisplayPage() {
  const { queueId } = useParams();
  
  const { 
    currentQueue, 
    queueTickets, 
    nowServing, 
    waitingCount,
    isLoading, 
    loadQueue,
    setupQueueListener
  } = useQueueStore();
  
  // Load queue data
  useEffect(() => {
    if (queueId) {
      loadQueue(queueId);
      
      // Set up realtime listener
      const subscription = setupQueueListener(queueId);
      
      // Clean up listener on unmount
      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [queueId, loadQueue, setupQueueListener]);
  
  // Prevent screen from sleeping
  useEffect(() => {
    let wakeLock = null;
    
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock error:', err);
      }
    };
    
    requestWakeLock();
    
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);
  
  if (isLoading && !currentQueue) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-2xl">Loading queue information...</p>
      </div>
    );
  }
  
  if (!currentQueue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-4xl font-bold text-red-500 mb-6">Queue Not Found</h1>
        <p className="text-xl mb-8">The queue you're looking for doesn't exist or has been deleted.</p>
        <Link to="/" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium">
          Return Home
        </Link>
      </div>
    );
  }
  
  // Filter waiting tickets
  const waitingTickets = queueTickets
    .filter(ticket => ticket.status === 'waiting')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 8); // Show only next 8 in line
  
  // Get a nice greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 pt-8">
          <div className="flex flex-col items-center">
            <h1 className="text-5xl font-bold mb-2">{currentQueue.name}</h1>
            <p className="text-2xl text-gray-300">{getGreeting()}</p>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-8 h-full">
              <h2 className="text-2xl mb-6 text-gray-300">Now Serving</h2>
              
              {nowServing ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-8xl font-bold text-primary-500 animate-pulse">
                      #{nowServing.ticket_number}
                    </div>
                    <div className="mt-4 text-xl text-gray-300">
                      {nowServing.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-2xl text-gray-500">No one is being served</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl text-gray-300">Up Next</h2>
                <div className="px-4 py-1 bg-primary-900 rounded-full text-lg">
                  <span className="text-primary-200">Waiting: </span>
                  <span className="font-bold text-white">{waitingCount}</span>
                </div>
              </div>
              
              {waitingTickets.length === 0 ? (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-xl">
                  <p className="text-2xl text-gray-500">The queue is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {waitingTickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className="p-5 bg-gray-700 rounded-lg flex justify-between items-center"
                    >
                      <span className="text-lg truncate">{ticket.name}</span>
                      <span className="text-2xl font-bold text-primary-400">#{ticket.ticket_number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500">
          <p>Join the queue by scanning the QR code available at the entrance.</p>
          <p className="text-lg mt-2 text-gray-300">The information on this screen updates in real-time.</p>
          <div className="mt-8">
            <p>Queue ID: {queueId}</p>
            <p>Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatusDisplayPage; 