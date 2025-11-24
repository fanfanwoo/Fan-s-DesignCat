import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Circle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera on mobile
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-white">
          <X size={24} />
        </button>
      </div>

      {error ? (
        <div className="text-red-500 p-4 text-center">{error}</div>
      ) : (
        <div className="relative w-full h-full flex flex-col">
           {/* Video Container */}
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-black">
             <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-h-full max-w-full object-contain"
            />
          </div>
          
          {/* Controls */}
          <div className="h-24 bg-black/80 flex items-center justify-center pb-6 pt-2">
            <button
              onClick={handleCapture}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-full bg-white border-2 border-black"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
