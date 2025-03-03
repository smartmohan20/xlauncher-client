import React, { useState, useEffect, useCallback } from 'react';
import { FiHome, FiTrash2, FiPlus, FiSave, FiUpload, FiDownload, FiRefreshCw, FiLogOut } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import useWebSocket from '../../hooks/useWebSocket';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import AppIcon from '../../components/AppIcon/AppIcon';
import ConnectionStatus from '../../components/common/ConnectionStatus';
import Button from '../../components/common/Button';

/**
 * Settings component for application management
 * Modeled directly after AppLauncher for consistent behavior
 */
const Settings = () => {
  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [platformError, setPlatformError] = useState(null);
  const [isWindows, setIsWindows] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [configPath, setConfigPath] = useState('./config/apps.json');
  const [connectionError, setConnectionError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // WebSocket hook
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
    
    if (!isWindowsPlatform) {
      setPlatformError("Settings are only available on Windows devices");
    }
  }, []);

  // Auto-connect on component load or route change
  useEffect(() => {
    if (!isWindows) return;
    
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    
    // Only connect if not already connected
    if (status !== 'CONNECTED') {
      console.log('Settings: Connecting to WebSocket...');
      connect(wsUrl);
    }
    
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      // Only disconnect if actually leaving the component
      if (!location.pathname.includes('/settings')) {
        disconnect();
      }
    };
  }, [connect, disconnect, status, location, isWindows]);

  // Request app list when connected
  useEffect(() => {
    if (status === 'CONNECTED' && isInitialized && isWindows) {
      console.log('Settings: WebSocket connected, requesting app list...');
      requestAppList();
    }
    
    if (status === 'DISCONNECTED' || status === 'NOT_INITIALIZED') {
      setConnectionError('Not connected to server. Please check your connection.');
    } else {
      setConnectionError(null);
    }
  }, [status, isInitialized, isWindows]);

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
        console.log('Settings: Received app list:', data.apps?.length || 0, 'apps');
        setApps(data.apps || []);
        setIsLoading(false);
      }
      
      // Handle add app result
      if (data.type === 'add_app_result') {
        if (data.success) {
          console.log('App added successfully, refreshing list...');
          requestAppList();
        } else {
          console.error('Failed to add application:', data.error);
        }
      }
      
      // Handle remove app result
      if (data.type === 'remove_app_result') {
        if (data.success) {
          console.log('App removed successfully, refreshing list...');
          requestAppList();
        } else {
          console.error('Failed to remove application:', data.error);
        }
      }
      
      // Handle other message types
      if (data.type === 'save_config_result') {
        if (data.success) {
          console.log('Configuration saved successfully');
        } else {
          console.error('Failed to save configuration:', data.error);
        }
      }
      
      // Handle load config result
      if (data.type === 'load_config_result') {
        if (data.success) {
          console.log('Configuration loaded successfully, refreshing list...');
          requestAppList();
        } else {
          console.error('Failed to load configuration:', data.error);
        }
      }
      
      // Handle upload config result
      if (data.type === 'upload_config_result') {
        if (data.success) {
          console.log('Configuration uploaded successfully, refreshing list...');
          requestAppList();
        } else {
          console.error('Failed to upload configuration:', data.error);
        }
      }
    } catch (error) {
      console.error('Error processing server message:', error);
    }
  }, []);

  // Request app list from server
  const requestAppList = useCallback(() => {
    console.log('Settings: Sending list_apps request...');
    setIsLoading(true);
    
    sendMessage({
      type: 'list_apps'
    });
  }, [sendMessage]);

  // Add a new application
  const handleAddApp = useCallback(() => {
    // In a browser environment, we can't directly access the filesystem,
    // so we'll use a custom dialog approach via the WebSocket server
    
    // First, prompt the user for application details
    const appName = prompt("Enter application name:");
    if (!appName) return; // User cancelled
    
    const appPath = prompt("Enter application path (e.g., C:\\Windows\\System32\\notepad.exe):");
    if (!appPath) return; // User cancelled
    
    const appArgs = prompt("Enter application arguments (comma separated):", "");
    const appArgArray = appArgs ? appArgs.split(',').map(arg => arg.trim()) : [];
    
    // Generate a simple ID from the app name
    const appId = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Send the add app request
    sendMessage({
      type: 'add_app',
      data: {
        id: appId,
        name: appName,
        path: appPath,
        arguments: appArgArray
      }
    });
  }, [sendMessage]);

  // Remove an application
  const handleRemoveApp = useCallback((appId) => {
    if (confirm(`Are you sure you want to remove this application?`)) {
      sendMessage({
        type: 'remove_app',
        data: {
          id: appId
        }
      });
    }
  }, [sendMessage]);

  // Save configuration
  const handleSaveConfig = useCallback(() => {
    const customPath = prompt("Enter path to save config (or leave blank for default):", configPath);
    
    if (customPath !== null) { // User didn't cancel
      sendMessage({
        type: 'save_config',
        data: {
          path: customPath || configPath
        }
      });
      
      if (customPath) {
        setConfigPath(customPath);
      }
    }
  }, [sendMessage, configPath]);

  // Load configuration
  const handleLoadConfig = useCallback(() => {
    const customPath = prompt("Enter path to load config from:", configPath);
    
    if (customPath !== null) { // User didn't cancel
      sendMessage({
        type: 'load_config',
        data: {
          path: customPath || configPath
        }
      });
      
      if (customPath) {
        setConfigPath(customPath);
      }
    }
  }, [sendMessage, configPath]);

  // Handle file selection for config upload
  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Upload configuration file
  const handleUploadConfig = useCallback(() => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      
      sendMessage({
        type: 'upload_config',
        data: {
          content: content
        }
      });
      
      // Clear the selected file
      setSelectedFile(null);
    };
    
    reader.readAsText(selectedFile);
  }, [sendMessage, selectedFile]);

  // Reconnect to WebSocket
  const handleReconnect = useCallback(() => {
    console.log('Settings: Manual reconnect requested');
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    connect(wsUrl);
  }, [connect]);

  // Navigate to the launcher page
  const goToLauncher = useCallback(() => {
    navigate('/launcher');
  }, [navigate]);

  // Quit to main app page
  const handleQuit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <Loading size="xl" className="mb-4" />
        <h2 className="text-lg font-medium">Loading settings...</h2>
        <p className="text-sm text-gray-500 mt-2">
          {status === 'CONNECTED' ? 'Retrieving application list...' : 'Connecting to server...'}
        </p>
        
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
        
        <ConnectionStatus status={status} />
      </div>
    );
  }

  // Render platform error
  if (platformError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <ErrorMessage message={platformError} />
        <Button onClick={goToLauncher} className="mt-4">
          Back to Launcher
        </Button>
      </div>
    );
  }

  // Main settings view
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Application Settings</h1>
          <Button onClick={goToLauncher} variant="outline" className="flex items-center">
            <FiHome className="mr-2" />
            Back to Launcher
          </Button>
        </div>
        
        {error && <ErrorMessage message={error} className="mb-4" />}
        
        {/* Connection status indicator */}
        {status !== 'CONNECTED' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-yellow-700 text-sm flex items-center justify-between">
              <span>Connection Status: {status}</span>
              <Button 
                onClick={handleReconnect}
                size="xs"
                className="inline-flex items-center"
              >
                <FiRefreshCw className="mr-1" />
                Reconnect
              </Button>
            </p>
          </div>
        )}
        
        {/* Config Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4 flex flex-col">
            <h3 className="text-md font-medium mb-3">Save Configuration</h3>
            <p className="text-sm text-gray-600 mb-3">
              Save current application list to a configuration file
            </p>
            <Button 
              onClick={handleSaveConfig} 
              className="mt-auto flex items-center justify-center"
              disabled={status !== 'CONNECTED'}
            >
              <FiSave className="mr-2" />
              Save Config
            </Button>
          </div>
          
          <div className="card p-4 flex flex-col">
            <h3 className="text-md font-medium mb-3">Load Configuration</h3>
            <p className="text-sm text-gray-600 mb-3">
              Load application list from a configuration file
            </p>
            <Button 
              onClick={handleLoadConfig} 
              className="mt-auto flex items-center justify-center"
              disabled={status !== 'CONNECTED'}
            >
              <FiDownload className="mr-2" />
              Load Config
            </Button>
          </div>
          
          <div className="card p-4 flex flex-col">
            <h3 className="text-md font-medium mb-3">Upload Configuration</h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload a JSON configuration file
            </p>
            <div className="flex flex-col space-y-2 mt-auto">
              <div className="flex items-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-black file:text-white"
                  disabled={status !== 'CONNECTED'}
                />
              </div>
              <Button 
                onClick={handleUploadConfig} 
                disabled={!selectedFile || status !== 'CONNECTED'}
                className="flex items-center justify-center"
              >
                <FiUpload className="mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>
        
        {/* Applications List */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">Registered Applications</h2>
          <div className="flex gap-2">
            <Button 
              onClick={requestAppList} 
              variant="outline" 
              className="flex items-center"
              size="sm"
              disabled={status !== 'CONNECTED'}
            >
              <FiRefreshCw className="mr-1" />
              Refresh
            </Button>
            <Button 
              onClick={handleAddApp} 
              className="flex items-center"
              size="sm"
              disabled={status !== 'CONNECTED'}
            >
              <FiPlus className="mr-1" />
              Add App
            </Button>
          </div>
        </div>
        
        {apps.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-2">No applications registered</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Add applications to your launcher to get started.
            </p>
            <Button 
              onClick={handleAddApp} 
              className="flex items-center mx-auto"
              disabled={status !== 'CONNECTED'}
            >
              <FiPlus className="mr-2" />
              Add Application
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Application
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                      Path
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <AppIcon 
                              icon={app.icon}
                              name={app.name}
                              size="sm"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{app.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 truncate max-w-xs">{app.path}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{app.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full text-gray-800">
                          {app.type || "EXECUTABLE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button 
                          onClick={() => handleRemoveApp(app.id)}
                          variant="ghost" 
                          size="xs"
                          className="text-red-600 hover:text-red-900 flex items-center ml-auto"
                          disabled={status !== 'CONNECTED'}
                        >
                          <FiTrash2 className="mr-1" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-4">
        <button 
          onClick={goToLauncher}
          className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <FiHome size={24} />
        </button>
        
        <button 
          onClick={handleQuit}
          className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <FiLogOut size={24} />
        </button>
      </div>
      
      <ConnectionStatus status={status} />
    </div>
  );
};

export default Settings;