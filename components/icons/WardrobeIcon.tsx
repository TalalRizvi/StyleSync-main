import React from 'react';

const WardrobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5v2.25m0-2.25l2.25 1.313M4.5 19.5v-2.25a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25v2.25m-15 0h15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v.75m0 15v.75m0-15a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-13.5a2.25 2.25 0 012.25-2.25h1.5z" />
  </svg>
);

export default WardrobeIcon;
