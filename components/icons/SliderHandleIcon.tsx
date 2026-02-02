import React from 'react';

const SliderHandleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" fill="white" fillOpacity="0.7" stroke="none" />
        <path d="M10 9L7 12L10 15" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 9L17 12L14 15" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default SliderHandleIcon;