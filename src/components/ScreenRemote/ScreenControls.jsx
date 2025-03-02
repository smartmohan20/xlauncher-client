import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiSettings } from 'react-icons/fi';

const ScreenControls = ({ isConnected, quality, fps, onUpdateSettings }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(
    Math.min(Math.max(quality || 70, 10), 100)
  );
  const [currentFps, setCurrentFps] = useState(
    Math.min(Math.max(fps || 15, 5), 30)
  );

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleApplySettings = () => {
    // Ensure settings are within valid ranges before applying
    const validQuality = Math.min(Math.max(currentQuality, 10), 100);
    const validFps = Math.min(Math.max(currentFps, 5), 30);

    onUpdateSettings(validQuality, validFps);
    setShowSettings(false);
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      <button
        onClick={toggleSettings}
        className="w-10 h-10 bg-gray-800 bg-opacity-70 text-white rounded-full flex items-center justify-center shadow-lg"
        disabled={!isConnected}
        aria-label="Open screen settings"
      >
        <FiSettings size={18} />
      </button>
      
      {showSettings && (
        <div 
          className="absolute top-12 left-0 bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg text-white w-64"
          role="dialog"
          aria-labelledby="screen-settings-title"
        >
          <h3 id="screen-settings-title" className="text-sm font-medium mb-3">Screen Settings</h3>
          
          <div className="mb-3">
            <label htmlFor="quality-slider" className="block text-xs mb-1">
              Quality: {currentQuality}
            </label>
            <input
              id="quality-slider"
              type="range"
              min="10"
              max="100"
              value={currentQuality}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setCurrentQuality(Math.min(Math.max(value, 10), 100));
              }}
              className="w-full"
              aria-valuemin={10}
              aria-valuemax={100}
              aria-valuenow={currentQuality}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="fps-slider" className="block text-xs mb-1">
              FPS: {currentFps}
            </label>
            <input
              id="fps-slider"
              type="range"
              min="5"
              max="30"
              value={currentFps}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setCurrentFps(Math.min(Math.max(value, 5), 30));
              }}
              className="w-full"
              aria-valuemin={5}
              aria-valuemax={30}
              aria-valuenow={currentFps}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>
          
          <button
            onClick={handleApplySettings}
            className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Settings
          </button>
        </div>
      )}
    </div>
  );
};

// Add PropTypes for type checking
ScreenControls.propTypes = {
  isConnected: PropTypes.bool,
  quality: PropTypes.number,
  fps: PropTypes.number,
  onUpdateSettings: PropTypes.func.isRequired
};

// Add default props
ScreenControls.defaultProps = {
  isConnected: false,
  quality: 70,
  fps: 15
};

export default ScreenControls;