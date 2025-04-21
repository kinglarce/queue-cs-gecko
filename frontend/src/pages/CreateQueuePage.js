import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useQueueStore from '../store/queueStore';

function CreateQueuePage() {
  const [queueName, setQueueName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const { createQueue, isLoading } = useQueueStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!queueName.trim()) {
      setError('Please enter a queue name');
      return;
    }
    
    try {
      const result = await createQueue(queueName);
      if (result) {
        // Store admin secret in localStorage for this session
        localStorage.setItem(`admin_${result.queueId}`, result.adminSecret);
        
        // Navigate to admin page
        navigate(`/admin/${result.queueId}`);
      } else {
        setError('Failed to create queue. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a New Queue</h1>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="queueName" className="block text-sm font-medium text-gray-700 mb-1">
                  Queue Name
                </label>
                <input
                  type="text"
                  id="queueName"
                  className="input"
                  placeholder="e.g., Clinic Reception, Restaurant Waiting List..."
                  value={queueName}
                  onChange={(e) => setQueueName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  className="btn-primary w-full py-3 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Queue'}
                </button>
              </div>
            </form>
            
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">What happens next?</h2>
              <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                <li>Once your queue is created, you'll get a unique admin link.</li>
                <li>You can print a QR code poster for visitors to scan and join the queue.</li>
                <li>You'll have a separate display link to show the current queue status on a screen.</li>
                <li><strong>Important:</strong> Save your admin link. It's the only way to manage your queue!</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default CreateQueuePage; 