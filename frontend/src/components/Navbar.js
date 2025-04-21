import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600 flex items-center">
                <span role="img" aria-label="gecko" className="mr-2 text-xl">🦎</span>
                CS Gecko Queue
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-4 md:items-center">
              <Link to="/examples/form" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Form Example
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Link
              to="/create"
              className="btn-primary"
            >
              Create a Queue
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 