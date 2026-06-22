import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Eye, EyeOff } from 'lucide-react';

function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export default function AddUserPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    navigate('/login', { replace: true });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showViewToggle={false} showSidebarToggle={false} onLogout={logout} />
        <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Akses Ditolak</h1>
            <p className="text-slate-600 mb-6">
              Halaman ini hanya dapat diakses oleh user dengan role <span className="font-semibold">admin</span>.
            </p>
            <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
              Kembali ke Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        name,
        email,
        role,
        password,
      });
      setMessage('User baru berhasil ditambahkan.');
      setName('');
      setEmail('');
      setRole('user');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showViewToggle={false} showSidebarToggle={false} onLogout={logout} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Tambah User</h1>
              <p className="text-slate-600 mt-2">Hanya admin yang dapat menambahkan user baru.</p>
            </div>
            <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-slate-700 font-medium hover:bg-slate-200">
              Kembali ke Dashboard
            </button>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {message && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{message}</div>}

          <form onSubmit={handleSubmit} className="grid gap-6">
            <label className="block">
              <span className="text-slate-700 font-semibold">Nama Lengkap</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none" required />
            </label>

            <label className="block">
              <span className="text-slate-700 font-semibold">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none" required />
            </label>

            <label className="block">
              <span className="text-slate-700 font-semibold">Password</span>
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none"
                  required
                />
                {/* show password toggle */}
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                  {showPassword ? <Eye /> : <EyeOff />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-slate-700 font-semibold">Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Menyimpan...' : 'Tambah User'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
