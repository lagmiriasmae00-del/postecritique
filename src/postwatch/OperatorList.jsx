import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Users, Briefcase, Edit2 } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const OperatorList = ({ operators, account }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newOperator, setNewOperator] = useState({ nom: '', prenom: '', matricule: '', posteId: '', polyvalence: false, absent: false, ligneId: '', backupFor: [] });
    const [editingOperator, setEditingOperator] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
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

    const filteredOperators = operators.filter(op =>
        (op.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.matricule || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (postes.find(p => p.id === op.posteId)?.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddOperator = async (e) => {
        e.preventDefault();
        if (newOperator.nom && newOperator.prenom && newOperator.posteId) {
            try {
                // Check if post is already occupied (except for Backup)
                const isPostOccupied = operators.some(op =>
                    op.posteId === newOperator.posteId &&
                    op.posteId !== 'Backup' &&
                    op.id !== editingOperator?.id
                );

                if (isPostOccupied) {
                    const postName = postes.find(p => p.id === newOperator.posteId)?.nom || 'ce poste';
                    alert(`Erreur: Le poste "${postName}" est déjà occupé par un autre opérateur.`);
                    return;
                }

                // Find selected post to get its ligneId if not manually set
                const selectedPostData = postes.find(p => p.id === newOperator.posteId);
                const finalLigneId = newOperator.ligneId || selectedPostData?.ligneId || '';

                if (editingOperator) {
                    await updateDoc(doc(db, 'operateurs', editingOperator.id), {
                        nom: newOperator.nom,
                        prenom: newOperator.prenom,
                        matricule: newOperator.matricule,
                        posteId: newOperator.posteId,
                        ligneId: finalLigneId,
                        polyvalence: newOperator.polyvalence,
                    });
                } else {
                    await addDoc(collection(db, 'operateurs'), { 
                        nom: newOperator.nom,
                        prenom: newOperator.prenom,
                        matricule: newOperator.matricule,
                        posteId: newOperator.posteId,
                        ligneId: finalLigneId,
                        polyvalence: newOperator.polyvalence,
                        absent: newOperator.absent,
                        critique: true,
                        backupFor: newOperator.backupFor,
                        accountId: account.id
                    });
                }

                // Log to history
                await addDoc(collection(db, 'historique'), {
                    date: new Date(),
                    type: editingOperator ? 'MODIFICATION' : 'CREATION',
                    description: `${editingOperator ? 'Modification' : 'Création'} de l'opérateur ${newOperator.prenom} ${newOperator.nom} (Matricule: ${newOperator.matricule}) au ${selectedPostData?.nom || 'Poste Inconnu'} (${lignes.find(l => l.id === finalLigneId)?.nom || 'Ligne Inconnue'})`,
                    operatorId: editingOperator?.id || '', 
                    posteId: newOperator.posteId,
                    ligneId: finalLigneId,
                    utilisateur: 'Admin',
                    accountId: account.id
                });

                setIsModalOpen(false);
                setEditingOperator(null);
                setNewOperator({ nom: '', prenom: '', matricule: '', posteId: '', polyvalence: false, absent: false, ligneId: '', backupFor: [] });
            } catch (error) {
                console.error("Error adding document: ", error);
            }
        }
    };

    const handleEdit = (op) => {
        setEditingOperator(op);
        setNewOperator({
            nom: op.nom,
            prenom: op.prenom,
            matricule: op.matricule,
            posteId: op.posteId,
            ligneId: op.ligneId,
            polyvalence: op.polyvalence,
            absent: op.absent,
            backupFor: op.backupFor || []
        });
        setIsModalOpen(true);
    };

    const confirmDelete = async (id) => {
        try { await deleteDoc(doc(db, 'operateurs', id)); } catch (e) { console.error(e); }
        setIsDeleting(null);
    };

    const getPosteBadgeColor = (posteId) => {
        const colors = [
            { bg: '#EEF4FF', text: '#1E3A5F', border: '#AECCFF' },   // Navy
            { bg: '#ECFDF5', text: '#10B981', border: '#D1FAE5' },   // Emerald
            { bg: '#FFF7ED', text: '#F97316', border: '#FED7AA' },   // Orange
        ];
        let hash = 0;
        if (posteId) {
            for (let i = 0; i < posteId.length; i++) hash = posteId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const stats = [
        { title: 'Total Opérateurs', value: operators.length, bg: '#EEF4FF', color: '#1E3A5F', icon: <Users size={20} /> },
        { title: 'Total Postes', value: new Set(operators.map(o => o.posteId)).size, bg: '#FFF7ED', color: '#F97316', icon: <Briefcase size={20} /> },
    ];

    const polyvalentCount = operators.filter(op => op.polyvalence).length;
    const nonPolyvalentCount = operators.filter(op => !op.polyvalence).length;

    // Chart Data Preparation
    const pieData = [
        { name: 'Polyvalents', value: polyvalentCount, color: '#1E3A5F' },
        { name: 'Non Polyvalents', value: nonPolyvalentCount, color: '#F97316' },
    ];

    // Bar Chart data (Operators per post)
    const postCounts = operators.reduce((acc, op) => {
        if (op.posteId) {
            acc[op.posteId] = (acc[op.posteId] || 0) + 1;
        }
        return acc;
    }, {});
    const barColors = ['#1E3A5F', '#F97316', '#10B981', '#FB923C'];
    const barData = Object.keys(postCounts).map((posteId, i) => {
        const post = postes.find(p => p.id === posteId);
        return {
            name: post?.nom || 'Inconnu',
            count: postCounts[posteId],
            fill: barColors[i % barColors.length]
        };
    });

    return (
        <div className="space-y-6 pb-10 w-full animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 stagger-item">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestion des Opérateurs</h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Gérez la liste complète et la polyvalence de vos équipes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 stagger-item animate-delay-${(i + 1) * 100}`}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: stat.bg, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-tight">{stat.value}</p>
                            <p className="text-xs font-semibold text-gray-400">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>


            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden stagger-item animate-delay-500">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="modern-search-container sm:w-[400px]">
                        <input type="text" placeholder="Rechercher un opérateur, poste..." className="modern-search-input"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <div className="modern-search-icon-box">
                            <Search size={18} />
                        </div>
                    </div>
                    <button onClick={() => {
                        setEditingOperator(null);
                        setNewOperator({ nom: '', prenom: '', matricule: '', posteId: '', polyvalence: false, absent: false, ligneId: '', backupFor: [] });
                        setIsModalOpen(true);
                    }} className="bg-accent-orange hover:bg-accent-orangeHover text-white flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgba(249,115,22,0.35)] transition-all active:scale-95">
                        <Plus size={16} /> Ajouter un Opérateur
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest">Matricule</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest">Nom</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest">Prénom</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-center">Ligne</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-center">Poste</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-center">Polyvalence</th>
                                <th className="px-6 py-4 text-[10px] font-black text-navy-500 uppercase tracking-widest text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOperators.length > 0 ? (
                                filteredOperators.map((op) => {
                                    const post = postes.find(p => p.id === op.posteId);
                                    const badge = getPosteBadgeColor(op.posteId);
                                    return (
                                        <tr key={op.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                                            <td className="px-6 py-4"><span className="text-xs font-black text-navy-600 bg-navy-50 px-2 py-1 rounded-lg border border-navy-100">{op.matricule || '---'}</span></td>
                                            <td className="px-6 py-4"><span className="text-sm font-bold text-gray-900">{op.nom}</span></td>
                                            <td className="px-6 py-4"><span className="text-sm font-medium text-gray-500">{op.prenom}</span></td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {lignes.find(l => l.id === op.ligneId)?.nom || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide"
                                                    style={{ backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                                                    {post?.nom || 'Inconnu'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    {op.polyvalence ? (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                            Oui
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-rose-50 text-rose-600 border border-rose-200">
                                                            Non
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-10">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button onClick={() => handleEdit(op)} className="p-2 text-gray-300 hover:text-navy-500 hover:bg-navy-50/50 rounded-xl transition-all duration-300">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {isDeleting === op.id ? (
                                                        <div className="flex bg-rose-50 p-1.5 rounded-xl border border-rose-100 items-center gap-2 animate-scale-in">
                                                            <span className="text-[10px] font-black uppercase text-rose-400 px-2">Supprimer?</span>
                                                            <button onClick={() => confirmDelete(op.id)} className="text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95">Oui</button>
                                                            <button onClick={() => setIsDeleting(null)} className="text-[10px] font-bold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all">Non</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setIsDeleting(op.id)} className="group p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl transition-all duration-300">
                                                            <Trash2 size={16} className="transition-transform group-hover:scale-110" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-sm font-bold text-gray-400">
                                        Aucun opérateur trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-blue-950/30 backdrop-blur-md animate-fade-in" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-[2rem] w-full max-w-lg relative animate-scale-in">
                        <div className="p-8">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">{editingOperator ? 'Modifier' : 'Nouvel'} Opérateur</h2>
                            <form onSubmit={handleAddOperator} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input required type="text" className="saas-input" placeholder="Matricule" value={newOperator.matricule} onChange={(e) => setNewOperator({ ...newOperator, matricule: e.target.value })} />
                                    <input required type="text" className="saas-input" placeholder="Nom" value={newOperator.nom} onChange={(e) => setNewOperator({ ...newOperator, nom: e.target.value })} />
                                </div>
                                <input required type="text" className="saas-input" placeholder="Prénom" value={newOperator.prenom} onChange={(e) => setNewOperator({ ...newOperator, prenom: e.target.value })} />
                                <select required className="saas-input w-full" value={newOperator.posteId}
                                    onChange={(e) => {
                                        const postId = e.target.value;
                                        const selectedPost = postes.find(p => p.id === postId);
                                        setNewOperator({
                                            ...newOperator,
                                            posteId: postId,
                                            ligneId: selectedPost?.ligneId || ''
                                        });
                                    }}>
                                    <option value="">Sélectionner un Poste</option>
                                    {postes.map(p => (
                                        <option key={p.id} value={p.id}>{p.nom} ({lignes.find(l => l.id === p.ligneId)?.nom || 'N/A'})</option>
                                    ))}
                                </select>
                                <select required className="saas-input w-full" value={newOperator.ligneId}
                                    onChange={(e) => setNewOperator({ ...newOperator, ligneId: e.target.value })}>
                                    <option value="">Sélectionner une Ligne</option>
                                    {lignes.map(ligne => (
                                        <option key={ligne.id} value={ligne.id}>{ligne.nom}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-3 pt-2">
                                    <input type="checkbox" id="poly" className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500" checked={newOperator.polyvalence} onChange={(e) => setNewOperator({ ...newOperator, polyvalence: e.target.checked })} />
                                    <label htmlFor="poly" className="text-sm font-bold text-gray-700">Polyvalent</label>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingOperator(null);
                                    }} className="saas-btn-secondary flex-1">Annuler</button>
                                    <button type="submit" className="saas-btn-primary flex-1 justify-center">{editingOperator ? 'Enregistrer' : 'Créer'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatorList;
