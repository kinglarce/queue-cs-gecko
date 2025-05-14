import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { getQueueRoom, getQueueItems, updateQueueItemStatus } from '../utils/queueHelpers';
import { supabase, setAdminToken } from '../utils/supabase';
import QueueItem from './QueueItem';

const AdminView = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [room, setRoom] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  useEffect(() => {
    // Set the admin token for Supabase RLS policies
    if (token) {
      setAdminToken(token);
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
        
        // Fetch queue items
        const itemsData = await getQueueItems(roomId);
        setItems(itemsData);
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
      .on('*', payload => {
        // Handle real-time updates
        if (payload.eventType === 'INSERT') {
          setItems(current => [...current, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setItems(current => 
            current.map(item => item.id === payload.new.id ? payload.new : item)
          );
        } else if (payload.eventType === 'DELETE') {
          setItems(current => 
            current.filter(item => item.id !== payload.old.id)
          );
        }
      })
      .subscribe();
      
    return () => {
      // Clean up subscription
      supabase.removeSubscription(subscription);
    };
  }, [roomId, tokenValid]);
  
  // If no token provided, redirect to home
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  const handleUpdateStatus = async (itemId, newStatus) => {
    try {
      await updateQueueItemStatus(itemId, newStatus);
      // The real-time subscription will update the UI
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
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
  
  // Filter items by status
  const waitingItems = items.filter(item => item.status === 'waiting');
  const servingItems = items.filter(item => item.status === 'serving');
  const completedItems = items.filter(item => 
    item.status === 'completed' || item.status === 'no_show'
  );
  
  return (
    <div className="admin-view">
      <div className="queue-header">
        <h1>{room.name}</h1>
        {room.description && <p>{room.description}</p>}
        <p className="queue-status">
          Status: <span className={`status-${room.status}`}>{room.status}</span>
        </p>
      </div>
      
      <div className="visitor-link">
        <p>Share this link with HYROX participants to join the queue:</p>
        <div className="url-container">
          <input
            type="text"
            value={`${window.location.origin}/join/${roomId}?token=${room.visitor_token}`}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button onClick={() => navigator.clipboard.writeText(
            `${window.location.origin}/join/${roomId}?token=${room.visitor_token}`
          )}>
            Copy
          </button>
        </div>
      </div>
      
      <div className="admin-panels">
        <div className="panel waiting-panel">
          <h2>Waiting ({waitingItems.length})</h2>
          {waitingItems.length === 0 ? (
            <p className="empty-message">No one is waiting</p>
          ) : (
            <div className="queue-items">
              {waitingItems.map(item => (
                <QueueItem
                  key={item.id}
                  item={item}
                  isAdmin={true}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="panel serving-panel">
          <h2>Currently Serving ({servingItems.length})</h2>
          {servingItems.length === 0 ? (
            <p className="empty-message">No one is being served</p>
          ) : (
            <div className="queue-items">
              {servingItems.map(item => (
                <QueueItem
                  key={item.id}
                  item={item}
                  isAdmin={true}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="panel completed-panel">
          <h2>Completed ({completedItems.length})</h2>
          {completedItems.length === 0 ? (
            <p className="empty-message">No completed visits</p>
          ) : (
            <div className="queue-items">
              {completedItems.map(item => (
                <QueueItem
                  key={item.id}
                  item={item}
                  isAdmin={true}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminView; 