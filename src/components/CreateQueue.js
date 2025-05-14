import React, { useState } from 'react';
import { createQueueRoom } from '../utils/queueHelpers';

const CreateQueue = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newQueue, setNewQueue] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Queue name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const queueData = await createQueueRoom(name, description);
      setNewQueue(queueData);
    } catch (err) {
      setError(err.message || 'Failed to create queue');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (newQueue) {
    return (
      <div className="create-success">
        <h2>Queue Created Successfully!</h2>
        <p>Your queue "{newQueue.name}" is now ready.</p>
        
        <div className="link-box">
          <h3>Admin Link</h3>
          <p>Use this link to manage your queue:</p>
          <div className="url-container">
            <input
              type="text"
              value={newQueue.adminUrl}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button onClick={() => navigator.clipboard.writeText(newQueue.adminUrl)}>
              Copy
            </button>
          </div>
        </div>
        
        <div className="link-box">
          <h3>Visitor Link</h3>
          <p>Share this link with people to join your queue:</p>
          <div className="url-container">
            <input
              type="text"
              value={newQueue.visitorUrl}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button onClick={() => navigator.clipboard.writeText(newQueue.visitorUrl)}>
              Copy
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setNewQueue(null);
            setName('');
            setDescription('');
          }}
          className="create-another-btn"
        >
          Create Another Queue
        </button>
      </div>
    );
  }
  
  return (
    <div className="create-queue">
      <h1>Create a Support Queue</h1>
      <p>Create a virtual queue for HYROX event participants or customers.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="queue-name">Queue Name *</label>
          <input
            id="queue-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g. Registration Support, Event Info, etc."
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="queue-description">Description (Optional)</label>
          <textarea
            id="queue-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this support queue"
            disabled={isLoading}
            rows={3}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading} 
          className="submit-btn"
        >
          {isLoading ? 'Creating...' : 'Create Queue'}
        </button>
      </form>
    </div>
  );
};

export default CreateQueue; 