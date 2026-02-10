import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'icon' | 'warning' | 'gray' | 'link';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    link: 'text-blue-600 hover:text-blue-900 hover:underline cursor-pointer transition-colors !font-bold px-0 py-0',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-400 text-gray-800 hover:bg-yellow-500 focus:ring-yellow-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 border-2 bg-white text-gray-900 hover:bg-gray-50 focus:ring-gray-500 ',
    gray: 'bg-gray-500 text-white hover:bg-gray-600',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 ',
    icon: 'bg-transparent text-gray-600 hover:text-gray-900 focus:ring-gray-500 p-0',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-4 py-3 text-sm gap-2',
    lg: 'px-6 py-4 text-base gap-3'
  };

  const iconSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (variant === 'icon') {
    const iconClass = `${baseClasses} ${iconSizeClasses[size]} ${variantClasses.icon} ${className}`;
    return (
      <button
        {...props}
        className={iconClass}
        disabled={disabled}
      >
        {Icon && <Icon className={iconSizeMap[size]} />}
        {children}
      </button>
    );
  }

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className={iconSizeMap[size]} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className={iconSizeMap[size]} />}
    </button>
  );
};

export default Button;
