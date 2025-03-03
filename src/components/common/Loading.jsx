import React from 'react';

/**
 * Loading spinner component
 */
const Loading = ({ size = 'md', className = '' }) => {
  // Size classes mapping
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={`inline-block ${className}`}>
      <div
        className={`
          border-2 border-current border-solid rounded-full
          border-r-transparent animate-spin
          ${sizeClasses[size]}
        `}
        style={{ borderTopColor: 'currentColor' }}
      />
    </div>
  );
};

export default Loading;