import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, X, Download, ExternalLink } from 'lucide-react';
import { downloadCardPng } from '../services/cardPrintService';

const DetailModal = ({ selectedIndividu, setSelectedIndividu }) => {
  const [fullImage, setFullImage] = useState(null);
  const [updatingEligible, setUpdatingEligible] = useState(false);

  // cache to avoid refetching blobs for same path; cleared on unmount
  const imageBlobUrlCache = useRef(new Map());
  useEffect(() => {
    return () => {
      try {
        imageBlobUrlCache.current.forEach((v) => URL.revokeObjectURL(v));
      } catch (e) {}
      imageBlobUrlCache.current.clear();
    };
  }, []);

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
    Object.entries(row || {}).filter(([value]) => {
      if (value === null || value === undefined || value === '') return false;
      return true;
    });

  const getProxyPhotoUrl = (photoPath) => `${import.meta.env.VITE_API_URL}/photo-proxy?path=${encodeURIComponent(photoPath)}`;

  // Fetch image via axios so axios interceptors add Authorization header,
  // then convert to object URL so it can be used in <img> src.
  const fetchImageBlobUrl = async (photoPath) => {
    try {
      const cache = imageBlobUrlCache.current;
      if (cache.has(photoPath)) return cache.get(photoPath);
      const url = getProxyPhotoUrl(photoPath);
      const res = await axios.get(url, { responseType: 'blob' });
      const obj = URL.createObjectURL(res.data);
      cache.set(photoPath, obj);
      return obj;
    } catch (err) {
      console.error('Gagal load foto', err);
      return null;
    }
  };

  const ImageWithAuth = ({ path, alt, className, onClick }) => {
    const [objUrl, setObjUrl] = useState(null);

    useEffect(() => {
      let mounted = true;
      fetchImageBlobUrl(path).then((u) => {
        if (!mounted) return;
        setObjUrl(u);
      });
      return () => {
        mounted = false;
      };
    }, [path]);

    if (!objUrl)
      return (
        <div className="h-56 w-full bg-slate-100 flex items-center justify-center text-slate-400 ">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    return <img src={objUrl} alt={alt} className={className} onClick={onClick ? () => onClick(objUrl) : undefined} />;
  };

  if (!selectedIndividu) return null;

  return (
    <div className="absolute inset-0 z-1000 flex items-center justify-center bg-slate-900/50 p-4 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detail {selectedIndividu['Nama Lengkap Individu'] ? 'Individu' : 'Keluarga'}</p>
            <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedIndividu['Nama Lengkap Individu'] || selectedIndividu['nama_kepala_keluarga'] || '-'}</h3>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={async () => {
                const id = selectedIndividu.ind_uid || selectedIndividu.id_ui || selectedIndividu.id || selectedIndividu.kk_uid || selectedIndividu.nomor_kk;
                if (!id) return;
                try {
                  setUpdatingEligible(true);
                  await axios.patch(`${import.meta.env.VITE_API_URL}/eligible/${encodeURIComponent(id)}`, { eligible: true });
                  alert('Status eligible berhasil diperbarui.');
                  setSelectedIndividu({ ...selectedIndividu, eligible: true });
                } catch (error) {
                  console.error('Gagal ubah eligible', error);
                  alert('Gagal memperbarui eligible. Silakan coba lagi.');
                } finally {
                  setUpdatingEligible(false);
                }
              }}
              disabled={updatingEligible}
              className="rounded-full bg-blue-600 px-4 py-2 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingEligible ? 'Memperbarui...' : 'Ubah Eligible'}
            </button>
            <button
              type="button"
              onClick={async () => {
                const id = selectedIndividu.ind_uid || selectedIndividu.id_ui || selectedIndividu.id || selectedIndividu.kk_uid || selectedIndividu.nomor_kk;
                const section = selectedIndividu.section || (selectedIndividu['Nama Lengkap Individu'] ? 'individu' : 'keluarga');
                await downloadCardPng(
                  {
                    section,
                    id,
                    name: selectedIndividu['Nama Lengkap Individu'] || selectedIndividu.nama_kepala_keluarga || selectedIndividu.name || '-',
                    nik: selectedIndividu['Nomor KTP/NIK'] || selectedIndividu.nomor_kk || selectedIndividu.nik || '-',
                    desa: selectedIndividu['desa_kelurahan'] || selectedIndividu.desa || selectedIndividu.kelurahan || '-',
                    desil: selectedIndividu.flag || '-',
                  },
                  `kartu-desil-${section}-${id}.png`,
                );
              }}
              className="rounded-full bg-emerald-600 px-4 py-2 text-white text-sm font-semibold hover:bg-emerald-700"
            >
              <Download size={16} className="inline mr-2" /> Cetak Kartu
            </button>
            <button onClick={() => setSelectedIndividu(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-200 shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="grid gap-0 border-b border-slate-200 bg-white sm:grid-cols-3">
              <div className="px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">NIK</p>
                <p className="mt-1 break-words font-mono text-sm text-slate-800">{selectedIndividu['Nomor KTP/NIK'] || selectedIndividu['nomor_kk'] || '-'}</p>
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
                .filter(([key]) => !['Nama Lengkap Individu', 'Nomor KTP/NIK', 'flag', 'nama_kepala_keluarga', 'nomor_kk'].includes(key))
                .map(([key, value]) => {
                  const isImageField = /foto/i.test(key) && typeof value === 'string';

                  if (isImageField) {
                    return (
                      <div key={key} className="p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{formatFieldLabel(key)}</p>
                        <div className="mt-3 overflow-hidden rounded-2xl border bg-slate-50">
                          <ImageWithAuth path={value} alt={formatFieldLabel(key)} className="h-56 w-full object-cover cursor-zoom-in" onClick={(obj) => setFullImage(obj)} />
                        </div>
                      </div>
                    );
                  }

                  if (key === 'lokasi' && typeof value === 'string') {
                    return (
                      // arahkan link ke Google Maps dengan query lokasi
                      <div key={key} className="p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{formatFieldLabel(key)}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm font-bold px-3 py-2 rounded-lg bg-blue-600 text-white inline-block hover:bg-blue-700 transition-colors"
                        >
                          <MapPin size={16} className="inline-block mr-1" />
                          Lihat di Google Maps
                        </a>
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
