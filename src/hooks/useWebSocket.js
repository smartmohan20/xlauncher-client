import { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocket';

/**
 * Custom hook for WebSocket functionality
 */
const useWebSocket = () => {
  const [status, setStatus] = useState(websocketService.getStatus());
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  // Update status handler
  const handleStatusChange = useCallback((newStatus) => {
    setStatus(newStatus);
  }, []);

  // Add message to history
  const addMessage = useCallback((message, direction) => {
    const timestamp = new Date().toISOString();
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: message,
      direction,
      timestamp,
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Connect to WebSocket server
  const connect = useCallback((url) => {
    try {
      const defaultUrl = import.meta.env.VITE_WEBSOCKET_URL;
      const success = websocketService.connect(url || defaultUrl);
      
      if (success) {
        addMessage({ type: 'system', data: { message: 'Connection established' } }, 'system');
      }
      return success;
    } catch (err) {
      setError(err.message);
      addMessage({ type: 'error', data: { message: err.message } }, 'system');
      return false;
    }
  }, [addMessage]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    try {
      const success = websocketService.disconnect();
      if (success) {
        addMessage({ type: 'system', data: { message: 'Disconnected from server' } }, 'system');
      }
      return success;
    } catch (err) {
      setError(err.message);
      addMessage({ type: 'error', data: { message: err.message } }, 'system');
      return false;
    }
  }, [addMessage]);

  // Send message to WebSocket server
  const sendMessage = useCallback((message) => {
    try {
      const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
      const success = websocketService.sendMessage(message);
      
      if (success) {
        addMessage(message, 'outgoing');
      } else {
        setError('Failed to send message: Not connected');
        addMessage({ type: 'error', data: { message: 'Failed to send message: Not connected' } }, 'system');
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
    setMessages([]);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const connectListener = websocketService.addEventListener('connect', (data) => {
      setStatus('CONNECTED');
      setError(null);
      addMessage({ type: 'system', data: { message: `Connected with ID: ${data.id}` } }, 'system');
    });

    const disconnectListener = websocketService.addEventListener('disconnect', (data) => {
      setStatus('DISCONNECTED');
      addMessage({ type: 'system', data: { message: `Disconnected: ${data.reason}` } }, 'system');
    });

    const errorListener = websocketService.addEventListener('error', (data) => {
      setError(data.error);
      addMessage({ type: 'error', data: { message: data.error } }, 'system');
    });

    const messageListener = websocketService.addEventListener('message', (data) => {
      addMessage(data, 'incoming');
    });

    // Clean up listeners
    return () => {
      connectListener();
      disconnectListener();
      errorListener();
      messageListener();
    };
  }, [addMessage]);

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