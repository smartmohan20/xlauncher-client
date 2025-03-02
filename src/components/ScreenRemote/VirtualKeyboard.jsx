import React, { useState } from 'react';
import { FiArrowLeft, FiArrowUp, FiArrowDown, FiArrowRight, FiDelete, FiCornerUpLeft } from 'react-icons/fi';

const VirtualKeyboard = ({ onKeyPress, onKeyRelease }) => {
  const [isShift, setIsShift] = useState(false);
  const [isCtrl, setIsCtrl] = useState(false);
  const [isAlt, setIsAlt] = useState(false);

  // Key mappings - simplified for common keys
  const standardKeys = [
    [
      { label: '1', keyCode: 49, shiftLabel: '!' },
      { label: '2', keyCode: 50, shiftLabel: '@' },
      { label: '3', keyCode: 51, shiftLabel: '#' },
      { label: '4', keyCode: 52, shiftLabel: '$' },
      { label: '5', keyCode: 53, shiftLabel: '%' },
      { label: '6', keyCode: 54, shiftLabel: '^' },
      { label: '7', keyCode: 55, shiftLabel: '&' },
      { label: '8', keyCode: 56, shiftLabel: '*' },
      { label: '9', keyCode: 57, shiftLabel: '(' },
      { label: '0', keyCode: 48, shiftLabel: ')' },
    ],
    [
      { label: 'q', keyCode: 81 },
      { label: 'w', keyCode: 87 },
      { label: 'e', keyCode: 69 },
      { label: 'r', keyCode: 82 },
      { label: 't', keyCode: 84 },
      { label: 'y', keyCode: 89 },
      { label: 'u', keyCode: 85 },
      { label: 'i', keyCode: 73 },
      { label: 'o', keyCode: 79 },
      { label: 'p', keyCode: 80 },
    ],
    [
      { label: 'a', keyCode: 65 },
      { label: 's', keyCode: 83 },
      { label: 'd', keyCode: 68 },
      { label: 'f', keyCode: 70 },
      { label: 'g', keyCode: 71 },
      { label: 'h', keyCode: 72 },
      { label: 'j', keyCode: 74 },
      { label: 'k', keyCode: 75 },
      { label: 'l', keyCode: 76 },
    ],
    [
      { label: 'z', keyCode: 90 },
      { label: 'x', keyCode: 88 },
      { label: 'c', keyCode: 67 },
      { label: 'v', keyCode: 86 },
      { label: 'b', keyCode: 66 },
      { label: 'n', keyCode: 78 },
      { label: 'm', keyCode: 77 },
      { label: <FiDelete />, keyCode: 8, width: 'wide' },
    ],
  ];
  
  // Special keys row
  const specialKeys = [
    { 
      label: 'Ctrl', 
      keyCode: 17, 
      isActive: isCtrl, 
      toggle: () => setIsCtrl(!isCtrl), 
      width: 'wide',
      isToggleKey: true 
    },
    { 
      label: 'Alt', 
      keyCode: 18, 
      isActive: isAlt, 
      toggle: () => setIsAlt(!isAlt), 
      width: 'wide',
      isToggleKey: true 
    },
    { label: 'Space', keyCode: 32, width: 'extrawide' },
    { 
      label: 'Shift', 
      keyCode: 16, 
      isActive: isShift, 
      toggle: () => setIsShift(!isShift), 
      width: 'wide',
      isToggleKey: true 
    },
    { label: <FiCornerUpLeft />, keyCode: 13, width: 'wide' },
  ];
  
  // Arrow keys row
  const arrowKeys = [
    { label: <FiArrowLeft />, keyCode: 37 },
    { label: <FiArrowUp />, keyCode: 38 },
    { label: <FiArrowDown />, keyCode: 40 },
    { label: <FiArrowRight />, keyCode: 39 },
  ];

  // Handle key press
  const handleKeyPress = (key) => {
    // Handle toggle keys
    if (key.toggle) {
      key.toggle();
      return;
    }
    
    // Create key data with modifier states
    const keyData = {
      keyCode: key.keyCode,
      shiftKey: isShift,
      ctrlKey: isCtrl,
      altKey: isAlt,
      label: isShift && key.shiftLabel ? key.shiftLabel : key.label
    };
    
    // Send key press event
    if (onKeyPress) {
      onKeyPress(keyData);
    }
    
    // Send key release event after a short delay (simulating a key press)
    setTimeout(() => {
      if (onKeyRelease) {
        onKeyRelease(keyData);
      }
      
      // Auto-reset shift after a keypress
      if (isShift && !key.isToggleKey) {
        setIsShift(false);
      }
    }, 100);
  };

  return (
    <div className="bg-gray-900 p-2 w-full rounded-lg">
      {/* Standard keys */}
      {standardKeys.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex justify-center mb-1">
          {row.map((key, keyIndex) => (
            <button
              key={`key-${rowIndex}-${keyIndex}`}
              className={`
                text-white rounded m-0.5 text-center
                ${key.width === 'wide' ? 'w-12' : 'w-8'} 
                h-10 flex items-center justify-center
                ${isShift && key.label.length === 1 ? 'uppercase' : ''}
                ${key.isActive ? 'bg-blue-700' : 'bg-gray-800'}
                hover:bg-gray-700 active:bg-gray-600
                transition-colors duration-200
              `}
              onTouchStart={() => handleKeyPress(key)}
              onClick={() => handleKeyPress(key)}
            >
              {isShift && key.shiftLabel ? key.shiftLabel : key.label}
            </button>
          ))}
        </div>
      ))}
      
      {/* Special keys */}
      <div className="flex justify-center mb-1">
        {specialKeys.map((key, index) => (
          <button
            key={`special-${index}`}
            className={`
              text-white rounded m-0.5 text-xs flex items-center justify-center
              ${key.width === 'extrawide' ? 'flex-grow' : key.width === 'wide' ? 'w-12' : 'w-8'} 
              h-10
              ${key.isActive ? 'bg-blue-700' : 'bg-gray-800'}
              hover:bg-gray-700 active:bg-gray-600
              transition-colors duration-200
            `}
            onTouchStart={() => handleKeyPress(key)}
            onClick={() => handleKeyPress(key)}
          >
            {key.label}
          </button>
        ))}
      </div>
      
      {/* Arrow keys */}
      <div className="flex justify-center">
        {arrowKeys.map((key, index) => (
          <button
            key={`arrow-${index}`}
            className="w-10 h-10 bg-gray-800 text-white rounded m-0.5 
              flex items-center justify-center
              hover:bg-gray-700 active:bg-gray-600
              transition-colors duration-200"
            onTouchStart={() => handleKeyPress(key)}
            onClick={() => handleKeyPress(key)}
          >
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Import PropTypes
import PropTypes from 'prop-types';

// Add prop type validation
VirtualKeyboard.propTypes = {
  onKeyPress: PropTypes.func,
  onKeyRelease: PropTypes.func
};

// Add default props
VirtualKeyboard.defaultProps = {
  onKeyPress: () => {},
  onKeyRelease: () => {}
};

export default VirtualKeyboard;