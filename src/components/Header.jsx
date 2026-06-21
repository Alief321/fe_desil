import React from 'react';
import { Map, Table as TableIcon, MapPin, Menu, X } from 'lucide-react';

const Header = ({ view, setView, sidebarOpen, toggleSidebar }) => {
  return (
    <header className="bg-white border-b px-6 py-3 flex justify-between items-center z-[1000] shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          {sidebarOpen ? <X size={16} className="text-slate-600" /> : <Menu size={16} className="text-slate-600" />}
        </button>
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <MapPin size={20} />
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">
          Desil<span className="text-blue-600">Master</span>
        </h1>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button onClick={() => setView('table')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
          <TableIcon size={16} /> Tabel
        </button>
        <button onClick={() => setView('map')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
          <Map size={16} /> Peta
        </button>
      </div>
    </header>
  );
};

export default Header;
