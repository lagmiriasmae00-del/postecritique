import React, { useState, useEffect } from 'react';
import {
    FileText, Download, TrendingUp, Calendar, AlertTriangle, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const Reports = ({ operators, account }) => {
    const [history, setHistory] = useState([]);
    const [lignes, setLignes] = useState([]);

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

    useEffect(() => {
        if (!account) return;
        try {
            const historyCollection = collection(db, 'historique');
            const q = query(historyCollection, orderBy('date', 'desc'), limit(100)); // Increased limit to filter
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const historyList = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return { 
                            id: doc.id, 
                            ...data,
                            date: data.date?.toDate() || new Date()
                        };
                    })
                    .filter(item => item.accountId === account.id)
                    .slice(0, 10); // Keep top 10 for display
                setHistory(historyList);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    }, [account]);

    const totalPolyvalent = operators?.filter(o => o.polyvalence).length || 0;

    const reportCards = [
        {
            title: 'Polyvalence Mensuelle',
            description: 'Résumé complet des compétences acquises par opérateur ce mois-ci.',
            icon: <TrendingUp size={24} />,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            border: 'border-blue-200'
        },
        {
            title: 'Bilan des Absences',
            description: 'Historique et taux de présentéisme par poste et par équipe.',
            icon: <Calendar size={24} />,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100',
            border: 'border-emerald-200'
        },
        {
            title: 'Alertes Critiques',
            description: 'Registre des manques de couverture sur les postes critiques.',
            icon: <AlertTriangle size={24} />,
            color: 'text-rose-600',
            bg: 'bg-rose-100',
            border: 'border-rose-200'
        }
    ];

    const UsersIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    );
    const ShieldIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
    );
    const AlertIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    );

    const handleExportFullCSV = () => {
        if (operators.length === 0) return;

        const headers = ["Matricule", "Nom", "Prénom", "Ligne", "Poste", "Polyvalence", "Statut"];
        const rows = operators.map(op => {
            const line = lignes.find(l => l.id === op.ligneId)?.nom || 'N/A';
            const post = op.posteId || 'N/A';
            return [
                op.matricule || 'N/A',
                op.nom,
                op.prenom,
                line,
                post,
                op.polyvalence ? "Oui" : "Non",
                op.absent ? "Absent" : "Présent"
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rapport_global_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-10 w-full animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 stagger-item">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Rapports & Exports</h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Générez et consultez les statistiques consolidées de vos équipes.</p>
                </div>
                <button 
                    onClick={handleExportFullCSV}
                    className="bg-white border-2 border-blue-100 hover:border-blue-300 text-blue-700 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 group"
                >
                    <FileSpreadsheet size={16} className="group-hover:text-blue-600 transition-colors" /> Exporter tout (CSV)
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-premium p-20 flex flex-col items-center justify-center text-center stagger-item animate-delay-200">
                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 text-blue-300">
                    <TrendingUp size={48} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Statistiques en cours...</h2>
                <p className="text-gray-400 font-medium max-w-sm">
                    Cette page est en cours de restructuration pour vous offrir des analyses plus détaillées.
                </p>
            </div>
        </div>
    );
};

export default Reports;
