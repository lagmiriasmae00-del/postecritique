import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, CalendarX, Activity, LogOut, LayoutDashboard, History, Settings } from 'lucide-react';

const Sidebar = ({ account }) => {
  const navItems = [
    { name: 'Dashboard', path: '/status', icon: <LayoutDashboard size={20} /> },
    { name: 'Segments', path: '/absences', icon: <Activity size={20} /> },
    { name: 'Opérateurs', path: '/operators', icon: <Users size={20} /> },
    { name: 'Historique', path: '/history', icon: <History size={20} /> },
    { name: 'Statistiques', path: '/reports', icon: <Activity size={20} /> },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-navy-900 text-white z-50 flex flex-col shadow-2xl overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0F2040 0%, #1E3A5F 100%)' }}>

      {/* Logo Area */}
      <div className="p-8 pb-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
          <img src="/logo_opex-removebg-preview%20(1)%20(4)opex.png" alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">PosteWatch</h1>
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-60">{account?.name || 'Operations Suite'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300
              ${isActive
                ? 'bg-white text-navy-900 shadow-xl translate-x-1'
                : 'text-blue-100/60 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>


    </aside>
  );
};

export default Sidebar;
