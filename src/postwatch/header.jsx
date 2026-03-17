import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, CalendarX, Activity, User, LogOut, ChevronDown, Settings } from 'lucide-react';

const Header = ({ onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: "Opérateurs", path: '/operators', icon: <Users size={18} /> },
    { name: "Absences", path: '/absences', icon: <CalendarX size={18} /> },
    { name: "État des Postes", path: '/status', icon: <Activity size={18} /> },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16"
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/logo_opex-removebg-preview%20(1)%20(4)opex.png"
            alt="OPEX Logo"
            className="h-9"
          />
          <div className="hidden sm:block h-6 w-px bg-gray-200"></div>
          <span className="hidden sm:block text-sm font-semibold text-gray-400 tracking-wide">
            PosteWatch
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 relative
                  ${isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <span className={isActive ? 'text-primary-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-600 rounded-full"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <img
            src="/image.png"
            alt="Leoni Logo"
            className="h-5 opacity-60 hover:opacity-100 transition-opacity"
          />

          <div className="h-6 w-px bg-gray-200"></div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-tight">Admin</p>
                <p className="text-xs text-gray-400 leading-tight">Superviseur</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 animate-slide-down"
                style={{ zIndex: 100 }}
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Mon Compte</p>
                  <p className="text-xs text-gray-400">admin@postwatch.com</p>
                </div>
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-3 transition-colors">
                    <Settings size={15} className="text-gray-400" />
                    Paramètres
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors rounded-b-xl"
                  >
                    <LogOut size={15} />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;