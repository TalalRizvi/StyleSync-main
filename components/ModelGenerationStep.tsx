import React, { useEffect } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import Compare from './Compare';

interface ModelGenerationStepProps {
  userImage: { file: File; base64: string; mimeType: string; } | null;
  modelImage: { base64: string; mimeType: string; } | null;
  onGenerate: () => void;
  isGenerating: boolean;
  error: string | null;
  onNext: () => void;
  onBack: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center text-white">
        <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-medium">Creating your model...</p>
        <p className="text-sm opacity-80">This may take a moment.</p>
    </div>
);

const ModelGenerationStep: React.FC<ModelGenerationStepProps> = ({ userImage, modelImage, onGenerate, isGenerating, error, onNext, onBack }) => {
  useEffect(() => {
    if (userImage && !modelImage && !isGenerating && !error) {
      onGenerate();
    }
  }, [userImage, modelImage, onGenerate, isGenerating, error]);

  const userImageUrl = userImage ? `data:${userImage.mimeType};base64,${userImage.base64}` : '';
  const modelImageUrl = modelImage ? `data:${modelImage.mimeType};base64,${modelImage.base64}` : '';

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Create Your Virtual Model</h2>
      <p className="text-muted mb-8">
        {modelImage ? 'Slide to compare your photo with the generated model.' : "We're turning your photo into a reusable model for virtual try-ons."}
      </p>
      
      <div className="w-full max-w-lg mx-auto">
        {/* If we have the generated model, show the Compare slider */}
        {modelImage && !isGenerating ? (
          <Compare 
            firstImage={userImageUrl}
            secondImage={modelImageUrl}
          />
        ) : (
          /* Otherwise, show the user image with a loading/error overlay */
          <div className="relative w-full aspect-[3/4] rounded-lg shadow-lg overflow-hidden">
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                {userImage && <img src={userImageUrl} alt="Your photo" className="max-h-full max-w-full object-contain" />}
            </div>
            
            {/* Overlay for loading or error */}
            {(isGenerating || error) && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                {isGenerating && <LoadingSpinner />}
                {error && !isGenerating && (
                  <div className="text-center text-white">
                    <p className="font-semibold text-red-400 text-lg">Generation Failed</p>
                    <p className="text-sm mt-2 max-w-xs">{error}</p>
                    <button 
                      onClick={onGenerate} 
                      className="mt-6 text-sm font-semibold text-primary bg-white hover:bg-gray-200 px-6 py-2 rounded-full transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-10 flex w-full justify-between max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus"
        >
          <ArrowLeftIcon />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!modelImage || isGenerating}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Next: Check Measurements
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
};

export default ModelGenerationStep;
