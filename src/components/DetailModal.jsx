import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, X, Download, ExternalLink } from 'lucide-react';
import { downloadCardPng } from '../services/cardPrintService';

const DetailModal = ({ selectedIndividu, setSelectedIndividu }) => {
  const [fullImage, setFullImage] = useState(null);
  const [updatingEligible, setUpdatingEligible] = useState(false);

  // Cache to avoid refetching blobs for the same path
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
        <div className="h-56 w-full bg-slate-100 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    return <img src={objUrl} alt={alt} className={className} onClick={onClick ? () => onClick(objUrl) : undefined} />;
  };

  if (!selectedIndividu) return null;

  // Reusable ID extractor
  const indId = selectedIndividu.ind_uid || selectedIndividu.id_ui || selectedIndividu.id || selectedIndividu.kk_uid || selectedIndividu.nomor_kk;

  const handleUpdateEligible = async () => {
    if (!indId) return;
    try {
      setUpdatingEligible(true);
      await axios.patch(`${import.meta.env.VITE_API_URL}/eligible/${encodeURIComponent(indId)}`, {
        id: indId,
        source: selectedIndividu['Nama Lengkap Individu'] ? 'individu' : 'keluarga',
        isEligible: !selectedIndividu['Status Eligible'],
      });
      alert('Status eligible berhasil diperbarui.');
      setSelectedIndividu({ ...selectedIndividu, 'Status Eligible': !selectedIndividu['Status Eligible'] });
    } catch (error) {
      console.error('Gagal ubah eligible', error);
      alert('Gagal memperbarui eligible. Silakan coba lagi.');
    } finally {
      setUpdatingEligible(false);
    }
  };

  const handleCetakKartu = async () => {
    const section = selectedIndividu.section || (selectedIndividu['Nama Lengkap Individu'] ? 'individu' : 'keluarga');
    await downloadCardPng(
      {
        section,
        id: indId,
        name: selectedIndividu['Nama Lengkap Individu'] || selectedIndividu.nama_kepala_keluarga || selectedIndividu.name || '-',
        nik: selectedIndividu['Nomor KTP/NIK'] || selectedIndividu.nomor_kk || selectedIndividu.nik || '-',
        desa: selectedIndividu['desa_kelurahan'] || selectedIndividu.desa || selectedIndividu.kelurahan || '-',
        desil: selectedIndividu.flag || '-',
      },
      `kartu-desil-${section}-${indId}.png`,
    );
  };

  return (
    // Backdrop menggunakan 'fixed' menghindari bug scroll di mobile
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-slate-900/60 sm:p-6 backdrop-blur-sm">
      {/* Container Utama: Bottom-sheet style di mobile, Modal di desktop */}
      <div className="w-full max-h-[95vh] sm:max-h-[90vh] sm:max-w-4xl bg-white shadow-2xl rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="pr-4">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Detail {selectedIndividu['Nama Lengkap Individu'] ? 'Individu' : 'Keluarga'}</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight line-clamp-2">{selectedIndividu['Nama Lengkap Individu'] || selectedIndividu['nama_kepala_keluarga'] || '-'}</h3>
          </div>
          <button onClick={() => setSelectedIndividu(null)} className="rounded-full p-2.5 text-slate-500 bg-slate-200/50 hover:bg-slate-200 shrink-0 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            {/* Highlight Cards (NIK, Desil, Desa) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b border-slate-200 bg-white">
              <div className="px-4 py-3 sm:px-5 sm:py-4 col-span-2 sm:col-span-1 border-b sm:border-b-0">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{selectedIndividu['Nomor KTP/NIK'] ? 'NIK' : 'No KK'}</p>
                <p className="mt-1 break-words font-mono text-sm text-slate-800">{selectedIndividu['Nomor KTP/NIK'] || selectedIndividu['nomor_kk'] || '-'}</p>
              </div>
              <div className="px-4 py-3 sm:px-5 sm:py-4 border-r sm:border-r-0">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Desil</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{selectedIndividu.flag || '1'}</p>
              </div>
              <div className="px-4 py-3 sm:px-5 sm:py-4">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Desa/Kelurahan</p>
                <p className="mt-1 text-sm text-slate-800 line-clamp-2">{selectedIndividu['desa_kelurahan'] || '-'}</p>
              </div>
            </div>

            {/* List Detail Lainnya */}
            <div className="divide-y divide-slate-100">
              {getDetailEntries(selectedIndividu)
                .filter(([key]) => !['Nama Lengkap Individu', 'Nomor KTP/NIK', 'flag', 'nama_kepala_keluarga', 'nomor_kk'].includes(key))
                .map(([key, value]) => {
                  const isImageField = /foto/i.test(key) && typeof value === 'string';

                  // Format Foto
                  if (isImageField) {
                    return (
                      <div key={key} className="p-4 sm:p-5">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{formatFieldLabel(key)}</p>
                        <div className="mt-2 overflow-hidden rounded-xl border bg-slate-50">
                          <ImageWithAuth path={value} alt={formatFieldLabel(key)} className="h-48 sm:h-56 w-full object-cover cursor-zoom-in active:opacity-80 transition-opacity" onClick={(obj) => setFullImage(obj)} />
                        </div>
                      </div>
                    );
                  }

                  // Format Anggota Keluarga
                  if (key === 'anggota' && Array.isArray(value)) {
                    return (
                      <div key={key} className="p-4 sm:p-5">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Anggota Keluarga</p>
                        <div className="space-y-3">
                          {value.map((item, idx) => (
                            <div key={idx} className="border bg-slate-50/50 p-3 rounded-xl shadow-sm">
                              <p className="font-bold text-sm text-slate-800">{item['Nama Lengkap Individu']}</p>
                              <div className="mt-1 flex flex-col sm:flex-row sm:gap-4">
                                <p className="text-xs text-slate-500">
                                  <span className="font-medium text-slate-400">Status:</span> {item['Status Hubungan dengan Kepala Keluarga']}
                                </p>
                                <p className="text-xs text-slate-500">
                                  <span className="font-medium text-slate-400">NIK:</span> {item['Nomor KTP/NIK']}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // Format Lokasi (Google Maps)
                  if (key === 'lokasi' && typeof value === 'string') {
                    return (
                      <div key={key} className="p-4 sm:p-5">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{formatFieldLabel(key)}</p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center hover:bg-blue-100 transition-colors w-full sm:w-auto justify-center"
                        >
                          <MapPin size={16} className="mr-2" />
                          Buka di Google Maps
                        </a>
                      </div>
                    );
                  }

                  // Format Teks Standar
                  return (
                    <div key={key} className="flex flex-col sm:grid sm:grid-cols-[220px_minmax(0,1fr)] gap-1 sm:gap-3 px-4 py-3 sm:px-5 sm:py-4">
                      <div>
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{formatFieldLabel(key)}</p>
                      </div>
                      <div className="min-w-0 text-sm leading-relaxed text-slate-800 break-words whitespace-pre-wrap">{String(value)}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer / Action Buttons - Sticky di Bawah */}
        <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 border-t bg-white px-4 py-4 sm:px-6">
          <button
            onClick={handleUpdateEligible}
            disabled={updatingEligible}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 sm:py-2.5 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex justify-center items-center"
          >
            {updatingEligible ? 'Memperbarui...' : 'Ubah Status Eligible'}
          </button>
          <button type="button" onClick={handleCetakKartu} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 sm:py-2.5 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-colors flex justify-center items-center">
            <Download size={18} className="mr-2" /> Cetak Kartu
          </button>
        </div>

        {/* Modal Gambar Full Screen */}
        {fullImage && (
          <div onClick={() => setFullImage(null)} className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-sm">
            <button onClick={() => setFullImage(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 rounded-full p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors">
              <X size={24} />
            </button>
            <img src={fullImage} alt="Foto penuh" className="max-h-[95vh] max-w-full object-contain rounded-lg shadow-2xl" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailModal;
