import React, { useState, useRef } from 'react';
import './ImageUploader.css';

interface ImageUploaderProps {
  onImageConverted: (pixels: Array<{x: number, y: number, color: string}>, width: number, height: number) => void;
  maxSize: number;
  onClear?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageConverted, maxSize = 80, onClear }) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setError('Please select an image file (jpg, png, etc.)');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > maxSize || img.height > maxSize) {
          setError(`Image too large (${img.width}x${img.height}). Maximum size is ${maxSize}x${maxSize} pixels.`);
          setProcessing(false);
          return;
        }
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        try {
          const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const pixels = [];
          
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              const r = pixelData[i];
              const g = pixelData[i + 1];
              const b = pixelData[i + 2];
              const a = pixelData[i + 3];
              
              if (a < 128) continue;
              
              const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              pixels.push({ x, y, color: hex });
            }
          }
          
          onImageConverted(pixels, canvas.width, canvas.height);
          setHasImage(true);
          
        } catch (err) {
          setError('Error processing image');
          console.error('Error processing image:', err);
        }
        
        setProcessing(false);
      };
      
      img.onerror = () => {
        setError('Failed to load image');
        setProcessing(false);
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };
  
  const handleClearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    setHasImage(false);
    setError(null);
    
    if (onClear) {
      onClear();
    }
    onImageConverted([], 0, 0);
  };

  return (
    <div className="image-uploader">
      <h3>Import Image</h3>
      <p className="uploader-info">
        Upload an image to convert into pixel art (max {maxSize}x{maxSize})
      </p>
      
      <div className="upload-controls">
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload}
          id="image-upload"
          className="file-input"
          disabled={processing}
        />
        <label htmlFor="image-upload" className="upload-button">
          {processing ? 'Processing...' : 'Select Image'}
        </label>
        
        {hasImage && (
          <button 
            onClick={handleClearImage} 
            className="clear-button"
            disabled={processing}
          >
            Clear Image
          </button>
        )}
      </div>
      
      {error && <div className="upload-error">{error}</div>}
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageUploader;