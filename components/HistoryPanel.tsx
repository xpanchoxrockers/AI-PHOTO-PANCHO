import React from 'react';
import type { PhotoShootSession } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { TrashIcon } from './icons/TrashIcon';

interface HistoryPanelProps {
  sessions: PhotoShootSession[];
  onLoad: (session: PhotoShootSession) => void;
  onDelete: (sessionId: string) => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ sessions, onLoad, onDelete, onClear }) => {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-indigo-400" />
            <h2 className="text-3xl font-bold text-center">Historial de Sesiones</h2>
        </div>
        <button
            onClick={onClear}
            className="px-4 py-2 text-sm bg-red-800/70 hover:bg-red-700 text-red-100 rounded-lg transition-colors"
        >
            Limpiar Historial
        </button>
      </div>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-shrink-0 grid grid-cols-3 gap-1 w-32">
              <img src={session.generatedImages[0].src || ''} alt="Preview 1" className="w-full h-auto object-cover rounded aspect-square" />
              <img src={session.generatedImages[1].src || ''} alt="Preview 2" className="w-full h-auto object-cover rounded aspect-square" />
              <img src={session.generatedImages[2].src || ''} alt="Preview 3" className="w-full h-auto object-cover rounded aspect-square" />
            </div>
            <div className="flex-grow text-center sm:text-left">
              <p className="font-semibold">{session.scenario}</p>
              <p className="text-sm text-gray-400">
                {new Date(session.timestamp).toLocaleString()} - Estilo: {session.style}
              </p>
            </div>
            <div className="flex-shrink-0 flex gap-2">
              <button
                onClick={() => onLoad(session)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Cargar
              </button>
              <button
                onClick={() => onDelete(session.id)}
                className="p-2 bg-gray-700 hover:bg-red-800/80 text-gray-300 hover:text-red-200 rounded-lg transition-colors"
                title="Eliminar sesión"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;
