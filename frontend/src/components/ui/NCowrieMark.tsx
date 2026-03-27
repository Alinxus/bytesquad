import React from 'react';

interface NCowrieMarkProps {
  className?: string;
}

export const NCowrieMark: React.FC<NCowrieMarkProps> = ({ className }) => {
  return (
    <svg 
      width="24" 
      height="12" 
      viewBox="0 0 24 12" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M12 0C5.37258 0 0 2.68629 0 6C0 9.31371 5.37258 12 12 12C18.6274 12 24 9.31371 24 6C24 2.68629 18.6274 0 12 0ZM12 9C9.79086 9 8 7.65685 8 6C8 4.34315 9.79086 3 12 3C14.2091 3 16 4.34315 16 6C16 7.65685 14.2091 9 12 9Z" 
        fill="currentColor"
      />
    </svg>
  );
};
