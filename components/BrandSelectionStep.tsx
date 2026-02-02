import React, { useState, useEffect } from 'react';
import { getGarments } from '../services/catalogService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UploadIcon from './icons/UploadIcon';

interface BrandSelectionStepProps {
  garmentType: 'upper' | 'lower';
  onSelectBrand: (brand: string) => void;
  onBack: () => void;
}

const BrandSelectionStep: React.FC<BrandSelectionStepProps> = ({ garmentType, onSelectBrand, onBack }) => {
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    const allGarments = getGarments();
    const relevantGarments = allGarments.filter(g => g.bodyPlacement === garmentType);
    const uniqueBrands = [...new Set(relevantGarments.map(g => g.brand))].sort();
    setBrands(uniqueBrands);
  }, [garmentType]);

  const title = `Select a Brand for ${garmentType === 'upper' ? 'Upper' : 'Lower'} Garments`;

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-muted mb-8">Choose a brand or upload an image of your own item.</p>
      
      <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-4">
        {brands.map(brand => (
          <button
            key={brand}
            onClick={() => onSelectBrand(brand)}
            className="group flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg shadow-sm border-2 border-transparent hover:border-primary hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label={`Select brand: ${brand}`}
          >
            <span className="text-lg font-semibold text-gray-800">{brand}</span>
          </button>
        ))}
        {/* Custom Upload Button */}
         <button
            onClick={() => onSelectBrand('Custom')}
            className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-primary hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label="Upload your own garment"
          >
            <UploadIcon className="h-8 w-8 text-gray-400 mb-2 group-hover:text-primary transition-colors" />
            <span className="text-md font-semibold text-gray-700 group-hover:text-primary transition-colors">Upload Your Own</span>
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

export default BrandSelectionStep;