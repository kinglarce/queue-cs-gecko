import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useQueueStore from '../store/queueStore';

interface CreateQueueResult {
  queueId: string;
  adminSecret: string;
}

const CreateQueuePage: React.FC = () => {
  const [queueName, setQueueName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  
  const { createQueue, isLoading } = useQueueStore();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!queueName.trim()) {
      setError('Please enter a queue name');
      return;
    }
    
    try {
      console.log('Attempting to create queue:', queueName);
      
      // Debug: Log direct access to confirm Supabase is working
      const response = await fetch('http://localhost:8000/rest/v1/queues', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
        }
      });
      console.log('Direct Supabase test response:', response.status, response.statusText);
      
      const result = await createQueue(queueName);
      
      console.log('Create queue result:', result);
      
      if (result && result.queueId && result.adminSecret) {
        // Store admin secret in localStorage for this session
        localStorage.setItem(`admin_${result.queueId}`, result.adminSecret);
        
        // Navigate to admin page
        navigate(`/admin/${result.queueId}`);
      } else {
        console.error('Failed to create queue:', result);
        setError('Failed to create queue. Please check your network connection and try again.');
      }
    } catch (err: any) {
      console.error('Error creating queue:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again later.');
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
};

export default CreateQueuePage; 