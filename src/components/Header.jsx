import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Table as TableIcon, MapPin, Menu, X, LogOut, User, User2, UserSearch } from 'lucide-react';
import { getStoredUser } from '../services/getStoredUsers';

const Header = ({ view, setView, sidebarOpen, toggleSidebar, onLogout, showViewToggle = true, showSidebarToggle = true }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null); // ✅ BUKAN getStoredUser()
  const menuRef = useRef(null);

  // ✅ Ambil user secara async
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const u = await getStoredUser();
      if (mounted) setUser(u);
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  // klik di luar menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <header className="bg-white border-b px-3 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center shadow-sm z-[1000]">
      {/* LEFT */}
      <div className="flex items-center gap-2">
        {showSidebarToggle && (
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}

        <div className="bg-blue-600 p-2 rounded-lg text-white hidden xs:block">
          <MapPin size={16} />
        </div>

        <Link to="/dashboard">
          <h1 className="text-base sm:text-xl font-black text-slate-800 uppercase">
            VIVA<span className="text-blue-600">DTSEN</span>
          </h1>
        </Link>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 relative" ref={menuRef}>
        {showViewToggle && (
          <div className="flex bg-slate-100 p-1 rounded-xl border">
            <button onClick={() => setView('table')} className={`px-3 py-1.5 rounded-lg ${view === 'table' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>
              <TableIcon size={16} />
            </button>
            <button onClick={() => setView('map')} className={`px-3 py-1.5 rounded-lg ${view === 'map' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>
              <Map size={16} />
            </button>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-600 text-white"
        >
          <User size={18} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border bg-white shadow-xl text-sm z-[1010]">
            <div className="px-4 py-2 bg-slate-50 border-b text-xs truncate">{user ? `${user.name} (${user.role})` : 'Memuat...'}</div>

            <Link to="/profile" className="block px-4 py-3 hover:bg-slate-50">
              <User2 size={14} className="inline mr-2" /> Profil
            </Link>

            {user?.role === 'admin' && (
              <Link to="/user" className="block px-4 py-3 hover:bg-slate-50">
                <UserSearch size={14} className="inline mr-2" /> Manajemen User
              </Link>
            )}

            <button onClick={onLogout} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 border-t">
              <LogOut size={14} className="inline mr-2" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
