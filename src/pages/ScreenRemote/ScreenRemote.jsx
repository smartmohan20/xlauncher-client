import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiLogOut, FiMonitor, FiMaximize, FiMinimize, FiType, FiSettings } from 'react-icons/fi';
import useWebSocket from '../../hooks/useWebSocket';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import VirtualKeyboard from '../../components/ScreenRemote/VirtualKeyboard';
import ConnectionStatus from '../../components/common/ConnectionStatus';
import ScreenControls from '../../components/ScreenRemote/ScreenControls';

const ScreenRemote = () => {
  const navigate = useNavigate();
  
  // Refs
  const screenRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [screenInfo, setScreenInfo] = useState({
    width: 1280,
    height: 720,
    quality: 70,
    fps: 15
  });
  
  // WebSocket
  const { 
    status, 
    connect, 
    disconnect, 
    sendMessage, 
    messages, 
    error 
  } = useWebSocket();

  // Initialize connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (status !== 'CONNECTED') {
      connect(wsUrl);
    }

    return () => {
      if (status === 'CONNECTED') {
        sendMessage({
          type: 'stop_sharing'
        });
        disconnect();
      }
    };
  }, []);

  // Handle connection status changes
  useEffect(() => {
    if (status === 'CONNECTED') {
      console.log('Connected to server, requesting remote details');
      // Start screen sharing immediately when connected
      startScreenSharing();
      setConnectionError(null);
    } else if (status === 'DISCONNECTED' || status === 'NOT_INITIALIZED') {
      setConnectionError('Not connected to server. Please check your connection.');
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [status]);

  // Process incoming messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.direction === 'incoming') {
        try {
          const data = typeof latestMessage.content === 'string' 
            ? JSON.parse(latestMessage.content) 
            : latestMessage.content;
          
          console.log('Received message:', data.type);
          
          // Handle sharing status response
          if (data.type === 'sharing_status') {
            console.log('Sharing status:', data);
            if (data.success || data.active) {
              setIsConnected(true);
              setIsLoading(false);
              setScreenInfo({
                width: data.width || screenInfo.width,
                height: data.height || screenInfo.height,
                quality: data.quality || screenInfo.quality,
                fps: data.fps || screenInfo.fps
              });
            }
          }
        } catch (err) {
          console.error('Error processing message:', err);
        }
      }
    }
  }, [messages]);

  // Listen for binary messages (screen frames)
  useEffect(() => {
    const handleBinaryMessage = (event) => {
      console.log('Received binary data:', event.detail);
      if (screenRef.current) {
        // Create blob URL from the binary data
        const blob = event.detail;
        const url = URL.createObjectURL(blob);
        
        // Set the image source to display the screen
        screenRef.current.src = url;
        
        // Clean up previous blob URL to avoid memory leaks
        const previousUrl = screenRef.current.dataset.previousUrl;
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
        
        // Store current URL for cleanup on next frame
        screenRef.current.dataset.previousUrl = url;
      }
    };

    // Custom event listener for WebSocket binary messages
    window.addEventListener('websocketBinaryMessage', handleBinaryMessage);

    return () => {
      window.removeEventListener('websocketBinaryMessage', handleBinaryMessage);
    };
  }, []);

  // Start screen sharing
  const startScreenSharing = () => {
    console.log('Starting screen sharing');
    setIsLoading(true);
    sendMessage({
      type: 'start_sharing',
      width: screenInfo.width,
      height: screenInfo.height,
      quality: screenInfo.quality,
      fps: screenInfo.fps
    });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Toggle virtual keyboard
  const toggleKeyboard = () => {
    setShowKeyboard(!showKeyboard);
  };

  // Handle touch events for remote control
  const handleTouchStart = (e) => {
    if (!isConnected) return;
    
    const touch = e.touches[0];
    const rect = screenRef.current.getBoundingClientRect();
    
    // Calculate relative position within the screen image
    const x = Math.round((touch.clientX - rect.left) / rect.width * screenInfo.width);
    const y = Math.round((touch.clientY - rect.top) / rect.height * screenInfo.height);
    
    // Send mouse down event
    sendMessage({
      type: 'input_event',
      eventType: 'mousedown',
      x,
      y,
      button: 0 // Left button
    });
    
    // Prevent default behavior to avoid scrolling
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!isConnected) return;
    
    const touch = e.touches[0];
    const rect = screenRef.current.getBoundingClientRect();
    
    // Calculate relative position
    const x = Math.round((touch.clientX - rect.left) / rect.width * screenInfo.width);
    const y = Math.round((touch.clientY - rect.top) / rect.height * screenInfo.height);
    
    // Send mouse move event
    sendMessage({
      type: 'input_event',
      eventType: 'mousemove',
      x,
      y
    });
    
    // Prevent default behavior
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    if (!isConnected) return;
    
    // We need to calculate the position even on touch end
    // Use the last position from the changedTouches array
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const rect = screenRef.current.getBoundingClientRect();
      
      const x = Math.round((touch.clientX - rect.left) / rect.width * screenInfo.width);
      const y = Math.round((touch.clientY - rect.top) / rect.height * screenInfo.height);
      
      // Send mouse up event
      sendMessage({
        type: 'input_event',
        eventType: 'mouseup',
        x,
        y,
        button: 0 // Left button
      });
    }
    
    // Prevent default behavior
    e.preventDefault();
  };

  // Send key events
  const handleKeyEvent = (key, eventType) => {
    if (!isConnected) return;
    
    sendMessage({
      type: 'input_event',
      eventType: eventType,
      keyCode: key.keyCode,
      altKey: key.altKey || false,
      ctrlKey: key.ctrlKey || false,
      shiftKey: key.shiftKey || false
    });
  };

  // Manage fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Go back to home
  const goHome = () => {
    if (status === 'CONNECTED') {
      sendMessage({
        type: 'stop_sharing'
      });
    }
    navigate('/');
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
        <Loading size="xl" className="mb-4 text-white" />
        <h2 className="text-lg font-medium text-white">Connecting to remote screen...</h2>
        <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
        
        {connectionError && (
          <div className="mt-6">
            <ErrorMessage message={connectionError} />
            <button 
              onClick={goHome}
              className="mt-4 px-4 py-2 bg-white text-black rounded-md flex items-center justify-center mx-auto"
            >
              <FiHome className="mr-2" />
              Go Back
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Remote Screen */}
      <div 
        ref={containerRef}
        className="flex-grow relative overflow-hidden"
      >
        <img
          ref={screenRef}
          src="/placeholder-screen.png"  
          alt="Remote Screen"
          className="w-full h-full object-contain bg-black"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        
        {/* Controls overlay */}
        <div className={`absolute bottom-4 left-0 right-0 flex justify-center space-x-3 transition-opacity ${isFullscreen ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
          <button 
            onClick={goHome}
            className="w-12 h-12 bg-gray-800 bg-opacity-70 text-white rounded-full flex items-center justify-center shadow-lg"
          >
            <FiHome size={20} />
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="w-12 h-12 bg-gray-800 bg-opacity-70 text-white rounded-full flex items-center justify-center shadow-lg"
          >
            {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
          </button>
          
          <button 
            onClick={toggleKeyboard}
            className={`w-12 h-12 bg-gray-800 bg-opacity-70 text-white rounded-full flex items-center justify-center shadow-lg ${showKeyboard ? 'bg-blue-600' : ''}`}
          >
            <FiType size={20} />
          </button>
        </div>
        
        {/* Show screen controls */}
        <ScreenControls 
          isConnected={isConnected}
          quality={screenInfo.quality}
          fps={screenInfo.fps}
          onUpdateSettings={(quality, fps) => {
            sendMessage({
              type: 'update_settings',
              quality,
              fps
            });
          }}
        />
      </div>
      
      {/* Virtual Keyboard */}
      {showKeyboard && (
        <VirtualKeyboard 
          onKeyPress={(key) => handleKeyEvent(key, 'keydown')}
          onKeyRelease={(key) => handleKeyEvent(key, 'keyup')}
        />
      )}
      
      {/* Connection Status */}
      <div className="absolute top-2 right-2">
        <ConnectionStatus status={status} />
      </div>
    </div>
  );
};

export default ScreenRemote;