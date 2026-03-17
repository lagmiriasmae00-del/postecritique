import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Layers, 
  Monitor, 
  Check, 
  X, 
  ChevronRight,
  ShieldAlert,
  Edit2
} from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Configuration = ({ account }) => {
  const [lignes, setLignes] = useState([]);
  const [postes, setPostes] = useState([]);
  const [newLineName, setNewLineName] = useState('');
  const [newPost, setNewPost] = useState({ nom: '', ligneId: '', critique: true });
  const [isAddingLine, setIsAddingLine] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);

  useEffect(() => {
    if (!account) return;
    const unsubLines = onSnapshot(collection(db, 'lignes'), (snapshot) => {
      setLignes(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(l => l.accountId === account.id)
      );
    });
    const unsubPosts = onSnapshot(collection(db, 'postes'), (snapshot) => {
      setPostes(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.accountId === account.id)
      );
    });
    return () => { unsubLines(); unsubPosts(); };
  }, [account]);

  const handleAddLine = async (e) => {
    e.preventDefault();
    if (!newLineName.trim()) return;
    try {
      await addDoc(collection(db, 'lignes'), { 
        nom: newLineName,
        accountId: account.id
      });
      setNewLineName('');
      setIsAddingLine(false);
    } catch (error) { console.error(error); }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPost.nom.trim() || !newPost.ligneId) return;
    try {
      await addDoc(collection(db, 'postes'), { 
        nom: newPost.nom, 
        ligneId: newPost.ligneId,
        critique: newPost.critique,
        accountId: account.id
      });
      setNewPost({ nom: '', ligneId: '', critique: true });
      setIsAddingPost(false);
    } catch (error) { console.error(error); }
  };

  const handleDeleteLine = async (id) => {
    if (window.confirm("Supprimer cette ligne ainsi que tous ses postes ?")) {
      try {
        const linePosts = postes.filter(p => p.ligneId === id);
        for (const post of linePosts) {
          await deleteDoc(doc(db, 'postes', post.id));
        }
        await deleteDoc(doc(db, 'lignes', id));
      } catch (error) { console.error(error); }
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await deleteDoc(doc(db, 'postes', id));
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-fade-in font-sans">
      <div className="space-y-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-navy-500 text-white rounded-lg shadow-lg shadow-navy-500/20">
            <Settings size={20} />
          </div>
          <span className="text-xs font-black text-navy-500 uppercase tracking-[0.2em]">Paramètres Système</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Configuration de la <span className="text-navy-500">Structure</span></h1>
        <p className="text-sm font-bold text-gray-400">Gérez vos lignes de production et leurs postes associés.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lines Management */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-navy-500 text-white flex items-center justify-center shadow-lg">
                <Layers size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Lignes de Production</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{lignes.length} LIGNES ACTIVES</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAddingLine(true)}
              className="p-3 bg-navy-50 hover:bg-navy-500 hover:text-white text-navy-500 rounded-xl transition-all shadow-sm group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="p-6">
            {isAddingLine && (
              <form onSubmit={handleAddLine} className="mb-6 p-6 bg-navy-50 rounded-3xl animate-scale-in border border-navy-100 flex gap-4">
                <input 
                  autoFocus
                  required
                  type="text" 
                  placeholder="Nom de la ligne (ex: Ligne 1)" 
                  className="flex-1 bg-white border-transparent px-6 py-3 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-navy-500 outline-none shadow-sm"
                  value={newLineName}
                  onChange={(e) => setNewLineName(e.target.value)}
                />
                <button type="submit" className="px-6 bg-navy-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-navy-500/20">Valider</button>
                <button type="button" onClick={() => setIsAddingLine(false)} className="p-3 bg-white text-gray-400 rounded-2xl hover:text-rose-500 transition-colors"><X size={20} /></button>
              </form>
            )}

            <div className="space-y-3">
              {lignes.map((ligne) => (
                <div key={ligne.id} className="group p-5 rounded-3xl bg-gray-50/50 border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-xl transition-all duration-300 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-navy-500 shadow-sm font-black text-xs">
                      {ligne.nom.charAt(0)}
                    </div>
                    <span className="text-sm font-black text-gray-900 uppercase">{ligne.nom}</span>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{postes.filter(p => p.ligneId === ligne.id).length} POSTES</span>
                  </div>
                  <button onClick={() => handleDeleteLine(ligne.id)} className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Posts Management */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-orange text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Monitor size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Gestion des Postes</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{postes.length} POSTES ENREGISTRÉS</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAddingPost(true)}
              className="p-3 bg-orange-50 hover:bg-accent-orange hover:text-white text-accent-orange rounded-xl transition-all shadow-sm group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="p-6">
            {isAddingPost && (
              <form onSubmit={handleAddPost} className="mb-6 p-8 bg-orange-50/50 rounded-[2.5rem] animate-scale-in border border-orange-100 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nom du poste</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Poste A" 
                      className="w-full bg-white border-transparent px-6 py-3 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-accent-orange outline-none shadow-sm"
                      value={newPost.nom}
                      onChange={(e) => setNewPost({ ...newPost, nom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Ligne de production</label>
                    <select 
                      required
                      className="w-full bg-white border-transparent px-6 py-3 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-accent-orange outline-none shadow-sm h-[48px]"
                      value={newPost.ligneId}
                      onChange={(e) => setNewPost({ ...newPost, ligneId: e.target.value })}
                    >
                      <option value="">Choisir une ligne</option>
                      {lignes.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group/toggle">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={newPost.critique}
                        onChange={(e) => setNewPost({ ...newPost, critique: e.target.checked })}
                      />
                      <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-rose-500 transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
                    </div>
                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest group-hover/toggle:text-gray-900">Poste Critique</span>
                  </label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsAddingPost(false)} className="px-6 py-3 bg-white text-gray-400 rounded-2xl font-black text-[10px] uppercase hover:text-rose-500 transition-all border border-gray-100 shadow-sm">Annuler</button>
                    <button type="submit" className="px-8 py-3 bg-accent-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">Ajouter</button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {lignes.map(ligne => {
                const lignePosts = postes.filter(p => p.ligneId === ligne.id);
                if (lignePosts.length === 0) return null;
                return (
                  <div key={ligne.id} className="space-y-2">
                    <h4 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] ml-4 pt-2">{ligne.nom}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {lignePosts.map(post => (
                        <div key={post.id} className="group p-4 rounded-2xl bg-gray-50 flex items-center justify-between hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-lg transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl border ${post.critique ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                              <ShieldAlert size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900 uppercase">{post.nom}</p>
                                {post.critique && <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Poste Critique</p>}
                            </div>
                          </div>
                          <button onClick={() => handleDeletePost(post.id)} className="p-2 text-gray-300 hover:text-rose-500 rounded-lg opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Configuration;
