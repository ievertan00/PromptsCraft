import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const Icon: React.FC<IconProps> = ({ size = 'md', className, ...props }) => {
  const iconSizeClass = sizeClasses[size];
  return <svg className={`${iconSizeClass} ${className || ''}`} {...props} />;
};
