import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedImageCard from './components/GeneratedImageCard';
import StyleSelector from './components/StyleSelector';
import HistoryPanel from './components/HistoryPanel';
import { generatePhotoShoot } from './services/geminiService';
import { SparklesIcon } from './components/icons/SparklesIcon';
import type { GeneratedImage, PhotoShootSession } from './types';

/**
 * Resizes a base64 image string to fit within the specified dimensions.
 * @param base64Str The base64 string of the image.
 * @param maxWidth The maximum width of the resized image.
 * @param maxHeight The maximum height of the resized image.
 * @param quality The quality of the output JPEG image (0 to 1).
 * @returns A promise that resolves with the resized base64 string, or null if input is null.
 */
const resizeImage = (
  base64Str: string | null,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string | null> => {
  if (!base64Str) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
  });
};


const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [accessoryImage, setAccessoryImage] = useState<string | null>(null);
  const [scenario, setScenario] = useState<string>('');
  const [style, setStyle] = useState<string>('Editorial');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PhotoShootSession[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('photoShootHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      localStorage.removeItem('photoShootHistory');
    }
  }, []);

  const saveHistory = (newHistory: PhotoShootSession[]) => {
    try {
        setHistory(newHistory);
        localStorage.setItem('photoShootHistory', JSON.stringify(newHistory));
    } catch (e) {
        console.error("Failed to save history to localStorage", e);
        setError("No se pudo guardar la sesión en el historial. Es posible que el almacenamiento del navegador esté lleno.");
    }
  };

  const isButtonDisabled = !personImage || !accessoryImage || !scenario || isLoading;

  const handleGenerate = useCallback(async () => {
    if (isButtonDisabled) return;

    setIsLoading(true);
    setError(null);
    const placeholderImages: GeneratedImage[] = [
      { title: 'Retrato de Cuerpo Completo', src: null, original: personImage },
      { title: 'Foto del Accesorio', src: null, original: accessoryImage },
      { title: 'Escena de Estilo de Vida', src: null, original: personImage },
    ];
    setGeneratedImages(placeholderImages);

    try {
      if (!personImage || !accessoryImage) {
        throw new Error('Please upload both images.');
      }
      const results = await generatePhotoShoot(
        personImage, 
        accessoryImage, 
        scenario, 
        style,
        (message) => setLoadingMessage(message)
      );
      const finalImages: GeneratedImage[] = [
        { title: 'Retrato de Cuerpo Completo', src: results[0], original: personImage },
        { title: 'Foto del Accesorio', src: results[1], original: accessoryImage },
        { title: 'Escena de Estilo de Vida', src: results[2], original: personImage },
      ];
      setGeneratedImages(finalImages);
      
      // Create a version of the session for localStorage with resized images to prevent quota errors.
      const resizedPersonImage = await resizeImage(personImage);
      const resizedAccessoryImage = await resizeImage(accessoryImage);

      if (!resizedPersonImage || !resizedAccessoryImage) {
        throw new Error("Failed to resize input images for history session.");
      }

      const resizedGeneratedImages = await Promise.all(
        finalImages.map(async (image) => {
          const resizedSrc = await resizeImage(image.src);
          const resizedOriginal = image.original === personImage ? resizedPersonImage : resizedAccessoryImage;
          return { ...image, src: resizedSrc, original: resizedOriginal };
        })
      );

      const newSession: PhotoShootSession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        personImage: resizedPersonImage,
        accessoryImage: resizedAccessoryImage,
        scenario,
        style,
        generatedImages: resizedGeneratedImages,
      };

      // Limit history to the 10 most recent sessions
      const updatedHistory = [newSession, ...history].slice(0, 10);
      saveHistory(updatedHistory);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setGeneratedImages([]);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [personImage, accessoryImage, scenario, style, isButtonDisabled, history]);

  const handleLoadSession = useCallback((session: PhotoShootSession) => {
    setPersonImage(session.personImage);
    setAccessoryImage(session.accessoryImage);
    setScenario(session.scenario);
    setStyle(session.style);
    setGeneratedImages(session.generatedImages);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearHistory = useCallback(() => {
    saveHistory([]);
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    const updatedHistory = history.filter(s => s.id !== sessionId);
    saveHistory(updatedHistory);
  }, [history]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              AI Photo Shoot Generator
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Crea una sesión de fotos profesional a partir de una foto base y un accesorio. Sube las imágenes, describe un escenario y deja que la IA haga su magia.
          </p>
        </header>

        <main>
          <div className="bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-700 backdrop-blur-sm mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <ImageUploader title="1. Sube la foto de la persona" onImageUpload={setPersonImage} imageKey={personImage}/>
              <ImageUploader title="2. Sube la foto del accesorio" onImageUpload={setAccessoryImage} imageKey={accessoryImage} />
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">3. Describe el escenario</h3>
                <textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Ej: una calle urbana en Tokio de noche, una cafetería elegante en París, una playa al atardecer en Bali..."
                  className="flex-grow w-full bg-gray-900/70 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none"
                  rows={6}
                />
              </div>
            </div>
            
            <StyleSelector selectedStyle={style} onStyleChange={setStyle} />

            <div className="text-center mt-8">
              <button
                onClick={handleGenerate}
                disabled={isButtonDisabled}
                className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{loadingMessage || 'Generando...'}</span>
                  </>
                ) : (
                  'Generar Sesión de Fotos'
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
              <strong>Error:</strong> {error}
            </div>
          )}

          {(isLoading || generatedImages.length > 0) && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-center mb-8">Resultados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {generatedImages.map((image, index) => (
                  <GeneratedImageCard key={index} title={image.title} src={image.src} original={image.original} />
                ))}
              </div>
            </div>
          )}

          <HistoryPanel 
            sessions={history} 
            onLoad={handleLoadSession}
            onDelete={handleDeleteSession}
            onClear={handleClearHistory} 
          />
        </main>
      </div>
    </div>
  );
};

export default App;