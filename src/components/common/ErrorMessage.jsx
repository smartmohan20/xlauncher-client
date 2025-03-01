import React from 'react';

/**
 * Error message display component
 */
const ErrorMessage = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm ${className}`}>
      <span className="font-medium">Error: </span>
      {message}
    </div>
  );
};

export default ErrorMessage;