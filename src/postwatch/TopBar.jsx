import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronDown, LogOut } from 'lucide-react';

const TopBar = ({ onLogout, account }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40 transition-all">
      {/* Search Bar & Left Logo */}
      <div className="flex items-center gap-8">
        <img 
          src="/logo_opex-removebg-preview%20(1)%20(4)opex.png" 
          alt="OPEX Logo" 
          className="h-10 object-contain" 
        />
      </div>

      {/* Actions & Right Logo */}
      <div className="flex items-center gap-6">
        <img 
          src="/image.png" 
          alt="Leoni Logo" 
          className="h-6 opacity-80 hover:opacity-100 transition-opacity" 
        />
        
        <div className="h-8 w-px bg-gray-100"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-full transition-all"
          >
            <div className="w-9 h-9 bg-navy-600 rounded-full flex items-center justify-center text-white shadow-md">
              <User size={18} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-gray-900">{account?.name || 'Admin OPEX'}</p>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">Connecté</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 animate-slide-down origin-top-right">
              <div className="px-5 py-3 border-b border-gray-50 mb-2 text-center">
                <p className="text-sm font-bold text-gray-900">Mon Profil</p>
              </div>

              <div className="border-t border-gray-50 mt-2 pt-2">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
