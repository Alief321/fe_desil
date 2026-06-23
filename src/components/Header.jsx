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
    <header className="bg-white border-b px-3 sm:px-6 py-3 flex justify-between items-center shadow-sm z-[1000]">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-3">
        {showSidebarToggle && (
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}

        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <MapPin size={18} />
        </div>

        <h1 className="hidden sm:block text-xl font-black text-slate-800 uppercase tracking-tight">
          VIVA<span className="text-blue-600">DTSEN</span>
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 relative" ref={menuRef}>
        {showViewToggle && (
          <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setView('table')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold ${view === 'table' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>
              <TableIcon size={16} /> Tabel
            </button>
            <button onClick={() => setView('map')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold ${view === 'map' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>
              <Map size={16} /> Peta
            </button>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 text-white"
        >
          <User size={18} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-3 w-48 rounded-xl border bg-white shadow-lg overflow-hidden text-sm">
            <Link to="/profile" className="block px-4 py-3 hover:bg-slate-100">
              <User2 size={14} className="inline mr-2" /> Profil
            </Link>

            {user?.role === 'admin' && (
              <Link to="/add-user" className="block px-4 py-3 hover:bg-slate-100">
                <UserSearch size={14} className="inline mr-2" /> Manajemen User
              </Link>
            )}

            <button onClick={onLogout} className="w-full text-left px-4 py-3 text-red-600 hover:bg-slate-100">
              <LogOut size={14} className="inline mr-2" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
