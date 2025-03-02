import React, { useState, useEffect, useCallback } from 'react';
import { FiHome, FiTrash2, FiPlus, FiSave, FiUpload, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../../hooks/useWebSocket';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import AppIcon from '../../components/AppIcon/AppIcon';
import ConnectionStatus from '../../components/common/ConnectionStatus';
import Button from '../../components/common/Button';

/**
 * Settings component for application management
 * Only enabled on Windows platform
 */
const Settings = () => {
  // Navigation hook
  const navigate = useNavigate();

  // State management
  const [apps, setApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [platformError, setPlatformError] = useState(null);
  const [isWindows, setIsWindows] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [configPath, setConfigPath] = useState('./config/apps.json');

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

  // Auto-connect on component load
  useEffect(() => {
    if (!isWindows) return;
    
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    
    // Only connect if not already connected
    if (status !== 'CONNECTED') {
      connect(wsUrl);
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, status, isWindows]);

  // Request app list when connected
  useEffect(() => {
    if (status === 'CONNECTED' && isWindows) {
      requestAppList();
    }
  }, [status, isWindows]);

  // Process incoming messages
  useEffect(() => {
    if (!isWindows) return;
    
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.direction === 'incoming') {
        processServerMessage(latestMessage.content);
      }
    }
  }, [messages, isWindows]);

  // Process server messages
  const processServerMessage = useCallback((message) => {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      
      // Handle app list response
      if (data.type === 'app_list') {
        setApps(data.apps || []);
        setIsLoading(false);
      }
      
      // Handle add app result
      if (data.type === 'add_app_result') {
        if (data.success) {
          requestAppList(); // Refresh app list
        } else {
          console.error('Failed to add application:', data.error);
        }
      }
      
      // Handle remove app result
      if (data.type === 'remove_app_result') {
        if (data.success) {
          requestAppList(); // Refresh app list
        } else {
          console.error('Failed to remove application:', data.error);
        }
      }
      
      // Handle save config result
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
          requestAppList(); // Refresh app list
          console.log('Configuration loaded successfully');
        } else {
          console.error('Failed to load configuration:', data.error);
        }
      }
      
      // Handle upload config result
      if (data.type === 'upload_config_result') {
        if (data.success) {
          requestAppList(); // Refresh app list
          console.log('Configuration uploaded and loaded successfully');
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

  // Navigate to the launcher page
  const goToLauncher = useCallback(() => {
    navigate('/launcher');
  }, [navigate]);

  // Render loading state
  if (isLoading && isWindows) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <Loading size="xl" className="mb-4" />
        <h2 className="text-lg font-medium">Loading settings...</h2>
        <p className="text-sm text-gray-500 mt-2">Connecting to server...</p>
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
                />
              </div>
              <Button 
                onClick={handleUploadConfig} 
                disabled={!selectedFile}
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
            >
              <FiRefreshCw className="mr-1" />
              Refresh
            </Button>
            <Button 
              onClick={handleAddApp} 
              className="flex items-center"
              size="sm"
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
            <Button onClick={handleAddApp} className="flex items-center mx-auto">
              <FiPlus className="mr-2" />
              Add Application
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Path
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <div className="text-sm text-gray-500 max-w-xs truncate">{app.path}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{app.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full text-gray-800">
                        {app.type || "EXECUTABLE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        onClick={() => handleRemoveApp(app.id)}
                        variant="ghost" 
                        size="xs"
                        className="text-red-600 hover:text-red-900 flex items-center ml-auto"
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
        )}
      </div>
      
      <ConnectionStatus status={status} />
    </div>
  );
};

export default Settings;