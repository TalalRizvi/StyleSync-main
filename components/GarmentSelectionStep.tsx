import React, { useState, useRef, useEffect } from 'react';
import type { Garment } from '../types';
import { getGarments } from '../services/catalogService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import UploadIcon from './icons/UploadIcon';


interface GarmentSelectionStepProps {
  garmentType: 'upper' | 'lower';
  selectedBrand: string;
  setSelectedGarment: (garment: Garment) => void;
  setCustomGarmentImage: (image: { base64: string; mimeType: string } | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const GarmentSelectionStep: React.FC<GarmentSelectionStepProps> = ({ garmentType, selectedBrand, setSelectedGarment, setCustomGarmentImage, onNext, onBack }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customGarmentPreview, setCustomGarmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [garments, setGarments] = useState<Garment[]>([]);
  
  const isCustomFlow = selectedBrand === 'Custom';

  useEffect(() => {
    if (!isCustomFlow) {
      const allGarments = getGarments();
      setGarments(allGarments.filter(g => g.bodyPlacement === garmentType && g.brand === selectedBrand));
    }
  }, [garmentType, selectedBrand, isCustomFlow]);

  const handleSelect = (garment: Garment) => {
    setSelectedId(garment.id);
    setSelectedGarment(garment);
     if (garment.id !== "-1") {
      setCustomGarmentPreview(null);
      setCustomGarmentImage(null);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const imageUrl = reader.result as string;
        
        setCustomGarmentImage({ base64: base64String, mimeType: file.type });
        setCustomGarmentPreview(imageUrl);
        
        const customGarment: Garment = {
            id: "-1", // Use a unique ID for custom garments
            name: 'Your Uploaded Item',
            brand: 'Custom',
            bodyPlacement: garmentType,
            type: 'custom item', // The AI will just use the image
            color: 'custom',
            imageUrl: imageUrl, // Show the preview
            sizeChart: {}, // No size chart available
        };
        handleSelect(customGarment);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleNext = () => {
    if (selectedId !== null) {
      onNext();
    }
  };
  
  const title = isCustomFlow
    ? `Upload a ${garmentType === 'upper' ? 'Top' : 'Bottom'}`
    : `Select a ${garmentType === 'upper' ? 'Top' : 'Bottom'} from ${selectedBrand}`;

  const description = isCustomFlow
    ? "Upload an image of an item to try on."
    : "Choose an item you'd like to try on, or upload your own.";
    
  const nextButtonText = garmentType === 'upper' ? 'See Try-On' : 'Add to Outfit';

  const UploaderCard = (
    <div
      onClick={handleUploadClick}
      className={`cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 flex flex-col items-center justify-center text-center ${selectedId === "-1" ? 'border-primary shadow-lg scale-105' : 'border-dashed border-gray-300 hover:border-primary-focus'}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {selectedId === "-1" && customGarmentPreview ? (
        <>
          <div className="relative w-full">
            <img src={customGarmentPreview} alt="Your Uploaded Garment" className="w-full h-48 object-cover rounded-md" />
            <div className="absolute inset-0 bg-primary bg-opacity-50 flex items-center justify-center rounded-md">
              <CheckCircleIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h3 className="font-semibold text-sm text-gray-800 mt-2">Your Item</h3>
          <p className="text-xs text-muted">Selected</p>
        </>
      ) : (
        <>
          <UploadIcon className="h-12 w-12 text-gray-400 mb-2" />
          <h3 className="font-semibold text-sm text-gray-800">Upload Your Own</h3>
          <p className="text-xs text-muted">Try on any item</p>
        </>
      )}
    </div>
  );


  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">{title}</h2>
      <p className="text-muted mb-6 text-center">{description}</p>
      
      {isCustomFlow ? (
        <div className="w-full max-w-xs mx-auto">
          {UploaderCard}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {garments.map((garment) => (
            <div
              key={garment.id}
              onClick={() => handleSelect(garment)}
              className={`cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 ${selectedId === garment.id ? 'border-primary shadow-lg scale-105' : 'border-gray-200 hover:border-primary-focus'}`}
            >
              <div className="relative">
                <img src={garment.imageUrl} alt={garment.name} className="w-full h-48 object-cover rounded-md" />
                {selectedId === garment.id && (
                  <div className="absolute inset-0 bg-primary bg-opacity-50 flex items-center justify-center rounded-md transition-opacity duration-300">
                    <CheckCircleIcon className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-sm text-gray-800 mt-2">{garment.name}</h3>
              <p className="text-xs text-muted">{garment.brand}</p>
            </div>
          ))}
          {UploaderCard}
        </div>
      )}


      <div className="mt-8 flex w-full justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus"
        >
          <ArrowLeftIcon />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={selectedId === null}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {nextButtonText}
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
};

export default GarmentSelectionStep;