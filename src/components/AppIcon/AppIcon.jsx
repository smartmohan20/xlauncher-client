import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * AppIcon Component
 * Displays an application icon with fallback to a letter avatar
 */
const AppIcon = ({ icon, name, size = "md", className = "" }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state when icon or name changes
  useEffect(() => {
    setImgError(false);
  }, [icon, name]);

  // Size configuration (following Material Design standards)
  const sizeMap = {
    sm: { width: '24px', height: '24px', fontSize: '10px' },
    md: { width: '32px', height: '32px', fontSize: '14px' },
    lg: { width: '48px', height: '48px', fontSize: '20px' },
    xl: { width: '64px', height: '64px', fontSize: '28px' }
  };

  const { width, height, fontSize } = sizeMap[size] || sizeMap.md;

  // Get a deterministic color based on name
  const getColorForName = (str) => {
    const colors = [
      '#4285F4', // Google Blue
      '#EA4335', // Google Red
      '#FBBC05', // Google Yellow
      '#34A853', // Google Green
      '#5F6368'  // Google Grey
    ];
    
    if (!str) return colors[0];
    
    // Generate a hash from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to pick a color
    return colors[Math.abs(hash) % colors.length];
  };

  // Render fallback icon (letter avatar)
  const renderFallbackIcon = () => {
    return (
      <div 
        className={`app-icon-fallback ${className}`}
        style={{
          width,
          height,
          backgroundColor: getColorForName(name),
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize,
          overflow: 'hidden'
        }}
      >
        {name ? name.charAt(0).toUpperCase() : '?'}
      </div>
    );
  };

  // If no icon data or if there was an error loading the image, show fallback
  if (!icon || !icon.data || !icon.mimeType || imgError) {
    return renderFallbackIcon();
  }

  // Clean up base64 data to ensure it's valid
  const cleanBase64 = (base64Data) => {
    if (!base64Data) return '';
    return base64Data.replace(/[\s\r\n]+/g, '');
  };

  // Create the data URL with proper format
  const cleanedData = cleanBase64(icon.data);
  const dataUrl = `data:${icon.mimeType};base64,${cleanedData}`;

  return (
    <img 
      src={dataUrl} 
      alt={`${name || 'Application'} icon`} 
      className={`app-icon ${className}`}
      style={{
        width,
        height,
        objectFit: 'contain'
      }}
      onError={() => setImgError(true)}
    />
  );
};

// PropTypes for better documentation and type checking
AppIcon.propTypes = {
  icon: PropTypes.shape({
    data: PropTypes.string,
    mimeType: PropTypes.string
  }),
  name: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string
};

export default AppIcon;