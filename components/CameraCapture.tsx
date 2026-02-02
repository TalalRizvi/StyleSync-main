
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: { file: File; base64: string; mimeType: string }) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please check permissions and try again.');
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const context = canvas.getContext('2d');
      if(context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Flip the image horizontally for a mirror effect in the preview
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stream?.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };
  
  const handleUsePhoto = () => {
    if (capturedImage) {
      const mimeType = 'image/jpeg';
      const base64 = capturedImage.split(',')[1];
      
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const file = new File([blob], 'camera-photo.jpg', { type: mimeType });

      onCapture({ file, base64, mimeType });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg relative p-6">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted hover:text-text z-10" aria-label="Close camera">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">Take a Photo</h2>

        <div className="w-full aspect-square bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
            {error ? (
                <p className="text-red-400 p-4 text-center">{error}</p>
            ) : capturedImage ? (
                <img src={capturedImage} alt="Captured" className="object-contain h-full w-full" />
            ) : (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover transform scale-x-[-1]"></video>
            )}
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>

        <div className="mt-6 flex justify-center items-center space-x-4">
            {capturedImage ? (
                <>
                    <button onClick={handleRetake} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                        Retake
                    </button>
                    <button onClick={handleUsePhoto} className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover">
                        Use Photo
                    </button>
                </>
            ) : (
                <button onClick={handleCapture} disabled={!!error} className="w-16 h-16 rounded-full bg-white border-4 border-primary ring-2 ring-white flex items-center justify-center disabled:bg-gray-300 disabled:border-gray-500">
                    <span className="w-12 h-12 rounded-full bg-primary block"></span>
                    <span className="sr-only">Capture photo</span>
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
