import React, { useState, useCallback } from 'react';
import ArrowRightIcon from './icons/ArrowRightIcon';
import CameraIcon from './icons/CameraIcon';
import CameraCapture from './CameraCapture';
import PoseGuide from './PoseGuide';
import PoseGuideIcon from './icons/PoseGuideIcon';

interface UploadStepProps {
  setUserImage: (image: { file: File; base64: string; mimeType: string; } | null) => void;
  onNext: () => void;
}

const UploadStep: React.FC<UploadStepProps> = ({ setUserImage, onNext }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [showPoseGuide, setShowPoseGuide] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file.');
        setPreview(null);
        setFile(null);
        setUserImage(null);
        return;
      }
      
      setError('');
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        const base64String = (reader.result as string).split(',')[1];
        setUserImage({ file: selectedFile, base64: base64String, mimeType: selectedFile.type });
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [setUserImage]);

  const handleImageCapture = (imageData: { file: File; base64: string; mimeType: string; }) => {
    const { file, base64, mimeType } = imageData;
    const previewUrl = `data:${mimeType};base64,${base64}`;

    setError('');
    setFile(file);
    setPreview(previewUrl);
    setUserImage({ file, base64, mimeType });
    setShowCamera(false);
  };

  const handleReset = useCallback(() => {
    setPreview(null);
    setFile(null);
    setUserImage(null);
    setError('');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  }, [setUserImage]);

  return (
    <>
      {showCamera && (
        <CameraCapture 
            onCapture={handleImageCapture}
            onClose={() => setShowCamera(false)}
        />
      )}
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload Your Photo</h2>
        <p className="text-muted mb-2">For best results, upload a clear, full-body photo.</p>
        <button 
            onClick={() => setShowPoseGuide(!showPoseGuide)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover mb-4 transition-colors"
            aria-controls="pose-guide-container"
            aria-expanded={showPoseGuide}
        >
            <PoseGuideIcon className="h-4 w-4" />
            {showPoseGuide ? 'Hide' : 'Show'} Pose Guide
        </button>
        
        <div className="w-full max-w-sm">
          <div id="pose-guide-container" className="relative mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 bg-gray-50">
            {showPoseGuide && !preview && <PoseGuide />}
            {preview ? (
              <img src={preview} alt="Image preview" className="max-h-60 rounded-lg object-contain" />
            ) : (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-focus focus-within:ring-offset-2 hover:text-primary-hover">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>

                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-2 text-sm text-gray-500">OR</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowCamera(true)} 
                  className="mt-6 inline-flex w-full justify-center items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  aria-label="Take a photo with your camera"
                >
                  <CameraIcon />
                  Take a Photo
                </button>
              </div>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4">
           {preview && (
            <button
                onClick={handleReset}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus"
            >
                Change Photo
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!file}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create My Model
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default UploadStep;