import React from 'react';

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

const styles = ['Editorial', 'Cinematográfico', 'Retro', 'Minimalista'];

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleChange }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-100 mb-3 text-center">4. Elige un Estilo Visual</h3>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {styles.map((style) => (
          <button
            key={style}
            onClick={() => onStyleChange(style)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              selectedStyle === style
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
