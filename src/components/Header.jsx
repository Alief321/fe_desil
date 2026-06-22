import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Table as TableIcon, MapPin, Menu, X, LogOut, User, User2, UserSearch } from 'lucide-react';

function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

const Header = ({ view, setView, sidebarOpen, toggleSidebar, onLogout, showViewToggle = true, showSidebarToggle = true }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <header className="bg-white border-b px-6 py-3 flex justify-between items-center z-[1000] shadow-sm">
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            {sidebarOpen ? <X size={16} className="text-slate-600" /> : <Menu size={16} className="text-slate-600" />}
          </button>
        )}
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <MapPin size={20} />
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">
          VIVA<span className="text-blue-600">DTSEN</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 relative" ref={menuRef}>
        {showViewToggle && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setView('table')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              <TableIcon size={16} /> Tabel
            </button>
            <button onClick={() => setView('map')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              <Map size={16} /> Peta
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors"
          aria-label="Menu Profil"
        >
          <User size={20} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-3 w-48 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden text-sm">
            <Link to="/profile" className="block px-4 py-3 text-slate-700 hover:bg-slate-100" onClick={() => setMenuOpen(false)}>
              <User2 size={16} className="inline mr-2" /> Profil
            </Link>
            {user?.role === 'admin' && (
              <Link to="/add-user" className="block px-4 py-3 text-slate-700 hover:bg-slate-100" onClick={() => setMenuOpen(false)}>
                <UserSearch size={16} className="inline mr-2" /> Manajemen User
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="w-full text-left px-4 py-3 text-red-700 hover:bg-slate-100"
            >
              <LogOut size={16} className="inline mr-2" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
