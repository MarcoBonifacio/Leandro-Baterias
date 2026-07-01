import React from 'react';

interface CarBatteryIconProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
}

export const CarBatteryIcon: React.FC<CarBatteryIconProps> = ({ 
  className = "h-5 w-5", 
  size, 
  strokeWidth = 2 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Battery Terminals on Top Left and Top Right */}
      <rect x="5" y="2" width="3" height="2" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="16" y="2" width="3" height="2" rx="0.5" fill="currentColor" stroke="none" />
      
      {/* Small terminal indicators */}
      <path d="M5 3.5h3" stroke="currentColor" strokeWidth="1" />
      <path d="M16 3.5h3" stroke="currentColor" strokeWidth="1" />

      {/* Main Battery Casing Lid (Upper Section) */}
      <path d="M3 6h18v3H3z" fill="currentColor" fillOpacity="0.15" />
      
      {/* Main Battery Body (Lower Section) */}
      <rect x="3" y="9" width="18" height="11" rx="1.5" />
      
      {/* Outer structural casing ridges/lines representing heavy-duty plates */}
      <line x1="7.5" y1="9" x2="7.5" y2="20" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="12" y1="9" x2="12" y2="20" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="16.5" y1="9" x2="16.5" y2="20" strokeWidth="1" strokeOpacity="0.4" />

      {/* Minus sign on the left */}
      <line x1="6.5" y1="13.5" x2="8.5" y2="13.5" strokeWidth="1.5" />

      {/* Plus sign on the right */}
      <line x1="15.5" y1="13.5" x2="17.5" y2="13.5" strokeWidth="1.5" />
      <line x1="16.5" y1="12.5" x2="16.5" y2="14.5" strokeWidth="1.5" />

      {/* Charge level Indicator in center */}
      <circle cx="12" cy="14.5" r="1.5" fill="currentColor" fillOpacity="0.7" className="animate-pulse" />
    </svg>
  );
};
