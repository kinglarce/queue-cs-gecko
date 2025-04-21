import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import QRCodeGenerator from '../components/QRCodeGenerator';
import useQueueStore from '../store/queueStore';

function QRPosterPage() {
  const { queueId } = useParams();
  const posterRef = useRef();
  
  const { 
    currentQueue, 
    isLoading, 
    loadQueue
  } = useQueueStore();
  
  // Load queue data
  useEffect(() => {
    if (queueId) {
      loadQueue(queueId);
    }
  }, [queueId, loadQueue]);
  
  // Create visitor URL
  const visitorUrl = `${window.location.origin}/queue/${queueId}`;
  
  // Handle printing
  const handlePrint = useReactToPrint({
    content: () => posterRef.current,
  });
  
  if (isLoading && !currentQueue) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-xl text-gray-600">Loading queue information...</p>
      </div>
    );
  }
  
  if (!currentQueue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Queue Not Found</h1>
        <p className="text-lg text-gray-600 mb-8">The queue you're looking for doesn't exist or has been deleted.</p>
        <Link to="/" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium">
          Return Home
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
              Queue Poster for {currentQueue.name}
            </h1>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrint}
                className="btn-primary"
              >
                Print Poster
              </button>
              <Link 
                to={`/admin/${queueId}`}
                className="btn-outline"
              >
                Back to Admin
              </Link>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-1 text-blue-800">
              <li>Click the "Print Poster" button to print this poster.</li>
              <li>Place the printed poster at your entrance or reception.</li>
              <li>Visitors can scan the QR code with their phone's camera to join the queue.</li>
              <li>No app installation is required for visitors.</li>
            </ol>
          </div>
        </div>
        
        {/* Printable Poster */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden" ref={posterRef}>
          <div className="p-10 border-b-8 border-primary-600">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {currentQueue.name}
              </h1>
              <p className="text-xl text-gray-600">Skip the line! Join our queue electronically.</p>
            </div>
            
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="mb-8">
                <QRCodeGenerator url={visitorUrl} size={300} />
              </div>
              
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Scan this QR code to join the queue
              </h2>
              <p className="text-center text-gray-600 max-w-md">
                Use your phone's camera to scan this code. 
                You'll be able to see your position in line and receive a notification when it's your turn.
              </p>
            </div>
            
            <div className="mt-12 border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-800 text-lg font-bold mx-auto mb-2">
                    1
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Scan Code</h3>
                  <p className="text-sm text-gray-600">Use your phone's camera to scan this QR code</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-800 text-lg font-bold mx-auto mb-2">
                    2
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Wait Anywhere</h3>
                  <p className="text-sm text-gray-600">No need to wait in line. You can wait outside or nearby.</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-800 text-lg font-bold mx-auto mb-2">
                    3
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Get Notified</h3>
                  <p className="text-sm text-gray-600">Your phone will notify you when it's your turn</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-6 text-center">
            <p className="text-sm text-gray-500">
              If you cannot scan the QR code, visit: <strong>{visitorUrl}</strong>
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center text-gray-500">
          <p>
            Powered by Queue Management System © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default QRPosterPage;