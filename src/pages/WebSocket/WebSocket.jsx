import React, { useState, useEffect } from 'react';
import { FiSend, FiPower, FiDisc, FiCheck, FiX, FiCode, FiCopy, FiTrash2, FiRotateCw } from 'react-icons/fi';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import useWebSocket from '../../hooks/useWebSocket';

/**
 * WebSocket communication page component
 */
const WebSocketPage = () => {
  // State for form fields
  const [serverUrl, setServerUrl] = useState(import.meta.env.VITE_WEBSOCKET_URL || '');
  const [messageInput, setMessageInput] = useState('');
  const [messageJson, setMessageJson] = useState(JSON.stringify({
    type: 'launch_app',
    data: {
      path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      arguments: ['google.com']
    }
  }, null, 2));
  const [inputType, setInputType] = useState('json'); // 'text' or 'json'
  const [jsonError, setJsonError] = useState('');

  // WebSocket hook
  const { 
    status, 
    connect, 
    disconnect, 
    sendMessage, 
    messages, 
    error, 
    clearMessages 
  } = useWebSocket();

  // Validate JSON on input change
  useEffect(() => {
    if (inputType === 'json') {
      try {
        JSON.parse(messageJson);
        setJsonError('');
      } catch (err) {
        setJsonError(err.message);
      }
    }
  }, [messageJson, inputType]);

  // Handle connect button click
  const handleConnect = () => {
    connect(serverUrl);
  };

  // Handle disconnect button click
  const handleDisconnect = () => {
    disconnect();
  };

  // Handle send message button click
  const handleSendMessage = () => {
    if (inputType === 'text') {
      sendMessage(messageInput);
      setMessageInput('');
    } else {
      try {
        const jsonMessage = JSON.parse(messageJson);
        sendMessage(jsonMessage);
      } catch (err) {
        setJsonError(err.message);
      }
    }
  };

  // Toggle input type
  const handleToggleInputType = () => {
    setInputType(prev => prev === 'text' ? 'json' : 'text');
    setJsonError('');
  };

  // Copy message to clipboard
  const handleCopyMessage = (message) => {
    const content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content, null, 2);
    
    navigator.clipboard.writeText(content);
  };

  // Load example message
  const loadExampleMessage = () => {
    setInputType('json');
    setMessageJson(JSON.stringify({
      type: 'launch_app',
      data: {
        path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        arguments: ['google.com']
      }
    }, null, 2));
    setJsonError('');
  };

  // Format message content for display
  const formatMessageContent = (content) => {
    if (typeof content === 'string') {
      return content;
    }
    
    return JSON.stringify(content, null, 2);
  };

  // Format JSON with proper indentation
  const formatJson = () => {
    if (inputType === 'json') {
      try {
        const parsed = JSON.parse(messageJson);
        setMessageJson(JSON.stringify(parsed, null, 2));
        setJsonError('');
      } catch (err) {
        setJsonError(err.message);
      }
    }
  };

  // Get connection status indicator
  const getStatusIndicator = () => {
    switch (status) {
      case 'CONNECTED':
        return (
          <div className="flex items-center text-green-500 text-xs">
            <FiDisc className="animate-pulse mr-1" />
            <span>Connected</span>
          </div>
        );
      case 'DISCONNECTED':
        return (
          <div className="flex items-center text-gray-500 text-xs">
            <FiPower className="mr-1" />
            <span>Disconnected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-400 text-xs">
            <FiX className="mr-1" />
            <span>Not Initialized</span>
          </div>
        );
    }
  };

  // Get message class based on direction
  const getMessageClass = (direction) => {
    switch (direction) {
      case 'incoming':
        return 'bg-gray-100 border-gray-200';
      case 'outgoing':
        return 'bg-black text-white border-black';
      case 'system':
        return 'bg-gray-50 border-gray-200 text-gray-500 italic text-xs';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection Panel */}
        <div className="md:col-span-1 bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Connection</h3>
            {getStatusIndicator()}
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                placeholder="WebSocket URL"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                disabled={status === 'CONNECTED'}
              />
              
              {status !== 'CONNECTED' ? (
                <Button 
                  onClick={handleConnect} 
                  className="flex items-center justify-center"
                  size="sm"
                >
                  <FiDisc className="mr-1" size={12} />
                  <span className="text-xs">Connect</span>
                </Button>
              ) : (
                <Button 
                  onClick={handleDisconnect} 
                  variant="outline" 
                  className="flex items-center justify-center"
                  size="sm"
                >
                  <FiPower className="mr-1" size={12} />
                  <span className="text-xs">Disconnect</span>
                </Button>
              )}
            </div>
            
            {error && <ErrorMessage message={error} className="text-xs" />}
          </div>
        </div>
        
        {/* Message Sender Panel */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Send Message</h3>
            <div className="flex items-center space-x-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={loadExampleMessage}
                className="flex items-center"
              >
                <FiCode size={12} className="mr-1" />
                <span className="text-xs">Example</span>
              </Button>
              
              {inputType === 'json' && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={formatJson}
                  className="flex items-center"
                  title="Format JSON"
                >
                  <FiRotateCw size={12} />
                </Button>
              )}
              
              <div className="flex border border-gray-200 rounded-md">
                <Button
                  size="xs"
                  variant={inputType === 'json' ? 'primary' : 'ghost'}
                  onClick={() => inputType !== 'json' && handleToggleInputType()}
                  className="rounded-r-none py-0.5 px-2"
                >
                  <span className="text-xs">JSON</span>
                </Button>
                
                <Button
                  size="xs"
                  variant={inputType === 'text' ? 'primary' : 'ghost'}
                  onClick={() => inputType !== 'text' && handleToggleInputType()}
                  className="rounded-l-none py-0.5 px-2"
                >
                  <span className="text-xs">Text</span>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {inputType === 'text' ? (
              <input
                type="text"
                placeholder="Type message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                disabled={status !== 'CONNECTED'}
              />
            ) : (
              <>
                <textarea
                  placeholder="Enter JSON message..."
                  value={messageJson}
                  onChange={(e) => setMessageJson(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black h-32"
                  disabled={status !== 'CONNECTED'}
                />
                {jsonError && <div className="text-xs text-red-500">{jsonError}</div>}
              </>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSendMessage} 
                disabled={status !== 'CONNECTED' || (inputType === 'json' && jsonError)}
                className="flex items-center"
                size="sm"
              >
                <FiSend className="mr-1" size={12} />
                <span className="text-xs">Send</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Message History Panel */}
        <div className="md:col-span-3 bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Message History</h3>
            <Button 
              size="xs" 
              variant="ghost" 
              onClick={clearMessages}
              className="flex items-center text-gray-500"
              disabled={messages.length === 0}
            >
              <FiTrash2 className="mr-1" size={12} />
              <span className="text-xs">Clear</span>
            </Button>
          </div>
          
          <div className="flex flex-col space-y-2 max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-xs italic">No messages yet</p>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`px-2 py-1.5 border rounded-md ${getMessageClass(message.direction)}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium">
                      {message.direction === 'incoming' ? 'Received' : 
                       message.direction === 'outgoing' ? 'Sent' : 'System'}
                    </span>
                    <div className="flex items-center space-x-1">
                      {message.direction !== 'system' && (
                        <button 
                          onClick={() => handleCopyMessage(message)}
                          className="text-xs p-0.5 rounded hover:bg-gray-200"
                          title="Copy to clipboard"
                        >
                          <FiCopy size={10} />
                        </button>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs font-mono mt-1">
                    {formatMessageContent(message.content)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketPage;