import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  ArrowRight,
  Layers,
  Info,
  User,
  Activity,
  ShieldAlert,
  LayoutDashboard
} from 'lucide-react';
import { doc, updateDoc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PostStatus = ({ operators, account }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [postes, setPostes] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [showOperatorDetail, setShowOperatorDetail] = useState(null);

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

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const processedPosts = useMemo(() => {
    return postes.map(post => {
      const postOps = operators.filter(op => op.posteId === post.id);
      const occupiedOps = postOps.filter(op => !op.absent);
      const isOccupied = occupiedOps.length > 0;
      const lineData = lignes.find(l => l.id === post.ligneId);
      const availableBackupsForThis = operators.filter(op => 
        (op.posteId === 'Backup' || op.posteId === '') && 
        !op.absent && 
        op.backupFor?.includes(post.id)
      );

      return {
        ...post,
        ligneNom: lineData?.nom || 'Sans Ligne',
        isOccupied,
        hasBackup: availableBackupsForThis.length > 0,
        availableBackupsCount: availableBackupsForThis.length,
        operators: postOps,
        occupiedOps
      };
    }).filter(p => !p.backup && p.id !== 'Backup');
  }, [postes, operators, lignes]);

  const stats = useMemo(() => {
    const occupied = processedPosts.filter(p => p.isOccupied).length;
    const vacant = processedPosts.filter(p => !p.isOccupied).length;
    return { occupied, vacant };
  }, [processedPosts]);

  const groupedByLine = useMemo(() => {
    const groups = {};
    processedPosts.forEach(post => {
      if (!groups[post.ligneNom]) {
        groups[post.ligneNom] = {
          nom: post.ligneNom,
          occupied: [],
          vacant: []
        };
      }
      if (post.isOccupied) {
        groups[post.ligneNom].occupied.push(post);
      } else {
        const status = post.hasBackup ? 'yellow' : 'red';
        groups[post.ligneNom].vacant.push({ ...post, vacantStatus: status });
      }
    });
    return Object.values(groups).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [processedPosts]);

  const availableBackups = operators.filter(op => op.posteId === 'Backup' && op.polyvalence && !op.absent);

  const handleAffectation = async (operatorId, newPostId) => {
    try {
      const postOps = operators.filter(op => op.posteId === newPostId);
      const occupiedOps = postOps.filter(op => !op.absent);
      if (occupiedOps.length > 0) {
        alert("Ce poste est déjà occupé par un opérateur présent.");
        setSelectedPost(null);
        return;
      }

      const operatorRef = doc(db, 'operateurs', operatorId);
      const operator = operators.find(op => op.id === operatorId);
      const post = postes.find(p => p.id === newPostId);

      await updateDoc(operatorRef, {
        posteId: newPostId,
        ligneId: post?.ligneId || ''
      });

      await addDoc(collection(db, 'historique'), {
        date: new Date(),
        type: 'AFFECTATION',
        description: `${operator?.prenom} ${operator?.nom} a été affecté au ${post?.nom || 'Poste Inconnu'}`,
        operatorId: operatorId,
        posteId: newPostId,
        ligneId: post?.ligneId || '',
        utilisateur: 'Admin',
        accountId: account.id
      });

      setSelectedPost(null);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto animate-fade-in font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 stagger-item">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-navy-500 text-white rounded-lg shadow-lg shadow-navy-500/20">
              <LayoutDashboard size={20} />
            </div>
            <span className="text-xs font-black text-navy-500 uppercase tracking-[0.2em]">Dashboard Opérationnel</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            États des Postes <span className="text-navy-500">Critiques</span>
          </h1>
          <p className="text-sm font-bold text-gray-400">
            Mise à jour en temps réel pour le <span className="text-gray-900">{currentDate}</span>
          </p>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Occupés</p>
              <p className="text-2xl font-black text-gray-900">{stats.occupied}</p>
            </div>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500 opacity-50" />
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center relative z-10">
              <ShieldAlert size={24} className={stats.vacant > 0 ? "animate-soft-pulse" : ""} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alerte Vacant</p>
              <p className="text-2xl font-black text-rose-600">{stats.vacant}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 stagger-item animate-delay-200">

        {/* Left Card: Occupied Posts */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-2xl hover:shadow-navy-500/5">
          <div className="p-8 border-b border-gray-50 bg-emerald-50/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Postes Critiques Occupés</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Opérationnel et Stable</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-black">
              {stats.occupied} POSTES
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50/5">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em] border-b border-emerald-50/20">Ligne de production</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em] border-b border-emerald-50/20">Postes critiques occupés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/10">
                {groupedByLine.filter(g => g.occupied.length > 0).map((group, idx) => (
                  <tr key={group.nom} className="hover:bg-emerald-50/5 transition-colors group/row">
                    <td className="px-8 py-6 vertical-top min-w-[180px]">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{group.nom}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap gap-2">
                        {group.occupied.map(post => (
                          <button
                            key={post.id}
                            onClick={() => setShowOperatorDetail(post)}
                            className="group/post relative px-4 py-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 hover:bg-white hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                          >
                            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/10 group-hover/post:scale-110 transition-transform">
                              <User size={14} />
                            </div>
                            <div className="text-left">
                              <p className="text-[11px] font-black text-gray-900 leading-none mb-1 uppercase tracking-tight">{post.nom}</p>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{post.occupiedOps[0]?.prenom}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Vacant Posts */}
        <div className="bg-white rounded-[2rem] border border-rose-100 shadow-premium overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-2xl hover:shadow-rose-500/5">
          <div className="p-8 border-b border-rose-50 bg-rose-50/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 animate-soft-pulse">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Postes Critiques Non Occupés</h3>
                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Action Requise Immédiate
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-black shadow-lg shadow-rose-500/20 uppercase tracking-widest">
              {stats.vacant} ALERTE{stats.vacant > 1 ? 'S' : ''}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-rose-50/30">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-rose-900/40 uppercase tracking-[0.2em] border-b border-rose-100/30">Ligne de production</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-rose-900/40 uppercase tracking-[0.2em] border-b border-rose-100/30">Postes critiques non occupés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/20">
                {groupedByLine.filter(g => g.vacant.length > 0).map((group, idx) => (
                  <tr key={group.nom} className="hover:bg-rose-50 transition-colors group/row">
                    <td className="px-8 py-6 vertical-top min-w-[180px]">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-rose-500 rounded-full animate-soft-pulse" />
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{group.nom}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap gap-2">
                        {group.vacant.map(post => (
                          <button
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className={`group/post relative px-4 py-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                              post.vacantStatus === 'yellow' 
                              ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-400 shadow-sm' 
                              : 'bg-rose-500 border-rose-600 text-white hover:bg-rose-600 hover:shadow-xl hover:shadow-rose-500/30 animate-pulse-subtle'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all group-hover/post:scale-110 ${
                              post.vacantStatus === 'yellow'
                              ? 'bg-white text-amber-600'
                              : 'bg-white text-rose-600 group-hover/post:bg-rose-400 group-hover/post:text-white'
                            }`}>
                              {post.vacantStatus === 'yellow' ? <Activity size={14} /> : <ShieldAlert size={14} />}
                            </div>
                            <div className="text-left">
                              <p className={`text-[11px] font-black leading-none mb-1 uppercase tracking-tight ${
                                post.vacantStatus === 'yellow' ? 'text-amber-900' : 'text-white'
                              }`}>{post.nom}</p>
                              <div className="flex items-center gap-1">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${
                                  post.vacantStatus === 'yellow' ? 'text-amber-600' : 'text-rose-100'
                                }`}>
                                  {post.vacantStatus === 'yellow' ? `Backup dispos (${post.availableBackupsCount})` : 'Renforcer'}
                                </span>
                                <ArrowRight size={10} className={`${
                                  post.vacantStatus === 'yellow' ? 'text-amber-400' : 'text-white transition-transform group-hover:translate-x-0.5'
                                }`} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {stats.vacant === 0 && (
                  <tr>
                    <td colSpan="2" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Tous les postes critiques sont occupés</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Operator Detail Modal */}
      {showOperatorDetail && (
        <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in border border-gray-100 relative group">
            <div className="absolute top-0 left-0 w-full h-24 bg-emerald-500 transition-all duration-500" />

            <div className="relative px-8 pt-12 pb-8 flex flex-col items-center text-center">
              <button
                onClick={() => setShowOperatorDetail(null)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-xl transition-all backdrop-blur-sm"
              >
                <X size={20} />
              </button>

              <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-2xl mb-6 relative">
                <div className="w-full h-full rounded-[1.2rem] bg-gray-900 flex items-center justify-center text-white">
                  <span className="text-3xl font-black">{showOperatorDetail.occupiedOps[0]?.prenom?.charAt(0)}{showOperatorDetail.occupiedOps[0]?.nom?.charAt(0)}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={14} strokeWidth={3} />
                </div>
              </div>

              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                {showOperatorDetail.occupiedOps[0]?.prenom} {showOperatorDetail.occupiedOps[0]?.nom}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-black text-navy-600 bg-navy-50 px-3 py-1 rounded-lg border border-navy-100">
                  {showOperatorDetail.occupiedOps[0]?.matricule || '---'}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-1.5 bg-gray-50 rounded-full">Opérateur Affecté</span>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 mb-8">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Poste</p>
                  <p className="text-sm font-black text-gray-900 uppercase">{showOperatorDetail.nom}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Ligne</p>
                  <p className="text-sm font-black text-gray-900 uppercase">{showOperatorDetail.ligneNom}</p>
                </div>
              </div>

              <button
                onClick={() => setShowOperatorDetail(null)}
                className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-navy-800 transition-all active:scale-[0.98]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Modal (Renforcement) */}
      {selectedPost && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in border border-gray-100">
            <div className="px-10 py-10 flex justify-between items-start bg-rose-50/30">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <ShieldAlert size={18} />
                  </div>
                  <span className="text-xs font-black text-rose-500 uppercase tracking-[0.2em]">Renforcement Critique</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Affectation de Renfort</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-full uppercase">POSTE: {selectedPost.nom}</span>
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full uppercase">LIGNE: {selectedPost.ligneNom}</span>
                </div>
              </div>
              <button onClick={() => setSelectedPost(null)} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-2xl transition-all shadow-sm border border-gray-100">
                <X size={24} />
              </button>
            </div>

            <div className="px-10 py-10">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Renforts Disponibles ({selectedPost.availableBackupsCount})</h3>
                <span className="px-3 py-1 bg-navy-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-navy-500/20">BACKUPS DÉDIÉS</span>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {operators.filter(op => (op.posteId === 'Backup' || op.posteId === '') && !op.absent && op.backupFor?.includes(selectedPost.id)).length > 0 ? (
                  operators.filter(op => (op.posteId === 'Backup' || op.posteId === '') && !op.absent && op.backupFor?.includes(selectedPost.id)).map((op, index) => (
                    <button
                      key={op.id}
                      onClick={() => handleAffectation(op.id, selectedPost.id)}
                      className="w-full group p-5 rounded-3xl bg-gray-50 border border-transparent hover:bg-white hover:border-navy-500/20 hover:shadow-2xl hover:shadow-navy-500/10 transition-all duration-300 flex items-center justify-between animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gray-900 text-white group-hover:bg-navy-500 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
                          <span className="text-lg font-black uppercase">{op.prenom?.charAt(0)}{op.nom?.charAt(0)}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-base font-black text-gray-900 leading-none mb-1.5">{op.prenom} {op.nom}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-navy-600 bg-navy-50 px-2 py-0.5 rounded border border-navy-100">{op.matricule || '---'}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase tracking-widest">Disponible</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter tracking-widest">Polyvalent</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-navy-500 group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-sm">
                        <ArrowRight size={20} />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl relative">
                      <ShieldAlert size={40} className="text-rose-400" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xs animate-ping">!</div>
                    </div>
                    <p className="text-xl font-black text-gray-900 mb-2">Pénurie de Main d'Œuvre</p>
                    <p className="text-xs font-bold text-gray-400 text-center px-12 leading-relaxed">Aucun opérateur polyvalent n'est disponible pour ce renforcement critique.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-10 py-8 border-t border-gray-50 flex bg-gray-50/50">
              <button
                onClick={() => setSelectedPost(null)}
                className="w-full py-4 rounded-2xl text-gray-400 font-black text-xs uppercase tracking-[0.3em] hover:text-gray-900 hover:bg-white transition-all"
              >
                Annuler l'Affectation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostStatus;