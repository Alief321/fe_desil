import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    navigate('/login', { replace: true });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showViewToggle={false} showSidebarToggle={false} onLogout={logout} />
        <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Profil Tidak Ditemukan</h1>
            <p className="text-slate-600 mb-6">Silakan login kembali untuk melihat data profil Anda.</p>
            <Link to="/login" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
              Kembali ke Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showViewToggle={false} showSidebarToggle={false} onLogout={logout} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Profil Saya</h1>
              <p className="text-slate-600 mt-2">Data profil diambil dari localStorage saat login.</p>
            </div>
            <Link to="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-slate-700 font-medium hover:bg-slate-200">
              Kembali ke Dashboard
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-3">Nama</p>
              <p className="text-lg font-semibold text-slate-900">{user.name || '-'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-3">Email</p>
              <p className="text-lg font-semibold text-slate-900">{user.email || '-'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-3">Role</p>
              <p className="text-lg font-semibold text-slate-900">{user.role || '-'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-3">Username</p>
              <p className="text-lg font-semibold text-slate-900">{user.username || '-'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
