import React from 'react';

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c.264.03.522.062.781.094s.524.062.782.094M11.25 3.322c.263.03.522.062.781.094s.524.062.782.094m-7.5 0a48.552 48.552 0 007.5 0" />
  </svg>
);

export default SaveIcon;
