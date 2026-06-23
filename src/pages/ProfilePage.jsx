import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getStoredUser } from '../services/getStoredUsers';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const result = await getStoredUser();
      setUser(result);
      setLoading(false);
    }
    loadUser();
  }, []);

  const logout = () => {
    document.cookie = 'token=; path=/; max-age=0';
    navigate('/login', { replace: true });
  };

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  // ❌ Tidak ada user
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showViewToggle={false} showSidebarToggle={false} onLogout={logout} />
        <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Profil Tidak Ditemukan</h1>
            <p className="text-slate-600 mb-6">Silakan login kembali.</p>
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ✅ User ada
  return (
    <div className="min-h-screen bg-slate-50">
      <Header showViewToggle={false} showSidebarToggle={false} onLogout={logout} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Profil Saya</h1>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card">
              <p className="label">Nama</p>
              <p>{user.name}</p>
            </div>
            <div className="card">
              <p className="label">Email</p>
              <p>{user.email}</p>
            </div>
            <div className="card">
              <p className="label">Role</p>
              <p>{user.role}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
