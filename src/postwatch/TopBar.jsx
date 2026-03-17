import React from 'react';

const TopBar = ({ account }) => {
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

        <div className="flex items-center gap-3">
        </div>
      </div>
    </header>
  );
};

export default TopBar;
