import React, { useState, useEffect, useCallback } from 'react';
import { FiHome, FiRefreshCw, FiWifi, FiXCircle, FiLogOut, FiSettings } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import useWebSocket from '../../hooks/useWebSocket';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import AppIcon from '../../components/AppIcon/AppIcon';
import ConnectionStatus from '../../components/common/ConnectionStatus';

/**
 * Application launcher component
 * Displays application grid and handles app launching
 */
const AppLauncher = () => {
  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [launchedApp, setLaunchedApp] = useState(null);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isWindows, setIsWindows] = useState(false);

  // Connect to WebSocket
  const { 
    status, 
    connect, 
    disconnect, 
    sendMessage, 
    messages, 
    error 
  } = useWebSocket();

  // Check if we're on Windows platform
  useEffect(() => {
    // In a real app, you'd use a more reliable method to detect platform
    // This is a simplified approach for demonstration
    const userAgent = window.navigator.userAgent;
    const isWindowsPlatform = userAgent.indexOf("Windows") > -1;
    setIsWindows(isWindowsPlatform);
  }, []);

  // Auto-connect on component load or route change
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    
    // Only connect if not already connected
    if (status !== 'CONNECTED') {
      connect(wsUrl);
    }
    
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      // Only disconnect if actually leaving the component
      if (!location.pathname.includes('/launcher')) {
        disconnect();
      }
    };
  }, [connect, disconnect, status, location]);

  // Request app list when connected
  useEffect(() => {
    if (status === 'CONNECTED' && isInitialized) {
      requestAppList();
    }
    
    if (status === 'DISCONNECTED' || status === 'NOT_INITIALIZED') {
      setConnectionError('Not connected to server. Please check your connection.');
    } else {
      setConnectionError(null);
    }
  }, [status, sendMessage, isInitialized]);

  // Process incoming messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.direction === 'incoming') {
        processServerMessage(latestMessage.content);
      }
    }
  }, [messages]);

  // Process server messages
  const processServerMessage = useCallback((message) => {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      
      // Handle app list response
      if (data.type === 'app_list') {
        setApps(data.apps || []);
        setIsLoading(false);
      }
      
      // Handle app launch response
      if (data.type === 'launch_result') {
        if (data.success) {
          setLaunchLoading(false);
        } else {
          setLaunchLoading(false);
          setLaunchedApp(null);
        }
      }
    } catch (error) {
      console.error('Error processing server message:', error);
    }
  }, []);

  // Request app list from server
  const requestAppList = useCallback(() => {
    setIsLoading(true);
    sendMessage({
      type: 'list_apps'
    });
  }, [sendMessage]);

  // Launch an application
  const launchApp = useCallback((app) => {
    setLaunchedApp(app);
    setLaunchLoading(true);
    
    sendMessage({
      type: 'launch_app',
      data: {
        path: app.path,
        arguments: []
      }
    });
  }, [sendMessage]);

  // Go back to home (close launched app)
  const goHome = useCallback(() => {
    if (launchedApp) {
      sendMessage({
        type: 'close_app',
        data: {
          id: launchedApp.id
        }
      });
      setLaunchedApp(null);
      setLaunchLoading(false);
    }
  }, [launchedApp, sendMessage]);

  // Quit to main app page
  const handleQuit = useCallback(() => {
    // Close any running app before quitting
    if (launchedApp) {
      sendMessage({
        type: 'close_app',
        data: {
          id: launchedApp.id
        }
      });
    }
    
    // Navigate to main app page
    navigate('/');
  }, [navigate, launchedApp, sendMessage]);

  // Navigate to settings page
  const goToSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  // Reconnect to WebSocket
  const handleReconnect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    connect(wsUrl);
  }, [connect]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <Loading size="xl" className="mb-4" />
        <h2 className="text-lg font-medium">Loading applications...</h2>
        <p className="text-sm text-gray-500 mt-2">Connecting to server...</p>
        
        {connectionError && (
          <div className="mt-6">
            <ErrorMessage message={connectionError} />
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button 
                onClick={handleReconnect}
                className="px-4 py-2 bg-black text-white rounded-md flex items-center justify-center"
              >
                <FiRefreshCw className="mr-2" />
                Reconnect
              </button>
              
              <button 
                onClick={handleQuit}
                className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center justify-center"
              >
                <FiLogOut className="mr-2" />
                Quit
              </button>
            </div>
          </div>
        )}
        
        {/* Display connection status even in loading state */}
        <ConnectionStatus status={status} />
      </div>
    );
  }

  // Render app launch loading state
  if (launchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <Loading size="xl" className="mb-4" />
        <h2 className="text-lg font-medium">Launching {launchedApp?.name}...</h2>
        <p className="text-sm text-gray-500 mt-2">This application is starting on the server</p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button 
            onClick={goHome}
            className="px-4 py-2 bg-black text-white rounded-md flex items-center justify-center"
          >
            <FiXCircle className="mr-2" />
            Cancel
          </button>
          
          <button 
            onClick={handleQuit}
            className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center justify-center"
          >
            <FiLogOut className="mr-2" />
            Quit
          </button>
        </div>
        
        {/* Display connection status in launch loading state */}
        <ConnectionStatus status={status} />
      </div>
    );
  }

  // Render launched app state
  if (launchedApp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <div className="mb-6">
          <AppIcon 
            icon={launchedApp.icon}
            name={launchedApp.name}
            size="lg"
            className="mx-auto"
          />
          <h2 className="text-lg font-medium mt-4 text-center">{launchedApp.name} is running...</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button 
            onClick={goHome}
            className="px-6 py-3 bg-black text-white rounded-full flex items-center justify-center"
          >
            <FiHome className="mr-2" size={18} />
            Home
          </button>
          
          <button 
            onClick={handleQuit}
            className="px-6 py-3 bg-red-600 text-white rounded-full flex items-center justify-center"
          >
            <FiLogOut className="mr-2" size={18} />
            Quit
          </button>
        </div>
        
        {/* Display connection status in launched app state */}
        <ConnectionStatus status={status} />
      </div>
    );
  }

  // Render app grid (main view)
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Application Launcher</h1>
        {/* Only show settings button on Windows */}
        {isWindows && (
          <button 
            onClick={goToSettings}
            className="px-3 py-2 bg-black text-white rounded-md flex items-center justify-center"
          >
            <FiSettings className="mr-2" />
            Settings
          </button>
        )}
      </div>
      
      {error && <ErrorMessage message={error} className="mb-4" />}
      
      {apps.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiWifi size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No applications found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            The server didn't return any applications. Make sure the server is running and applications are properly configured.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={requestAppList}
              className="px-4 py-2 bg-black text-white rounded-md flex items-center justify-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
            
            <button 
              onClick={handleQuit}
              className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center justify-center"
            >
              <FiLogOut className="mr-2" />
              Quit
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {apps.map((app) => (
            <div 
              key={app.id} 
              className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => launchApp(app)}
            >
              <div className="w-16 h-16 mb-2 flex items-center justify-center">
                <AppIcon 
                  icon={app.icon}
                  name={app.name}
                  size="md"
                />
              </div>
              <span className="text-xs text-center font-medium truncate w-full">{app.name}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-4">
        <button 
          onClick={goHome}
          className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <FiHome size={24} />
        </button>
        
        {/* Only show settings button on Windows */}
        {isWindows && (
          <button 
            onClick={goToSettings}
            className="w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg"
          >
            <FiSettings size={24} />
          </button>
        )}
        
        <button 
          onClick={handleQuit}
          className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <FiLogOut size={24} />
        </button>
      </div>
      
      {/* Display the connection status component */}
      <ConnectionStatus status={status} />
    </div>
  );
};

export default AppLauncher;