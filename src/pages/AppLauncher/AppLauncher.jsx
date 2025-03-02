import React, { useState, useEffect, useCallback } from 'react';
import { FiHome, FiRefreshCw, FiWifi, FiXCircle } from 'react-icons/fi';
import useWebSocket from '../../hooks/useWebSocket';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import AppIcon from '../../components/AppIcon/AppIcon';

/**
 * Application launcher component
 * Displays application grid and handles app launching
 */
const AppLauncher = () => {
  // State management
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [launchedApp, setLaunchedApp] = useState(null);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Connect to WebSocket
  const { 
    status, 
    connect, 
    disconnect, 
    sendMessage, 
    messages, 
    error 
  } = useWebSocket();

  // Auto-connect on component load
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    connect(wsUrl);

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Request app list when connected
  useEffect(() => {
    if (status === 'CONNECTED') {
      requestAppList();
    }
    
    if (status === 'DISCONNECTED' || status === 'NOT_INITIALIZED') {
      setConnectionError('Not connected to server. Please check your connection.');
    } else {
      setConnectionError(null);
    }
  }, [status, sendMessage]);

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
            <button 
              onClick={() => connect(import.meta.env.VITE_WEBSOCKET_URL)}
              className="mt-4 px-4 py-2 bg-black text-white rounded-md flex items-center justify-center"
            >
              <FiRefreshCw className="mr-2" />
              Reconnect
            </button>
          </div>
        )}
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
        
        <button 
          onClick={goHome}
          className="mt-8 px-4 py-2 bg-black text-white rounded-md flex items-center justify-center"
        >
          <FiXCircle className="mr-2" />
          Cancel
        </button>
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
          <h2 className="text-lg font-medium mt-4 text-center">{launchedApp.name} is running</h2>
        </div>
        
        <button 
          onClick={goHome}
          className="mt-4 px-6 py-3 bg-black text-white rounded-full flex items-center justify-center"
        >
          <FiHome className="mr-2" size={18} />
          Home
        </button>
      </div>
    );
  }

  // Render app grid (main view)
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Application Launcher</h1>
        <div className="flex items-center">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-600">{status === 'CONNECTED' ? 'Connected' : 'Disconnected'}</span>
        </div>
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
          <button 
            onClick={requestAppList}
            className="px-4 py-2 bg-black text-white rounded-md flex items-center mx-auto"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
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
      
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center">
        <button 
          onClick={goHome}
          className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <FiHome size={24} />
        </button>
      </div>
    </div>
  );
};

export default AppLauncher;