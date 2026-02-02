import React from 'react';

const SvgIcon = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="s-grad-logo-component" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A8B4FF" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <path
        d="M66.5,23.5 C60.9,17.9 52.3,15 45,15 C30.2,15 18,27.2 18,42 C18,56.8 30.2,69 45,69 L55,69 C63.3,69 70,62.3 70,54 L70,46 M33.5,76.5 C39.1,82.1 47.7,85 55,85 C69.8,85 82,72.8 82,58 C82,43.2 69.8,31 55,31 L45,31 C36.7,31 30,37.7 30,46 L30,54"
        stroke="url(#s-grad-logo-component)"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
);


const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <SvgIcon />
    <div className="flex flex-col justify-center">
      <span className="text-2xl font-black text-gray-800 tracking-tighter leading-none" style={{ letterSpacing: '-0.05em' }}>STYLE</span>
      <span className="text-xs font-medium text-gray-500 tracking-[0.3em] leading-none">SYNC</span>
    </div>
  </div>
);

export default Logo;
