
import React from 'react';

interface TutorialProps {
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to Style Sync!</h2>
            <p className="mt-2 text-muted">Your personal virtual try-on assistant.</p>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">1</div>
              <div>
                <h3 className="font-semibold text-gray-800">Upload Your Photo</h3>
                <p className="text-sm text-muted">Start by uploading a clear, full-body photo of yourself. Our AI will estimate your measurements.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">2</div>
              <div>
                <h3 className="font-semibold text-gray-800">Select Garments</h3>
                <p className="text-sm text-muted">Choose from our catalog or upload a photo of an item you want to try on.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">3</div>
              <div>
                <h3 className="font-semibold text-gray-800">See Your New Look</h3>
                <p className="text-sm text-muted">Get an AI-generated preview of how the clothes fit on you, along with size recommendations.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 rounded-b-xl text-right">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
