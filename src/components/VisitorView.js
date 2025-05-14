import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { getQueueRoom, getQueueItems, joinQueue, getQueuePosition } from '../utils/queueHelpers';
import { supabase, setVisitorToken } from '../utils/supabase';

const VisitorView = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [room, setRoom] = useState(null);
  const [name, setName] = useState('');
  const [queueItem, setQueueItem] = useState(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  
  useEffect(() => {
    // Set the visitor token for Supabase RLS policies
    if (token) {
      setVisitorToken(token);
      setTokenValid(true);
    }
  }, [token]);
  
  useEffect(() => {
    if (!tokenValid) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch queue room details
        const roomData = await getQueueRoom(roomId);
        setRoom(roomData);
        
        // Fetch queue items to get waiting count
        const itemsData = await getQueueItems(roomId);
        const waiting = itemsData.filter(item => item.status === 'waiting').length;
        setWaitingCount(waiting);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load queue data. Please check your link or try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscription for queue items
    const subscription = supabase
      .from(`queue_items:queue_room_id=eq.${roomId}`)
      .on('*', async payload => {
        if (queueItem) {
          // If user has joined, update their position
          const newPosition = await getQueuePosition(roomId, queueItem.ticket_number);
          setPosition(newPosition);
        }
        
        // Update waiting count
        const { data } = await supabase
          .from('queue_items')
          .select('id')
          .eq('queue_room_id', roomId)
          .eq('status', 'waiting');
          
        if (data) {
          setWaitingCount(data.length);
        }
      })
      .subscribe();
      
    return () => {
      // Clean up subscription
      supabase.removeSubscription(subscription);
    };
  }, [roomId, tokenValid, queueItem]);
  
  // If no token provided, redirect to home
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  const handleJoinQueue = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name to join the queue');
      return;
    }
    
    setJoinLoading(true);
    setError(null);
    
    try {
      const newItem = await joinQueue(roomId, name);
      setQueueItem(newItem);
      
      // Get initial position
      const initialPosition = await getQueuePosition(roomId, newItem.ticket_number);
      setPosition(initialPosition);
    } catch (err) {
      console.error('Error joining queue:', err);
      setError('Failed to join queue. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading support queue...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!room) {
    return <div className="not-found">Support queue not found</div>;
  }
  
  if (room.status === 'closed') {
    return (
      <div className="queue-closed">
        <h2>This support queue is currently closed</h2>
        <p>Please check back later or contact HYROX staff directly.</p>
      </div>
    );
  }
  
  // If user has already joined the queue
  if (queueItem) {
    const isWaiting = queueItem.status === 'waiting';
    const isServing = queueItem.status === 'serving';
    const isComplete = ['completed', 'no_show'].includes(queueItem.status);
    
    return (
      <div className="visitor-view joined">
        <div className="queue-header">
          <h1>{room.name}</h1>
          {room.description && <p>{room.description}</p>}
        </div>
        
        <div className="ticket-info">
          <div className="ticket">
            <h2>Ticket #{queueItem.ticket_number}</h2>
            <p>Name: {queueItem.name}</p>
            <p className="ticket-status">
              Status: <span className={`status-${queueItem.status}`}>
                {queueItem.status === 'waiting' && 'Waiting'}
                {queueItem.status === 'serving' && 'Being Served'}
                {queueItem.status === 'completed' && 'Completed'}
                {queueItem.status === 'no_show' && 'No Show'}
              </span>
            </p>
            
            {isWaiting && position && (
              <div className="position-info">
                <h3>Your Position: {position}</h3>
                <p>There {position === 1 ? 'is' : 'are'} {position} {position === 1 ? 'person' : 'people'} ahead of you.</p>
                <p>Please keep this page open to maintain your place in the queue.</p>
              </div>
            )}
            
            {isServing && (
              <div className="serving-info">
                <h3>It's Your Turn!</h3>
                <p>Please proceed to the HYROX support staff.</p>
              </div>
            )}
            
            {isComplete && (
              <div className="complete-info">
                <h3>Visit Complete</h3>
                <p>Thank you for visiting HYROX Customer Support!</p>
                <button onClick={() => window.location.reload()}>Join Queue Again</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Join queue form
  return (
    <div className="visitor-view">
      <div className="queue-header">
        <h1>{room.name}</h1>
        {room.description && <p>{room.description}</p>}
      </div>
      
      <div className="queue-status">
        <p>
          There {waitingCount === 1 ? 'is' : 'are'} currently {waitingCount} {waitingCount === 1 ? 'person' : 'people'} in this support queue.
        </p>
      </div>
      
      <div className="join-form">
        <h2>Join the Support Queue</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleJoinQueue}>
          <div className="form-group">
            <label htmlFor="visitor-name">Your Name</label>
            <input
              id="visitor-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={joinLoading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={joinLoading} 
            className="submit-btn"
          >
            {joinLoading ? 'Joining...' : 'Join Queue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VisitorView; 