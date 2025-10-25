import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: 'sm' | 'md' | 'full'; // Button size, 'full' expands to fill container
  variant?: 'primary' | 'outline' | 'text-only'; // Button variant, added 'text-only'
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Custom className
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  variant = 'primary',
  startIcon,
  endIcon,
  onClick,
  className = '',
  disabled = false,
  ...rest
}) => {
  // Size Classes
  const sizeClasses = {
    sm: 'px-4 py-3 text-sm',
    md: 'px-5 py-3.5 text-sm',
    full: 'w-full px-5 py-3.5 text-sm', // full width, padding same as md
  };

  // Variant Classes
  const variantClasses = {
    primary:
      'bg-brand-500 text-white border-2 border-brand-500 shadow-md hover:bg-brand-600 hover:border-brand-600 hover:shadow-lg disabled:bg-brand-300 disabled:border-brand-300 disabled:shadow-none transition-all duration-200 ease-in-out',
    outline:
      'bg-white text-gray-700 border-2 border-gray-300 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 focus:border-brand-600 focus:text-brand-600 focus:bg-brand-50 border-solid ring-0 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-brand-500 dark:hover:text-brand-400 dark:hover:bg-gray-700',
    'text-only':
      'bg-transparent text-gray-500 border border-transparent hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 focus:bg-brand-100 focus:text-brand-600 disabled:text-gray-300 ring-0 shadow-none transition-all duration-200 ease-in-out', // text-only style
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2 ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95'
      } rounded-lg`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
