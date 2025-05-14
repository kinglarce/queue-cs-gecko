import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <Link to="/" className="logo">
            HYROX Customer Support
          </Link>
          <div className="tagline">Queue Management System</div>
        </div>
      </header>
      
      <main>{children}</main>
      
      <footer>
        <p>&copy; {new Date().getFullYear()} HYROX Customer Support</p>
      </footer>
    </div>
  );
};

export default Layout; 