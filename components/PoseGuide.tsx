import React from 'react';

const PoseGuide: React.FC = () => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none text-primary opacity-60"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 150 250"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
      >
        {/* Frame */}
        <path d="M 2 2 L 2 20 M 2 2 L 20 2" />
        <path d="M 148 2 L 130 2 M 148 2 L 148 20" />
        <path d="M 2 248 L 2 230 M 2 248 L 20 248" />
        <path d="M 148 248 L 130 248 M 148 248 L 148 230" />

        {/* Silhouette */}
        <circle cx="75" cy="35" r="15" />
        <path d="M 75 50 L 75 120" />
        <path d="M 75 70 L 45 100" />
        <path d="M 75 70 L 105 100" />
        <path d="M 75 120 L 50 210" />
        <path d="M 75 120 L 100 210" />

        {/* Text */}
        <text x="75" y="15" textAnchor="middle" fontSize="10" stroke="none" fill="currentColor" style={{fontWeight: 600}}>
          CENTER FULL BODY IN FRAME
        </text>
      </svg>
    </div>
  );
};

export default PoseGuide;