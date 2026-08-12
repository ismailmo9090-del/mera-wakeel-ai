import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = '', size = 24 }) => {
  // @ts-ignore
  const IconComponent = Icons[name] || Icons.HelpCircle;
  return <IconComponent className={className} size={size} />;
};
