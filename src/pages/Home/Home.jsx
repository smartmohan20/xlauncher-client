import React from 'react';
import { Link } from 'react-router-dom';
import { FiExternalLink, FiMessageSquare } from 'react-icons/fi';
import Button from '../../components/common/Button';

/**
 * Home page component
 */
const Home = () => {
  return (
    <div className="app-container py-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Welcome to XLauncher Client</h1>
        
        <p className="text-gray-600 mb-8">
          A powerful WebSocket client for communicating with your applications.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card flex flex-col items-center p-6">
            <FiMessageSquare className="text-3xl mb-4" />
            <h2 className="text-xl font-medium mb-2">WebSocket Client</h2>
            <p className="text-gray-600 text-sm mb-4 text-center">
              Connect to WebSocket servers and exchange messages in real-time
            </p>
            <Link to="/websocket" className="mt-auto">
              <Button className="flex items-center">
                <FiExternalLink className="mr-2" />
                Open WebSocket Client
              </Button>
            </Link>
          </div>
          
          <div className="card flex flex-col items-center p-6">
            <div className="text-3xl mb-4">🚀</div>
            <h2 className="text-xl font-medium mb-2">App Launcher</h2>
            <p className="text-gray-600 text-sm mb-4 text-center">
              Launch applications from the server through a mobile-friendly interface
            </p>
            <Link to="/launcher" className="mt-auto">
              <Button className="flex items-center">
                <FiExternalLink className="mr-2" />
                Open App Launcher
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;