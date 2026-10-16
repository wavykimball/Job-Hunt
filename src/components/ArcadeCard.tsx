import React from 'react';

export interface ArcadeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  highlight?: boolean;
  clickable?: boolean;
}

export const ArcadeCard: React.FC<ArcadeCardProps> = ({
  highlight = false,
  clickable = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'arcade-card',
    highlight ? 'arcade-card-highlight' : '',
    clickable ? 'arcade-card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
