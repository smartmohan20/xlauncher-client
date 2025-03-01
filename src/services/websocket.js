import { io } from 'socket.io-client';

// WebSocket connection instance
let socket = null;

// WebSocket event listeners
const listeners = new Map();

/**
 * Initialize socket connection with the server
 */
const initializeSocket = (url) => {
  if (socket) {
    return socket;
  }

  socket = io(url, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Set up default listeners
  socket.on('connect', () => {
    notifyListeners('connect', { id: socket.id });
  });

  socket.on('disconnect', (reason) => {
    notifyListeners('disconnect', { reason });
  });

  socket.on('error', (error) => {
    notifyListeners('error', { error });
  });

  socket.on('message', (data) => {
    notifyListeners('message', data);
  });

  return socket;
};

/**
 * Connect to WebSocket server
 */
const connect = (url) => {
  if (!socket) {
    socket = initializeSocket(url);
  }
  
  if (!socket.connected) {
    socket.connect();
  }
  
  return socket.connected;
};

/**
 * Disconnect from WebSocket server
 */
const disconnect = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    return true;
  }
  return false;
};

/**
 * Send message to server
 */
const sendMessage = (message) => {
  if (socket && socket.connected) {
    socket.emit('message', message);
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
  if (socket.connected) return 'CONNECTED';
  return 'DISCONNECTED';
};

export default {
  connect,
  disconnect,
  sendMessage,
  addEventListener,
  getStatus,
};