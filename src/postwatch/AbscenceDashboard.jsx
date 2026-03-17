import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Search } from 'lucide-react';
import { doc, updateDoc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AbsenceDashboard = ({ operators, account }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [postes, setPostes] = useState([]);
  const [lignes, setLignes] = useState([]);

  useEffect(() => {
    if (!account) return;
    const postsCollection = collection(db, 'postes');
    const unsubscribe = onSnapshot(postsCollection, (snapshot) => {
      const postsList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.accountId === account.id);
      setPostes(postsList);
    });
    return () => unsubscribe();
  }, [account]);

  useEffect(() => {
    if (!account) return;
    const linesCollection = collection(db, 'lignes');
    const unsubscribe = onSnapshot(linesCollection, (snapshot) => {
      const linesList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(l => l.accountId === account.id);
      setLignes(linesList);
    });
    return () => unsubscribe();
  }, [account]);

  const stats = {
    total: operators.length,
    presents: operators.filter(o => !o.absent).length,
    absents: operators.filter(o => o.absent).length
  };

  const toggleAbsence = async (id, currentStatus) => {
    try {
      const operatorRef = doc(db, 'operateurs', id);
      const newStatus = !currentStatus;
      await updateDoc(operatorRef, { absent: newStatus });

      const operator = operators.find(op => op.id === id);
      const post = postes.find(p => p.id === operator?.posteId);
      const line = lignes.find(l => l.id === operator?.ligneId);
      const statusLabel = newStatus ? 'absent' : 'présent';

      // Log to history
      await addDoc(collection(db, 'historique'), {
        date: new Date(),
        type: newStatus ? 'ABSENCE' : 'PRESENCE',
        description: `${operator?.prenom} ${operator?.nom} (Matricule: ${operator?.matricule || '?'}) a été ${statusLabel} au ${post?.nom || 'Poste Inconnu'} (${line?.nom || 'Ligne Inconnue'})`,
        operatorId: id,
        posteId: operator?.posteId || '',
        ligneId: operator?.ligneId || '',
        utilisateur: 'Admin',
        accountId: account.id
      });

      // --- AUTO-REPLACEMENT LOGIC ---
      if (newStatus && operator && operator.posteId && operator.posteId !== 'Backup') {
        const postId = operator.posteId;
        const availableBackup = operators.find(op =>
          op.id !== id && !op.absent && (op.posteId === 'Backup' || !op.posteId) && op.backupFor?.includes(postId)
        );

        if (availableBackup) {
          const backupRef = doc(db, 'operateurs', availableBackup.id);
          await updateDoc(backupRef, {
            posteId: postId,
            ligneId: operator.ligneId || ''
          });

          await addDoc(collection(db, 'historique'), {
            date: new Date(),
            type: 'AFFECTATION',
            description: `REMPLACEMENT AUTO: ${availableBackup.prenom} ${availableBackup.nom} (Backup) a pris le poste ${post?.nom || 'Inconnu'} en l'absence de ${operator.prenom}`,
            operatorId: availableBackup.id,
            posteId: postId,
            ligneId: operator.ligneId || '',
            utilisateur: 'Système',
            accountId: account.id
          });
        }
      } else if (!newStatus && operator && operator.posteId && operator.posteId !== 'Backup') {
        const postId = operator.posteId;
        const fillingBackup = operators.find(op =>
          op.id !== id && op.posteId === postId && op.backupFor?.includes(postId)
        );

        if (fillingBackup) {
          const backupRef = doc(db, 'operateurs', fillingBackup.id);
          await updateDoc(backupRef, {
            posteId: 'Backup',
            ligneId: ''
          });

          await addDoc(collection(db, 'historique'), {
            date: new Date(),
            type: 'AFFECTATION',
            description: `RETOUR POOL: ${fillingBackup.prenom} ${fillingBackup.nom} est retourné au pool Backup (Retour de ${operator.prenom})`,
            operatorId: fillingBackup.id,
            posteId: 'Backup',
            ligneId: '',
            utilisateur: 'Système',
            accountId: account.id
          });
        }
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const filteredOperators = operators.filter(op => {
    const post = postes.find(p => p.id === op.posteId);
    return (
      (op.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.matricule || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post?.nom || op.poste || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const statCards = [
    { title: 'Total Opérateurs', value: stats.total, icon: <Users size={24} />, bg: 'bg-blue-100', color: 'text-blue-700' },
    { title: 'Opérateurs Présents', value: stats.presents, icon: <UserCheck size={24} />, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { title: 'Opérateurs Absents', value: stats.absents, icon: <UserX size={24} />, bg: 'bg-rose-100', color: 'text-rose-600' },
  ];


  const presentOperators = filteredOperators.filter(op => !op.absent);
  const absentOperators = filteredOperators.filter(op => op.absent);

  const OperatorTable = ({ list, title, icon, colorClass, emptyMessage }) => (
    <div className="saas-table-container stagger-item animate-delay-400 mb-8 border-none shadow-none">
      <div className={`p-6 border-b border-gray-100 flex items-center justify-between rounded-t-[2rem] ${colorClass === 'emerald' ? 'bg-emerald-50/10' : 'bg-rose-50/10'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${colorClass === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">{title}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{list.length} Opérateurs</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto bg-white border border-gray-100 rounded-b-[2rem]">
        <table className="w-full text-left">
          <thead>
            <tr className={`border-b border-gray-50 ${colorClass === 'emerald' ? 'bg-emerald-50/5' : 'bg-rose-50/5'}`}>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[150px]">Ligne</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[150px]">Matricule</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nom & Prénom</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Poste</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right pr-12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length > 0 ? (
              list.map(op => {
                const post = postes.find(p => p.id === op.posteId);
                const line = lignes.find(l => l.id === op.ligneId);
                return (
                  <tr key={op.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {line?.nom || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-bold text-navy-600 bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                        {op.matricule || '---'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{op.nom}</span>
                        <span className="text-[11px] font-medium text-gray-500">{op.prenom}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black bg-gray-50 border border-gray-100 text-gray-500 uppercase tracking-tight">
                        {post?.nom || op.poste || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right pr-10">
                      <button 
                        onClick={() => toggleAbsence(op.id, op.absent)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${op.absent ? 'bg-rose-500 focus:ring-rose-400/20' : 'bg-emerald-500 focus:ring-emerald-400/20 shadow-lg shadow-emerald-500/20'}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${op.absent ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-8 py-16 text-center">
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">{emptyMessage}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="stagger-item">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestion des Absences</h1>
        <p className="text-base text-gray-500 mt-2 font-medium">Suivi journalier des présences pour le <span className="text-blue-600 font-bold">{currentDate}</span></p>
      </div>

      {/* Stats and Search */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className={`saas-stat-card group stagger-item animate-delay-${(i + 1) * 100}`}>
              <div className={`saas-icon-box ${stat.bg} ${stat.color} group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-4xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="modern-search-container max-w-2xl mx-auto">
          <input type="text" placeholder="Rechercher par nom ou poste..." className="modern-search-input"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="modern-search-icon-box">
            <Search size={18} />
          </div>
        </div>
      </div>

      {/* Table Sections */}
      <div className="space-y-8 stagger-item animate-delay-400">
        <OperatorTable 
          list={absentOperators} 
          title="Opérateurs Absents" 
          icon={<UserX size={20} />} 
          colorClass="rose"
          emptyMessage="Aucun absent aujourd'hui"
        />

        <OperatorTable 
          list={presentOperators} 
          title="Opérateurs Présents" 
          icon={<UserCheck size={20} />} 
          colorClass="emerald"
          emptyMessage="Tout le monde est absent"
        />
      </div>
    </div>
  );
};

export default AbsenceDashboard;