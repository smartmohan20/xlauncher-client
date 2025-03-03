import React from 'react';

/**
 * Application footer component
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="app-container">
        <div className="text-center text-xs text-gray-500">
          <p>© {currentYear} XLauncher. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;