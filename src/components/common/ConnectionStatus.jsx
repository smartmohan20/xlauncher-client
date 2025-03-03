import React, { useState, useEffect } from 'react';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

// Enhanced Connection Status Indicator Component
const ConnectionStatus = ({ status }) => {
  const isConnected = status === 'CONNECTED';
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto-hide after 5 seconds when connected, but keep visible when disconnected
  useEffect(() => {
    let timer;
    if (isConnected && !showDetails) {
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    } else if (!isConnected) {
      setIsVisible(true);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isConnected, showDetails]);

  // Show on hover
  const handleMouseEnter = () => {
    setIsVisible(true);
  };
  
  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex flex-col">
        <div
          className={`flex items-center bg-white border ${isConnected ? 'border-green-200' : 'border-red-200'} 
                      rounded-lg shadow-md cursor-pointer transition-all duration-300 
                      ${showDetails ? 'pl-3 pr-4 py-3' : 'p-3'}`}
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className={`relative ${showDetails ? 'mr-3' : 'mr-0'}`}>
            {isConnected ? (
              <div className="relative">
                <FiWifi size={20} className="text-green-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500"></span>
              </div>
            ) : (
              <div className="relative">
                <FiWifiOff size={20} className="text-red-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              </div>
            )}
          </div>
          
          {showDetails && (
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Server communication active' : 'Check your connection'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;