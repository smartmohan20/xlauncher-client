import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocket';

/**
 * Custom hook for WebSocket functionality with improved connection handling
 */
const useWebSocket = () => {
  // Use refs to track the latest state without triggering rerenders
  const statusRef = useRef(websocketService.getStatus());
  const messagesRef = useRef([]);
  
  // State for component rendering
  const [status, setStatus] = useState(statusRef.current);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // Add message to history - stable reference
  const addMessage = useCallback((message, direction) => {
    const timestamp = new Date().toISOString();
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: message,
      direction,
      timestamp,
    };
    
    // Update both ref and state to ensure consistency
    messagesRef.current = [...messagesRef.current, newMessage];
    setMessages(messagesRef.current);
    return newMessage;
  }, []);

  // Update status handler - stable reference
  const handleStatusChange = useCallback((newStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  // Connect to WebSocket server
  const connect = useCallback((url) => {
    try {
      // Use the ref for current status to avoid closure issues
      if (statusRef.current === 'CONNECTED' || statusRef.current === 'CONNECTING') {
        const errorMsg = 'Already connected or connecting';
        console.warn(errorMsg);
        addMessage({ type: 'error', data: { message: errorMsg } }, 'system');
        return false;
      }

      const defaultUrl = import.meta.env.VITE_WEBSOCKET_URL;
      handleStatusChange('CONNECTING'); // Set status first for immediate UI feedback
      
      const success = websocketService.connect(url || defaultUrl);
      
      if (success) {
        addMessage({ type: 'system', data: { message: 'Connecting to server...' } }, 'system');
      } else {
        const errorMsg = 'Failed to initialize WebSocket connection';
        setError(errorMsg);
        handleStatusChange('NOT_INITIALIZED');
        addMessage({ type: 'error', data: { message: errorMsg } }, 'system');
      }
      return success;
    } catch (err) {
      setError(err.message);
      handleStatusChange('NOT_INITIALIZED');
      addMessage({ type: 'error', data: { message: err.message } }, 'system');
      return false;
    }
  }, [addMessage, handleStatusChange]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    try {
      // Only attempt disconnect if we're actually connected or connecting
      if (statusRef.current !== 'CONNECTED' && statusRef.current !== 'CONNECTING') {
        return false;
      }
      
      handleStatusChange('CLOSING'); // Update status before disconnecting
      const success = websocketService.disconnect();
      
      if (success) {
        addMessage({ type: 'system', data: { message: 'Disconnected from server' } }, 'system');
        handleStatusChange('DISCONNECTED');
      }
      return success;
    } catch (err) {
      setError(err.message);
      addMessage({ type: 'error', data: { message: err.message } }, 'system');
      return false;
    }
  }, [addMessage, handleStatusChange]);

  // Send message to WebSocket server
  const sendMessage = useCallback((message) => {
    try {
      // Only allow sending if connected
      if (statusRef.current !== 'CONNECTED') {
        const errorMsg = 'Failed to send message: Not connected';
        setError(errorMsg);
        addMessage({ type: 'error', data: { message: errorMsg } }, 'system');
        return false;
      }

      const success = websocketService.sendMessage(message);
      
      if (success) {
        addMessage(message, 'outgoing');
      } else {
        const errorMsg = 'Failed to send message: Connection issue';
        setError(errorMsg);
        addMessage({ type: 'error', data: { message: errorMsg } }, 'system');
      }
      return success;
    } catch (err) {
      setError(err.message);
      addMessage({ type: 'error', data: { message: err.message } }, 'system');
      return false;
    }
  }, [addMessage]);

  // Clear message history
  const clearMessages = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Event handlers with stable references
    const onConnect = (data) => {
      handleStatusChange('CONNECTED');
      setError(null);
      addMessage({ type: 'system', data: { message: `Connected with ID: ${data.id}` } }, 'system');
    };

    const onDisconnect = (data) => {
      handleStatusChange('DISCONNECTED');
      addMessage({ 
        type: 'system', 
        data: { message: `Disconnected: ${data.reason} (Code: ${data.code})` } 
      }, 'system');
    };

    const onError = (data) => {
      setError(data.error);
      addMessage({ type: 'error', data: { message: data.error } }, 'system');
    };

    const onMessage = (data) => {
      addMessage(data, 'incoming');
    };

    // Register event listeners
    const connectListener = websocketService.addEventListener('connect', onConnect);
    const disconnectListener = websocketService.addEventListener('disconnect', onDisconnect);
    const errorListener = websocketService.addEventListener('error', onError);
    const messageListener = websocketService.addEventListener('message', onMessage);

    // Regularly update connection status from service
    const statusInterval = setInterval(() => {
      const currentStatus = websocketService.getStatus();
      if (currentStatus !== statusRef.current) {
        handleStatusChange(currentStatus);
      }
    }, 1000);

    // Clean up listeners and interval
    return () => {
      connectListener();
      disconnectListener();
      errorListener();
      messageListener();
      clearInterval(statusInterval);
    };
  }, [addMessage, handleStatusChange]);

  return {
    status,
    connect,
    disconnect,
    sendMessage,
    messages,
    error,
    clearMessages,
  };
};

export default useWebSocket;