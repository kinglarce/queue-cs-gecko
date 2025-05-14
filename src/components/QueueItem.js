import React from 'react';

const QueueItem = ({ item, isAdmin, onUpdateStatus }) => {
  const { id, name, ticket_number, status, joined_at } = item;
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getWaitTime = (timestamp) => {
    const joinedTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();
    const waitTimeMinutes = Math.floor((currentTime - joinedTime) / (1000 * 60));
    
    if (waitTimeMinutes < 1) return 'Just now';
    if (waitTimeMinutes === 1) return '1 minute';
    return `${waitTimeMinutes} minutes`;
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'serving':
        return 'Being Served';
      case 'completed':
        return 'Complete';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  };
  
  return (
    <div className={`queue-item status-${status}`}>
      <div className="item-header">
        <span className="ticket-number">#{ticket_number}</span>
        <span className="item-name">{name}</span>
      </div>
      
      <div className="item-details">
        <div className="detail-row">
          <span className="detail-label">Joined:</span>
          <span className="detail-value">{formatTime(joined_at)}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Wait time:</span>
          <span className="detail-value">{getWaitTime(joined_at)}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className={`detail-value status-${status}`}>{getStatusLabel(status)}</span>
        </div>
      </div>
      
      {isAdmin && status === 'waiting' && (
        <button 
          className="status-btn serve-btn"
          onClick={() => onUpdateStatus(id, 'serving')}
        >
          Serve Now
        </button>
      )}
      
      {isAdmin && status === 'serving' && (
        <div className="action-buttons">
          <button 
            className="status-btn complete-btn"
            onClick={() => onUpdateStatus(id, 'completed')}
          >
            Complete
          </button>
          <button 
            className="status-btn no-show-btn"
            onClick={() => onUpdateStatus(id, 'no_show')}
          >
            No Show
          </button>
        </div>
      )}
    </div>
  );
};

export default QueueItem; 