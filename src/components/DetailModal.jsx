import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DetailModal = ({ selectedIndividu, setSelectedIndividu }) => {
  const [fullImage, setFullImage] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setFullImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const formatFieldLabel = (key) =>
    String(key)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const getDetailEntries = (row) =>
    Object.entries(row || {}).filter(([key, value]) => {
      if (value === null || value === undefined || value === '') return false;
      return !['lokasi'].includes(key);
    });

  const getProxyPhotoUrl = (photoPath) => `${import.meta.env.VITE_API_URL}/photo-proxy?path=${encodeURIComponent(photoPath)}`;

  if (!selectedIndividu) return null;

  return (
    <div className="absolute inset-0 z-1000 flex items-center justify-center bg-slate-900/50 p-4 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detail Individu</p>
            <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedIndividu['Nama Lengkap Individu'] || '-'}</h3>
          </div>
          <button onClick={() => setSelectedIndividu(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-200 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="grid gap-0 border-b border-slate-200 bg-white sm:grid-cols-3">
              <div className="px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">NIK</p>
                <p className="mt-1 break-words font-mono text-sm text-slate-800">{selectedIndividu['Nomor KTP/NIK'] || '-'}</p>
              </div>
              <div className="px-5 py-4 sm:border-l sm:border-slate-200">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Desil</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{selectedIndividu.flag || '1'}</p>
              </div>
              <div className="px-5 py-4 sm:border-l sm:border-slate-200">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Desa/Kelurahan</p>
                <p className="mt-1 text-sm text-slate-800">{selectedIndividu['desa_kelurahan'] || '-'}</p>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {getDetailEntries(selectedIndividu)
                .filter(([key]) => !['Nama Lengkap Individu', 'Nomor KTP/NIK', 'flag', 'desa_kelurahan'].includes(key))
                .map(([key, value]) => {
                  const isImageField = /foto/i.test(key) && typeof value === 'string';

                  if (isImageField) {
                    return (
                      <div key={key} className="p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{formatFieldLabel(key)}</p>
                        <div className="mt-3 overflow-hidden rounded-2xl border bg-slate-50">
                          <img src={getProxyPhotoUrl(value)} alt={formatFieldLabel(key)} className="h-56 w-full object-cover cursor-zoom-in" onClick={() => setFullImage(getProxyPhotoUrl(value))} />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="grid gap-3 px-5 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-start">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{formatFieldLabel(key)}</p>
                      </div>
                      <div className="min-w-0 text-sm leading-6 text-slate-800 break-words whitespace-pre-wrap">{String(value)}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
        {fullImage && (
          <div onClick={() => setFullImage(null)} className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <button onClick={() => setFullImage(null)} className="absolute top-6 right-6 z-70 rounded-full p-2 bg-white/20 backdrop-blur-sm text-white">
              <X size={20} />
            </button>
            <img src={fullImage} alt="Foto penuh" className="max-h-[90vh] max-w-full object-contain shadow-lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailModal;
