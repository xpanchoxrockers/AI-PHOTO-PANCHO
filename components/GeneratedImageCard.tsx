import React, { useState } from 'react';
import { CompareIcon } from './icons/CompareIcon';

interface GeneratedImageCardProps {
  title: string;
  src: string | null;
  original: string | null;
}

const GeneratedImageCard: React.FC<GeneratedImageCardProps> = ({ title, src, original }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleToggle = () => {
    if (original) {
      setShowOriginal(!showOriginal);
    }
  };

  const displayedImage = showOriginal ? original : src;
  const canCompare = !!original;

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden border border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h4 className="text-lg font-bold text-gray-200">{title}</h4>
        {canCompare && (
          <button 
            onClick={handleToggle}
            title={showOriginal ? "Mostrar imagen generada" : "Mostrar imagen original"}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <CompareIcon className="w-6 h-6 text-indigo-400" />
          </button>
        )}
      </div>
      <div className="relative aspect-[9/16] w-full bg-gray-900 flex items-center justify-center">
        {displayedImage ? (
          <>
            <img src={displayedImage} alt={title} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {showOriginal ? 'Original' : 'Generada'}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <svg className="animate-spin h-8 w-8 text-indigo-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Generando...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedImageCard;
