import React from 'react';

export interface ArcadeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'golden' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const ArcadeButton: React.FC<ArcadeButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  style,
  ...props
}) => {
  const variantClass = `arcade-btn-${variant}`;
  const sizeClass = size === 'sm' ? 'arcade-btn-sm' : '';
  const widthStyle: React.CSSProperties = fullWidth ? { width: '100%' } : {};

  return (
    <button
      className={`arcade-btn ${variantClass} ${sizeClass} ${className}`}
      style={{ ...widthStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
};
