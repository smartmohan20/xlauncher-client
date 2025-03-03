/**
 * WebSocket service using native browser WebSocket API
 * Compatible with standard WebSocket servers including ixwebsocket
 */

// WebSocket connection instance
let socket = null;

// WebSocket event listeners
const listeners = new Map();

/**
 * Initialize WebSocket connection with the server
 */
const initializeSocket = (url) => {
  if (socket) {
    return socket;
  }

  try {
    socket = new WebSocket(url);
    
    // Set binary type to blob for image data
    socket.binaryType = 'blob';

    // Set up event listeners
    socket.onopen = () => {
      notifyListeners('connect', { id: generateRandomId() });
    };

    socket.onclose = (event) => {
      notifyListeners('disconnect', { 
        reason: event.reason || 'Connection closed', 
        code: event.code 
      });
    };

    socket.onerror = (error) => {
      notifyListeners('error', { error: 'WebSocket error occurred' });
    };

    socket.onmessage = (event) => {
      try {
        // Handle binary data (like screen captures)
        if (event.data instanceof Blob) {
          // Create a custom event to dispatch binary data
          const binaryEvent = new CustomEvent('websocketBinaryMessage', { 
            detail: event.data 
          });
          window.dispatchEvent(binaryEvent);
          
          // Also notify internal listeners
          notifyListeners('binaryMessage', event.data);
          return;
        }
        
        // Try to parse as JSON first
        const data = JSON.parse(event.data);
        notifyListeners('message', data);
      } catch (e) {
        // If not JSON, send as string
        notifyListeners('message', event.data);
      }
    };

    return socket;
  } catch (error) {
    console.error('WebSocket initialization error:', error);
    return null;
  }
};

/**
 * Generate a random ID for the connection
 */
const generateRandomId = () => {
  return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Connect to WebSocket server
 */
const connect = (url) => {
  try {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return true;
    }
    
    socket = initializeSocket(url);
    return socket !== null;
  } catch (error) {
    console.error('WebSocket connect error:', error);
    return false;
  }
};

/**
 * Disconnect from WebSocket server
 */
const disconnect = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close(1000, "Disconnect requested by user");
    socket = null;
    return true;
  }
  return false;
};

/**
 * Send message to server
 */
const sendMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const messageStr = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
      
    socket.send(messageStr);
    return true;
  }
  return false;
};

/**
 * Send binary data to server
 */
const sendBinary = (data) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(data);
    return true;
  }
  return false;
};

/**
 * Register event listener
 */
const addEventListener = (event, callback) => {
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }
  
  listeners.get(event).push(callback);
  
  return () => {
    const callbacks = listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  };
};

/**
 * Notify all listeners of an event
 */
const notifyListeners = (event, data) => {
  if (listeners.has(event)) {
    listeners.get(event).forEach(callback => callback(data));
  }
};

/**
 * Get current connection status
 */
const getStatus = () => {
  if (!socket) return 'NOT_INITIALIZED';
  
  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return 'CONNECTING';
    case WebSocket.OPEN:
      return 'CONNECTED';
    case WebSocket.CLOSING:
      return 'CLOSING';
    case WebSocket.CLOSED:
      return 'DISCONNECTED';
    default:
      return 'UNKNOWN';
  }
};

export default {
  connect,
  disconnect,
  sendMessage,
  sendBinary,
  addEventListener,
  getStatus,
};