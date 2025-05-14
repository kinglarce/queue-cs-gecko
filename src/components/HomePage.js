import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CreateQueue from './CreateQueue';

const HomePage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>HYROX Customer Support Queue System</h1>
        <p className="tagline">
          Efficient queue management for HYROX customer support
        </p>
      </div>
      
      <div className="features-section">
        <div className="feature">
          <h3>Create Support Queues</h3>
          <p>Easily create digital support queues for your HYROX event.</p>
        </div>
        
        <div className="feature">
          <h3>Manage Visitors</h3>
          <p>Track and serve visitors efficiently with real-time updates.</p>
        </div>
        
        <div className="feature">
          <h3>Real-time Updates</h3>
          <p>Visitors receive instant notifications about their queue position.</p>
        </div>
      </div>
      
      <div className="actions-section">
        {!showCreateForm ? (
          <>
            <button 
              className="primary-btn" 
              onClick={() => setShowCreateForm(true)}
            >
              Create New Queue
            </button>
            
            <div className="join-instructions">
              <h3>Already have a queue link?</h3>
              <p>
                If you received an admin or visitor link, simply click it to access your queue.
              </p>
            </div>
            
            <div className="how-it-works">
              <h3>How It Works</h3>
              <ol>
                <li>Create a new support queue for your HYROX event</li>
                <li>Share the visitor link with event participants</li>
                <li>Manage the queue through your admin dashboard</li>
                <li>Visitors join the queue and receive real-time updates</li>
              </ol>
            </div>
          </>
        ) : (
          <>
            <button 
              className="secondary-btn back-btn" 
              onClick={() => setShowCreateForm(false)}
            >
              Back to Home
            </button>
            
            <CreateQueue />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage; 