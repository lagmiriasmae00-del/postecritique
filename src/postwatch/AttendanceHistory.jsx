import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Download, History, User, MapPin, Tag, Trash2, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

const AttendanceHistory = ({ operators, account }) => {
    const [history, setHistory] = useState([]);
    const [lignes, setLignes] = useState([]);
    const [postes, setPostes] = useState([]);
    const [selectedDate, setSelectedDate] = useState(''); // Empty string means "All"
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(null);
    const [isClearingAll, setIsClearingAll] = useState(false);

    useEffect(() => {
        if (!account) return;
        const linesCollection = collection(db, 'lignes');
        const unsubscribeLines = onSnapshot(linesCollection, (snapshot) => {
            setLignes(snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(l => l.accountId === account.id)
            );
        });

        const postsCollection = collection(db, 'postes');
        const unsubscribePosts = onSnapshot(postsCollection, (snapshot) => {
            setPostes(snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(p => p.accountId === account.id)
            );
        });

        return () => {
            unsubscribeLines();
            unsubscribePosts();
        };
    }, [account]);

    useEffect(() => {
        if (!account) return;
        const historyCollection = collection(db, 'historique');
        
        let q;
        if (selectedDate) {
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);
            q = query(
                historyCollection, 
                where('date', '>=', startOfDay),
                where('date', '<=', endOfDay),
                orderBy('date', 'desc')
            );
        } else {
            q = query(historyCollection, orderBy('date', 'desc'));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyList = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    date: data.date?.toDate() || new Date()
                };
            }).filter(item => 
                ['PRESENCE', 'ABSENCE', 'AFFECTATION'].includes(item.type) &&
                item.accountId === account.id
            );
            
            setHistory(historyList);
        });

        return () => unsubscribe();
    }, [selectedDate, account]);

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'historique', id));
            setIsDeleting(null);
        } catch (error) {
            console.error("Error deleting history entry:", error);
        }
    };

    const handleClearAll = async () => {
        try {
            const batch = writeBatch(db);
            history.forEach((item) => {
                batch.delete(doc(db, 'historique', item.id));
            });
            await batch.commit();
            setIsClearingAll(false);
        } catch (error) {
            console.error("Error clearing history for the day:", error);
        }
    };

    const filteredHistory = history.filter(item => 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.utilisateur?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resolveLineAndPost = (item) => {
        // First try to use direct IDs stored in the log
        const lineId = item.ligneId;
        const postId = item.posteId;

        if (lineId && postId) {
            const line = lignes.find(l => l.id === lineId)?.nom || 'N/A';
            const post = postes.find(p => p.id === postId)?.nom || 'N/A';
            return { line, post };
        }

        // Fallback to description parsing if IDs aren't there (for old logs)
        const operator = operators.find(op => item.description.includes(`${op.prenom} ${op.nom}`));
        if (!operator) return { line: 'N/A', post: 'N/A' };
        
        const line = lignes.find(l => l.id === operator.ligneId)?.nom || 'N/A';
        const post = postes.find(p => p.id === operator.posteId)?.nom || 'N/A';
        
        return { line, post };
    };

    const handleExportCSV = () => {
        if (filteredHistory.length === 0) return;

        const headers = ["Heure", "Description", "Ligne", "Poste", "Type", "Par"];
        const rows = filteredHistory.map(item => {
            const { line, post } = resolveLineAndPost(item);
            return [
                item.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                item.description,
                line,
                post,
                item.type,
                item.utilisateur || 'Système'
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `historique_${selectedDate || 'complet'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-10 w-full animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 stagger-item">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Historique des Présences</h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Consultez les mouvements et changements d'états passés.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="date" 
                            className="saas-input pl-12 py-3 bg-white border-gray-100 shadow-sm"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        {selectedDate && (
                            <button 
                                onClick={() => setSelectedDate('')}
                                className="absolute -right-2 -top-2 bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-md hover:bg-navy-500 transition-all"
                            >
                                TOUT
                            </button>
                        )}
                    </div>
                    {history.length > 0 && (
                        <button 
                            onClick={() => setIsClearingAll(true)}
                            className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2 text-xs font-bold"
                        >
                            <Trash2 size={18} /> Effacer la journée
                        </button>
                    )}
                    <button 
                        onClick={handleExportCSV}
                        className="bg-white border border-gray-100 p-3 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden stagger-item animate-delay-200">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="modern-search-container sm:w-[400px]">
                        <input 
                            type="text" 
                            placeholder="Rechercher par opérateur ou utilisateur..." 
                            className="modern-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="modern-search-icon-box">
                            <Search size={18} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl">
                        <Filter size={14} />
                        Filtres Actifs: {history.length} entrées
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest">Date & Heure</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-center">Ligne</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-center">Poste</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-center">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-right pr-6">Par</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredHistory.length > 0 ? (
                                filteredHistory.map((item) => {
                                    const { line, post } = resolveLineAndPost(item);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{item.date.toLocaleDateString('fr-FR')}</span>
                                                    <span className="text-sm font-black text-gray-900">
                                                        {item.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{item.description}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{line}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase">
                                                    {post}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                    item.type === 'PRESENCE' 
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                    : item.type === 'ABSENCE'
                                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <span className="text-[11px] font-bold text-gray-400 italic">@{item.utilisateur || 'Système'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-10">
                                                <div className="flex items-center justify-end gap-3">
                                                    {isDeleting === item.id ? (
                                                        <div className="flex bg-rose-50 p-1 rounded-lg border border-rose-100 items-center gap-2 animate-scale-in">
                                                            <button 
                                                                onClick={() => handleDelete(item.id)}
                                                                className="text-[9px] font-bold text-white bg-rose-500 px-2 py-1 rounded-md shadow-sm"
                                                            >
                                                                Confirmer
                                                            </button>
                                                            <button 
                                                                onClick={() => setIsDeleting(null)}
                                                                className="text-[9px] font-bold text-gray-400 hover:text-gray-600 mr-1"
                                                            >
                                                                X
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => setIsDeleting(item.id)}
                                                            className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                                                <History size={32} className="text-gray-200" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">Aucun historique trouvé pour cette date</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Clear All Modal */}
            {isClearingAll && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-md animate-fade-in" onClick={() => setIsClearingAll(false)} />
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md relative animate-scale-in shadow-2xl p-10 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-sm">
                            <AlertTriangle size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Tout effacer ?</h2>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                            Êtes-vous sûr de vouloir supprimer définitivement l'historique complet pour la date du <span className="font-bold text-rose-500 text-sm">{new Date(selectedDate).toLocaleDateString('fr-FR')}</span> ?
                            Cette action est irréversible.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setIsClearingAll(false)}
                                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleClearAll}
                                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all active:scale-95"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceHistory;
