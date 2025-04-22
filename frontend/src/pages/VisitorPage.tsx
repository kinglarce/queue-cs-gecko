import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useQueueStore from '../store/queueStore';
import { Ticket } from '../types';

interface PositionInfo {
  position: number;
  estimatedWaitTime: number;
}

const VisitorPage: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);
  const [positionInfo, setPositionInfo] = useState<PositionInfo | null>(null);
  
  const { 
    currentQueue, 
    queueTickets, 
    nowServing, 
    waitingCount,
    isLoading, 
    loadQueue, 
    joinQueue,
    setupQueueListener
  } = useQueueStore();
  
  // Load queue data
  useEffect(() => {
    if (queueId) {
      loadQueue(queueId);
      
      // Set up realtime listener
      const subscription = setupQueueListener(queueId);
      
      // Check for existing ticket in session storage
      const savedTicket = sessionStorage.getItem(`ticket_${queueId}`);
      if (savedTicket) {
        try {
          setMyTicket(JSON.parse(savedTicket));
        } catch (err) {
          console.error('Failed to parse saved ticket:', err);
          sessionStorage.removeItem(`ticket_${queueId}`);
        }
      }
      
      // Clean up listener on unmount
      return () => {
        if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    }
  }, [queueId, loadQueue, setupQueueListener]);
  
  // Update position info when queue updates
  useEffect(() => {
    if (myTicket && queueTickets.length > 0) {
      // Find my ticket in the updated queue
      const updatedTicket = queueTickets.find(t => t.id === myTicket.id);
      
      if (updatedTicket) {
        // Update my ticket with latest info
        setMyTicket(updatedTicket);
        sessionStorage.setItem(`ticket_${queueId}`, JSON.stringify(updatedTicket));
        
        // Calculate position in line
        if (updatedTicket.status === 'waiting') {
          const position = queueTickets.filter(
            t => t.status === 'waiting' && 
            new Date(t.created_at) < new Date(updatedTicket.created_at)
          ).length + 1;
          
          setPositionInfo({
            position,
            estimatedWaitTime: position * 3 // Simple estimate: 3 minutes per person
          });
        } else if (updatedTicket.status === 'serving') {
          // It's my turn
          setPositionInfo({ position: 0, estimatedWaitTime: 0 });
          
          // Try to notify the user it's their turn
          try {
            if (Notification.permission === 'granted') {
              new Notification('It\'s your turn!', {
                body: `You're now being served at ${currentQueue?.name}`,
                icon: '/logo.png'
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('It\'s your turn!', {
                    body: `You're now being served at ${currentQueue?.name}`,
                    icon: '/logo.png'
                  });
                }
              });
            }
          } catch (err) {
            console.log('Notification not supported', err);
          }
        } else {
          // Served or skipped
          setPositionInfo(null);
        }
      }
    }
  }, [queueTickets, myTicket, queueId, currentQueue]);
  
  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!queueId) {
      setError('Queue ID is missing');
      return;
    }
    
    try {
      const ticket = await joinQueue(queueId, name);
      if (ticket) {
        setMyTicket(ticket);
        sessionStorage.setItem(`ticket_${queueId}`, JSON.stringify(ticket));
        
        // Request notification permission
        try {
          if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        } catch (err) {
          console.log('Notification not supported', err);
        }
      } else {
        setError('Failed to join queue. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };
  
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
              <p className="text-lg text-gray-600 mb-8">The queue you're trying to join doesn't exist or has been deleted.</p>
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
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentQueue.name}</h1>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {!myTicket ? (
              // Join Queue Form
              <div>
                <p className="text-gray-600 mb-6">
                  Join the queue to secure your place in line. You'll be able to track your position and receive notifications when it's your turn.
                </p>
                
                <form onSubmit={handleJoinQueue}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="input"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      Current Queue Status: {waitingCount} people waiting
                      {nowServing && ` • Now serving #${nowServing.ticket_number}`}
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn-primary w-full py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Joining...' : 'Join Queue'}
                  </button>
                </form>
              </div>
            ) : (
              // Ticket Information
              <div>
                {myTicket.status === 'waiting' && (
                  <div className="mb-8 p-6 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-center">
                      <span className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-800 text-lg font-bold mb-2">
                        Ticket #{myTicket.ticket_number}
                      </span>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">{name}</h2>
                      
                      {positionInfo && (
                        <div className="mt-4">
                          <p className="text-2xl font-bold text-primary-700">
                            Position: {positionInfo.position}
                          </p>
                          <p className="text-gray-600">
                            Estimated wait time: {positionInfo.estimatedWaitTime} minutes
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {myTicket.status === 'serving' && (
                  <div className="mb-8 p-6 rounded-lg bg-green-50 border border-green-200 text-center">
                    <div className="animate-pulse mb-2">
                      <span className="inline-block px-4 py-2 rounded-full bg-green-100 text-green-800 text-lg font-bold">
                        It's Your Turn!
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket #{myTicket.ticket_number}</h2>
                    <p className="text-green-700 text-lg">Please proceed to the counter now.</p>
                  </div>
                )}
                
                {myTicket.status === 'served' && (
                  <div className="mb-8 p-6 rounded-lg bg-gray-50 border border-gray-200 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-gray-100 text-gray-800 text-lg font-bold mb-2">
                      Completed
                    </span>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket #{myTicket.ticket_number}</h2>
                    <p className="text-gray-600">Thank you for using our services!</p>
                  </div>
                )}
                
                {myTicket.status === 'skipped' && (
                  <div className="mb-8 p-6 rounded-lg bg-red-50 border border-red-200 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-red-100 text-red-800 text-lg font-bold mb-2">
                      Skipped
                    </span>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Ticket #{myTicket.ticket_number}</h2>
                    <p className="text-gray-600 mb-4">
                      Your turn was skipped. This could happen if you were away when your number was called.
                    </p>
                    <button
                      onClick={() => {
                        setMyTicket(null);
                        if (queueId) {
                          sessionStorage.removeItem(`ticket_${queueId}`);
                        }
                      }}
                      className="btn-primary"
                    >
                      Rejoin Queue
                    </button>
                  </div>
                )}
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <h2 className="font-medium text-lg mb-4">Queue Status</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-500">Now Serving</p>
                      <p className="text-xl font-bold text-gray-900">
                        {nowServing ? `#${nowServing.ticket_number}` : '—'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-500">People Waiting</p>
                      <p className="text-xl font-bold text-gray-900">{waitingCount}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-2">
                    Keep this page open to track your progress in the queue.
                  </p>
                  <p className="text-sm text-gray-500">
                    You'll be notified when it's your turn.
                  </p>
                </div>
                
                {myTicket.status !== 'skipped' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to leave the queue?')) {
                        setMyTicket(null);
                        if (queueId) {
                          sessionStorage.removeItem(`ticket_${queueId}`);
                        }
                      }
                    }}
                    className="btn-outline w-full"
                  >
                    Leave Queue
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VisitorPage; 