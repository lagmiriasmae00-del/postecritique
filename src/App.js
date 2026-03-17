import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './postwatch/Sidebar';
import TopBar from './postwatch/TopBar';
import AbsenceDashboard from './postwatch/AbscenceDashboard';
import PostStatus from './postwatch/poststatus';
import OperatorList from './postwatch/OperatorList';
import Reports from './postwatch/Reports';
import AttendanceHistory from './postwatch/AttendanceHistory';
import Configuration from './postwatch/Configuration';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (email && password) {
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (err) {
        console.error("Login error:", err);
        setError("Identifiant ou mot de passe incorrect");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-10 flex flex-col items-center">

        {/* Header with Logos */}
        <div className="w-full flex justify-between items-center mb-12">
          <img
            src="/logo_opex-removebg-preview%20(1)%20(4)opex.png"
            alt="OPEX Logo"
            className="h-10 object-contain"
          />
          <img
            src="/image.png"
            alt="LEONI Logo"
            className="h-10 object-contain"
          />
        </div>

        {/* Login Title Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Connexion</h2>
          <p className="text-sm text-gray-400 font-medium mt-2">Entrez vos identifiants pour accéder à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Username/Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Nom d'utilisateur</label>
            <div className="relative group transition-all">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors">
                <UserIcon size={20} />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pdb, carousel ou leoni"
                className="w-full bg-white border border-gray-100 rounded-xl py-4 pl-12 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 ml-1">Mot de passe</label>
            <div className="relative group transition-all">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                className="w-full bg-white border border-gray-100 rounded-xl py-4 pl-12 pr-12 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="w-full mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-shake">
              <AlertCircle size={20} className="text-rose-500" />
              <p className="text-xs font-bold text-rose-600">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-[#1a1a1a] text-white font-bold text-sm tracking-wide hover:bg-black transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Chargement..." : "Se connecter"}
            </button>
          </div>
        </form>


      </div>
    </div>
  );
};



const App = () => {
  const [userAccount, setUserAccount] = useState(null);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Mapping email to account metadata
        const accounts = {
          'pdb': { id: 'pdb_dg', name: 'PDB (DG)' },
          'lowdash': { id: 'lowdash', name: 'SEGMENT' }
        };

        // Match based on email prefix or custom mapping
        const emailKey = user.email.split('@')[0].toLowerCase();
        const account = accounts[emailKey] || { id: 'pdb_dg', name: 'PDB (DG)' };

        setUserAccount(account);
      } else {
        setUserAccount(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userAccount) return;

    const operatorsCollection = collection(db, 'operateurs');
    const unsubscribe = onSnapshot(operatorsCollection, (snapshot) => {
      const opsList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(op => op.accountId === userAccount.id);
      setOperators(opsList);
    });
    return () => unsubscribe();
  }, [userAccount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userAccount) {
    return <LoginPage />;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Router>
      <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900 selection:bg-purple-200 selection:text-purple-900">
        <Sidebar account={userAccount} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col ml-[280px] min-w-0 transition-all duration-300">
          <TopBar onLogout={handleLogout} account={userAccount} />
          <main className="flex-1 p-8 lg:p-10 max-w-[1600px] w-full mx-auto relative overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/status" replace />} />
              <Route path="/operators" element={<OperatorList operators={operators} account={userAccount} />} />
              <Route path="/absences" element={<AbsenceDashboard operators={operators} account={userAccount} />} />
              <Route path="/status" element={<PostStatus operators={operators} account={userAccount} />} />
              <Route path="/reports" element={<Reports operators={operators} account={userAccount} />} />
              <Route path="/history" element={<AttendanceHistory operators={operators} account={userAccount} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
