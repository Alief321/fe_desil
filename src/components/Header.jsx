import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Table as TableIcon, MapPin, Menu, X, LogOut, User, User2, UserSearch } from 'lucide-react';

function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const Header = ({ view, setView, sidebarOpen, toggleSidebar, onLogout, showViewToggle = true, showSidebarToggle = true }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <header className="bg-white border-b px-3 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center shadow-sm z-[1000]">
      {/* Left */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {showSidebarToggle && (
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}

        <div className="bg-blue-600 p-2 rounded-lg text-white hidden xs:block">
          <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
        </div>

        <a href="/dashboard">
          <h1 className="text-base sm:text-xl font-black text-slate-800 uppercase tracking-tight">
            VIVA<span className="text-blue-600">DTSEN</span>
          </h1>
        </a>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 relative" ref={menuRef}>
        {showViewToggle && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setView('table')}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-bold transition-all ${view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <TableIcon size={16} />
              <span className="hidden md:inline">Tabel</span>
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-bold transition-all ${view === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Map size={16} />
              <span className="hidden md:inline">Peta</span>
            </button>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <User size={18} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border bg-white shadow-xl overflow-hidden text-sm z-[1010]">
            <div className="px-4 py-2 bg-slate-50 border-b text-xs text-slate-500 font-medium truncate">
              {user?.username || 'User'} ({user?.role})
            </div>
            <Link to="/profile" className="block px-4 py-3 hover:bg-slate-50 text-slate-700 transition-colors">
              <User2 size={14} className="inline mr-2" /> Profil
            </Link>

            {user?.role === 'admin' && (
              <Link to="/user" className="block px-4 py-3 hover:bg-slate-50 text-slate-700 transition-colors">
                <UserSearch size={14} className="inline mr-2" /> Manajemen User
              </Link>
            )}

            <button onClick={onLogout} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 border-t border-slate-100 transition-colors">
              <LogOut size={14} className="inline mr-2" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
