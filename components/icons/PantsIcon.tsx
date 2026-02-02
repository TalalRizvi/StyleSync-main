import React from 'react';

const PantsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M8 4h8a4 4 0 0 1 4 4v12h-5l-1 -1l-1 1h-5v-12a4 4 0 0 1 4 -4z" />
    <path d="M12 12l0 9" />
  </svg>
);

export default PantsIcon;