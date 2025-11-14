import React, { useEffect, useRef, useState } from 'react';

interface CameraPreviewProps {
  isActive: boolean;
  onError?: (message: string) => void;
  onVideoReady?: (video: HTMLVideoElement) => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ isActive, onError, onVideoReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isActive) {
      // Stop all tracks when inactive
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setHasError(false);
      setErrorMessage('');
      return;
    }

    // Request camera access
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Call onVideoReady when video is ready to play
          const handleLoadedData = () => {
            if (videoRef.current && onVideoReady) {
              onVideoReady(videoRef.current);
            }
          };
          
          videoRef.current.addEventListener('loadeddata', handleLoadedData);
        }
        setHasError(false);
        setErrorMessage('');
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to access camera. Please grant camera permissions.';
        setHasError(true);
        setErrorMessage(message);
        if (onError) {
          onError(message);
        }
      }
    };

    startCamera();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, onError, onVideoReady]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center p-4">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
              <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} />
            </svg>
            <p className="text-white font-medium mb-1">Camera Access Error</p>
            <p className="text-gray-300 text-sm">{errorMessage}</p>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      )}
    </div>
  );
};

export default CameraPreview;
