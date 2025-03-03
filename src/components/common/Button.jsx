import React from 'react';

/**
 * Reusable button component
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  type = 'button',
  ...props 
}) => {
  // Size classes mapping
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  // Variant classes mapping
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-black',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-black text-black hover:bg-gray-100 focus:ring-black',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-black hover:bg-gray-100 focus:ring-black',
  };

  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center 
        font-medium rounded-md
        focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;