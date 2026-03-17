import React, { useState } from 'react';
import { Users } from 'lucide-react';

const AbsenceDashboard2 = () => {
  const [absences, setAbsences] = useState([
    { id: 1, nom: "Ilham", prenom: "Bhouihy", poste: "Assemblage", absent: false },
    { id: 2, nom: "Samira", prenom: "Bennour", poste: "Assemblage", absent: true },
    { id: 3, nom: "Meryem", prenom: "Zarrouk", poste: "Self 1", absent: false },
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Gestion d'absences pour le 29/03/2025</h1>
      <p className="text-gray-500 mb-8">Gérer vos absences</p>

      {/* Cartes Indicateurs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600 mb-2 font-semibold">
            <Users size={20} /> Total des Opérateurs
          </div>
          <span className="text-4xl font-black">28</span>
        </div>
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600 mb-2 font-semibold">
            <Users size={20} /> Opérateurs Présents
          </div>
          <span className="text-4xl font-black text-green-600">27</span>
        </div>
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600 mb-2 font-semibold">
            <Users size={20} /> Opérateurs Absents
          </div>
          <span className="text-4xl font-black text-red-600">1</span>
        </div>
      </div>

      {/* Table des absences */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-400 text-sm">
              <th className="px-6 py-4 font-semibold">Nom</th>
              <th className="px-6 py-4 font-semibold">Prénom</th>
              <th className="px-6 py-4 font-semibold">Poste</th>
              <th className="px-6 py-4 font-semibold text-right">Absence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {absences.map((op) => (
              <tr key={op.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{op.nom}</td>
                <td className="px-6 py-4 font-medium">{op.prenom}</td>
                <td className="px-6 py-4 text-gray-600">{op.poste}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${op.absent ? 'bg-black' : 'bg-gray-200'}`}
                    onClick={() => {/* Logic toggle */}}
                  >
                    <span className={`h-4 w-4 rounded-full bg-white transition-transform ${op.absent ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AbsenceDashboard2;