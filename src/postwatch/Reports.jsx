import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, Download, TrendingUp, Calendar, AlertTriangle, Users,
    FileSpreadsheet, PieChart as PieChartIcon, Activity, CheckCircle2, ShieldAlert
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const Reports = ({ operators, account }) => {
    const [history, setHistory] = useState([]);
    const [lignes, setLignes] = useState([]);
    const [postes, setPostes] = useState([]);

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

        const historyCollection = collection(db, 'historique');
        const q = query(historyCollection, orderBy('date', 'desc'), limit(500));
        const unsubscribeHistory = onSnapshot(q, (snapshot) => {
            const historyList = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return { 
                        id: doc.id, 
                        ...data,
                        date: data.date?.toDate() || new Date()
                    };
                })
                .filter(item => item.accountId === account.id);
            setHistory(historyList);
        });

        return () => {
            unsubscribeLines();
            unsubscribePosts();
            unsubscribeHistory();
        };
    }, [account]);

    // Data Processing for KPIs and Charts
    const currentDate = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const stats = useMemo(() => {
        const totalOps = operators.length;
        const presents = operators.filter(o => !o.absent).length;
        const polyvalents = operators.filter(o => o.polyvalence).length;
        
        const coverageRate = totalOps > 0 ? Math.round((presents / totalOps) * 100) : 0;
        const polyvalenceRate = totalOps > 0 ? Math.round((polyvalents / totalOps) * 100) : 0;

        return {
            totalOps,
            presents,
            absents: totalOps - presents,
            polyvalents,
            coverageRate,
            polyvalenceRate
        };
    }, [operators]);

    // Bar Chart Data: Operators per Line
    const operatorsPerLineData = useMemo(() => {
        const counts = {};
        operators.forEach(op => {
            if (op.ligneId) {
                counts[op.ligneId] = (counts[op.ligneId] || 0) + 1;
            }
        });
        
        return lignes.map(ligne => ({
            name: ligne.nom,
            count: counts[ligne.id] || 0,
            fill: '#2563EB' // blue-600
        })).filter(data => data.count > 0).sort((a, b) => b.count - a.count);
    }, [operators, lignes]);

    // Pie Chart Data: Polyvalence
    const polyvalenceData = useMemo(() => {
        return [
            { name: 'Polyvalents', value: stats.polyvalents, fill: '#10B981' }, // emerald-500
            { name: 'Standards', value: stats.totalOps - stats.polyvalents, fill: '#F59E0B' } // amber-500
        ];
    }, [stats]);

    const handleExportFullCSV = () => {
        if (operators.length === 0) return;

        const headers = ["Matricule", "Nom", "Prénom", "Ligne", "Poste", "Polyvalence", "Statut"];
        const rows = operators.map(op => {
            const line = lignes.find(l => l.id === op.ligneId)?.nom || 'N/A';
            const post = postes.find(p => p.id === op.posteId)?.nom || op.posteId || 'N/A';
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

    const handleExportHistoryCSV = () => {
        if (history.length === 0) return;

        const headers = ["Date", "Heure", "Type", "Description", "Utilisateur"];
        const rows = history.map(item => {
            return [
                item.date.toLocaleDateString('fr-FR'),
                item.date.toLocaleTimeString('fr-FR'),
                item.type,
                `"${item.description.replace(/"/g, '""')}"`, // Escape quotes for CSV
                item.utilisateur || 'Système'
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `historique_complet_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
                    <p className="text-sm font-black text-gray-900 mb-1">{label || payload[0].name}</p>
                    <p className="text-xs font-bold" style={{ color: payload[0].fill || '#1E3A5F' }}>
                        {payload[0].value} {payload[0].name === 'Polyvalents' || payload[0].name === 'Standards' ? 'opérateurs' : ''}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 pb-10 max-w-[1600px] mx-auto animate-fade-in font-sans">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 stagger-item">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Rapports <span className="text-blue-600">Globaux</span>
                    </h1>
                    <p className="text-sm font-bold text-gray-400">
                        Aperçu statistique et extraction des données au <span className="text-gray-900">{currentDate}</span>
                    </p>
                </div>

            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-item animate-delay-200">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider">Effectif</span>
                    </div>
                    <div>
                        <h4 className="text-4xl font-black text-gray-900 tracking-tight">{stats.totalOps}</h4>
                        <p className="text-sm font-bold text-gray-400 mt-1">Opérateurs enregistrés</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">Couverture</span>
                    </div>
                    <div>
                        <div className="flex items-end gap-2">
                            <h4 className="text-4xl font-black text-gray-900 tracking-tight">{stats.coverageRate}%</h4>
                            <span className="text-sm font-bold text-gray-400 mb-1">({stats.presents}/{stats.totalOps})</span>
                        </div>
                        <p className="text-sm font-bold text-gray-400 mt-1">Taux de présence globale</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider">Compétence</span>
                    </div>
                    <div>
                        <div className="flex items-end gap-2">
                            <h4 className="text-4xl font-black text-gray-900 tracking-tight">{stats.polyvalenceRate}%</h4>
                            <span className="text-sm font-bold text-gray-400 mb-1">({stats.polyvalents}/{stats.totalOps})</span>
                        </div>
                        <p className="text-sm font-bold text-gray-400 mt-1">Taux de polyvalence</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-premium flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full translate-x-12 -translate-y-12 opacity-50" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ShieldAlert size={24} className={stats.absents > 0 ? "animate-soft-pulse" : ""} />
                        </div>
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-wider">Absences</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-end gap-2">
                            <h4 className="text-4xl font-black text-rose-600 tracking-tight">{stats.absents}</h4>
                        </div>
                        <p className="text-sm font-bold text-rose-400 mt-1">Opérateurs absents aujourd'hui</p>
                    </div>
                </div>
            </div>



        </div>
    );
};

export default Reports;
