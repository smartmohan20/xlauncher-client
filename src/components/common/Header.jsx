import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Application header component
 */
const Header = () => {
  const location = useLocation();
  
  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'WebSocket', path: '/websocket' },
  ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="app-container">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-xl font-bold text-black">
              XLauncher
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  text-sm font-medium py-1 border-b-2 
                  ${location.pathname === link.path 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-black'}
                `}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;