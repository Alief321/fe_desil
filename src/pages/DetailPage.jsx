import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { Download, ArrowLeft } from 'lucide-react';
import { downloadCardPng } from '../services/cardPrintService';

function getItemName(item) {
  return item['Nama Lengkap Individu'] || item.nama_kepala_keluarga || item.name || '-';
}

function getItemNik(item) {
  return item['Nomor KTP/NIK'] || item.nomor_kk || item.nik || '-';
}

function getItemDesa(item) {
  return item['desa_kelurahan'] || item.desa || item.kelurahan || '-';
}

export default function DetailPage() {
  const { section, id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const endpoint = section === 'keluarga' ? `${import.meta.env.VITE_API_URL}/keluarga/${encodeURIComponent(id)}` : `${import.meta.env.VITE_API_URL}/individu/${encodeURIComponent(id)}`;
        const res = await axios.get(endpoint);
        setItem(res.data.data || res.data || null);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data detail.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [section, id]);

  const handlePrintCard = async () => {
    if (!item) return;
    const payload = {
      section,
      id,
      name: getItemName(item),
      nik: getItemNik(item),
      desa: getItemDesa(item),
    };

    try {
      setPrinting(true);
      await downloadCardPng(payload, `kartu-desil-${section}-${id}.png`);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat kartu. Silakan coba lagi.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        showViewToggle={false}
        showSidebarToggle={false}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'token=; path=/; max-age=0';
          navigate('/login', { replace: true });
        }}
      />
      <main className="p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </button>
          <button
            type="button"
            onClick={handlePrintCard}
            disabled={loading || !item || printing}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} /> {printing ? 'Mencetak...' : 'Cetak Kartu PNG'}
          </button>
        </div>

        <div className="rounded-3xl bg-white shadow-lg border border-slate-200 p-6">
          {loading ? (
            <div className="text-slate-500">Memuat detail...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : item ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tipe</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{section === 'keluarga' ? 'Keluarga' : 'Individu'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nama</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{getItemName(item)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">NIK / Nomor KK</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{getItemNik(item)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Desa/Kelurahan</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{getItemDesa(item)}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ID</p>
                  <p className="mt-2 text-lg text-slate-900">{id}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tautan Detail</p>
                  <p className="mt-2 text-sm text-blue-600 break-all">{`${window.location.origin}/detail/${section}/${id}`}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Data Lengkap</h2>
                <div className="grid gap-4">
                  {Object.entries(item)
                    .filter(([key]) => key !== 'Nama Lengkap Individu' && key !== 'nama_kepala_keluarga' && key !== 'Nomor KTP/NIK' && key !== 'nomor_kk' && key !== 'desa_kelurahan')
                    .map(([key, value]) => (
                      <div key={key} className="grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)]">
                        <p className="text-sm font-semibold text-slate-500">
                          {String(key)
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </p>
                        <p className="text-sm text-slate-700 break-words whitespace-pre-wrap">{String(value)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500">Data tidak ditemukan.</div>
          )}
        </div>
      </main>
    </div>
  );
}
