import React from 'react';
import { X } from 'lucide-react';

const BackupModal = ({ isOpen, postName, onClose }) => {
  if (!isOpen) return null;

  const backups = [
    "Fatimezzahra Salah",
    "Fatimezzahra Salah",
    "Najoua Adnani",
    "Assma Hamdani",
    "Hakima Taleb"
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 flex justify-between items-center border-b">
          <h2 className="text-xl font-bold">
            Liste de Backup pour le poste: <span className="font-black underline">{postName}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">Opérateur</div>
          <div className="divide-y divide-gray-100">
            {backups.map((name, index) => (
              <div key={index} className="px-4 py-4 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {name}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-100 text-gray-800 px-8 py-2 rounded-lg font-bold hover:bg-gray-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupModal;