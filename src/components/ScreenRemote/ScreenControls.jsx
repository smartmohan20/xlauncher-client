import React, { useState } from 'react';
import { FiSettings } from 'react-icons/fi';

const ScreenControls = ({ isConnected, quality, fps, onUpdateSettings }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(quality || 70);
  const [currentFps, setCurrentFps] = useState(fps || 15);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleApplySettings = () => {
    onUpdateSettings(currentQuality, currentFps);
    setShowSettings(false);
  };

  return (
    <div className="absolute top-4 left-4">
      <button
        onClick={toggleSettings}
        className="w-10 h-10 bg-gray-800 bg-opacity-70 text-white rounded-full flex items-center justify-center shadow-lg"
        disabled={!isConnected}
      >
        <FiSettings size={18} />
      </button>
      
      {showSettings && (
        <div className="absolute top-12 left-0 bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg text-white w-64">
          <h3 className="text-sm font-medium mb-3">Screen Settings</h3>
          
          <div className="mb-3">
            <label className="block text-xs mb-1">Quality: {currentQuality}</label>
            <input
              type="range"
              min="10"
              max="100"
              value={currentQuality}
              onChange={(e) => setCurrentQuality(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-xs mb-1">FPS: {currentFps}</label>
            <input
              type="range"
              min="5"
              max="30"
              value={currentFps}
              onChange={(e) => setCurrentFps(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>
          
          <button
            onClick={handleApplySettings}
            className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-medium"
          >
            Apply Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default ScreenControls;