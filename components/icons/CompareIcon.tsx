import React from 'react';

export const CompareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 4.5v15m0 0l-6.75-6.75M12 19.5l6.75-6.75M4.5 12h15" 
      transform="rotate(45 12 12)"
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round"
        d="M12 4.5v15"
    />
  </svg>
);
