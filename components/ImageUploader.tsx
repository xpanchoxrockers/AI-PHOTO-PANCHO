import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PhotoIcon } from './icons/PhotoIcon';

interface ImageUploaderProps {
  title: string;
  onImageUpload: (base64: string) => void;
  imageKey: string | null; // Used to reset the component from the parent
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload, imageKey }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImagePreview(imageKey);
  }, [imageKey]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        onImageUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
      <div
        onClick={handleAreaClick}
        className="flex-grow w-full h-64 cursor-pointer bg-gray-900/70 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:border-indigo-500 hover:bg-gray-800/80"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg p-2" />
        ) : (
          <div className="text-center text-gray-500">
            <PhotoIcon className="w-12 h-12 mx-auto mb-2" />
            <p>Haz clic para subir una imagen</p>
            <p className="text-sm">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
