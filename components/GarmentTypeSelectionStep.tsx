
import React from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ShirtIcon from './icons/ShirtIcon';
import PantsIcon from './icons/PantsIcon';

interface GarmentTypeSelectionStepProps {
  onSelectUpper: () => void;
  onSelectLower: () => void;
  onBack: () => void;
}

const GarmentTypeSelectionStep: React.FC<GarmentTypeSelectionStepProps> = ({ onSelectUpper, onSelectLower, onBack }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Choose a Garment Type</h2>
      <p className="text-muted mb-8">What would you like to try on first?</p>
      
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Upper Body Card */}
        <button
          onClick={onSelectUpper}
          className="group flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg shadow-sm border-2 border-transparent hover:border-primary hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          aria-label="Select upper body garment"
        >
          <ShirtIcon className="h-20 w-20 text-gray-400 group-hover:text-primary transition-colors duration-300" />
          <span className="mt-4 text-lg font-semibold text-gray-800">Upper Body</span>
          <span className="text-sm text-muted">T-shirts, Jackets, etc.</span>
        </button>
        
        {/* Lower Body Card */}
        <button
          onClick={onSelectLower}
          className="group flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg shadow-sm border-2 border-transparent hover:border-primary hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          aria-label="Select lower body garment"
        >
          <PantsIcon className="h-20 w-20 text-gray-400 group-hover:text-primary transition-colors duration-300" />
          <span className="mt-4 text-lg font-semibold text-gray-800">Lower Body</span>
          <span className="text-sm text-muted">Pants, Shorts, etc.</span>
        </button>
      </div>

      <div className="mt-10 flex w-full justify-start max-w-2xl">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus"
        >
          <ArrowLeftIcon />
          Back
        </button>
      </div>
    </div>
  );
};

export default GarmentTypeSelectionStep;