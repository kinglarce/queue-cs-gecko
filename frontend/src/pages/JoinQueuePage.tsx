import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

/**
 * JoinQueuePage component
 * 
 * Allows users to enter a queue ID to join an existing queue
 */
const JoinQueuePage: React.FC = () => {
  const [queueId, setQueueId] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'scan'>('manual');
  const navigate = useNavigate();
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate queue ID
    const trimmedQueueId = queueId.trim();
    if (!trimmedQueueId) {
      setError('Please enter a queue ID');
      return;
    }
    
    // Navigate to the visitor page for this queue
    navigate(`/queue/${trimmedQueueId}`);
  };
  
  // Function to handle camera access and QR code scanning
  const requestCameraAccess = async () => {
    try {
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported by your browser');
        return;
      }
      
      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // In a real implementation, we would integrate a QR code scanner library here
      alert('This is a placeholder for QR code scanning functionality. In a real implementation, a QR code scanner would be integrated here.');
      
      // For demonstration purposes, we'll just switch back to manual entry
      setActiveTab('manual');
      
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Failed to access camera. Please check camera permissions or enter the queue ID manually.');
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Join a Queue</h1>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  className={`py-2 px-4 font-medium ${
                    activeTab === 'manual'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('manual')}
                >
                  Enter ID Manually
                </button>
                <button
                  className={`py-2 px-4 font-medium ${
                    activeTab === 'scan'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    setActiveTab('scan');
                    requestCameraAccess();
                  }}
                >
                  Scan QR Code
                </button>
              </div>
            </div>
            
            {activeTab === 'manual' ? (
              <>
                <p className="text-gray-600 mb-6">
                  Enter the queue ID provided by the organization you're visiting to join their queue.
                </p>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <Input
                      label="Queue ID"
                      value={queueId}
                      onChange={(e) => setQueueId(e.target.value)}
                      placeholder="Enter the queue ID"
                      helperText="The queue ID is typically provided via a QR code or direct link"
                      required
                    />
                  </div>
                  
                  {/* Example Queue ID Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Example:</h3>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 p-1 rounded text-sm">f47ac10b-58cc-4372-a567-0e02b2c3d479</code>
                      <button
                        type="button"
                        className="text-xs text-primary-600 hover:text-primary-800"
                        onClick={() => setQueueId('f47ac10b-58cc-4372-a567-0e02b2c3d479')}
                      >
                        Use this example
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This is a demo queue ID for testing purposes. In a real scenario, you would get a unique queue ID.
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Join Queue
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center p-8">
                <div className="mx-auto w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <p className="text-gray-500">Camera preview would appear here</p>
                </div>
                <p className="text-gray-600 mb-4">Point your camera at the QR code to join the queue.</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('manual')}
                >
                  Switch to Manual Entry
                </Button>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Don't have a queue ID?</h2>
              <p className="text-gray-600 mb-4">
                If you need to join a queue but don't have a queue ID, you may need to:
              </p>
              <ul className="list-disc pl-5 mb-4 text-gray-600 space-y-2">
                <li>Scan a QR code at the location</li>
                <li>Ask a staff member for the queue ID</li>
                <li>Use a direct link provided to you</li>
              </ul>
              <p className="text-gray-600">
                Alternatively, you can <a href="/create" className="text-primary-600 hover:text-primary-800">create your own queue</a> if needed.
              </p>
            </div>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default JoinQueuePage; 