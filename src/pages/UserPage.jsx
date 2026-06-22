import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Edit, Eye, EyeOff, Trash2, X, Lock } from 'lucide-react';

function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export default function UserPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'user', password: '' });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/users`);
      setUsers(res.data.data || res.data || []);
    } catch (err) {
      setError('Gagal mengambil daftar user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const openAddModal = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'user', password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setForm({ name: u.name || u.nama || '', email: u.email || '', role: u.role || 'user', password: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm({ name: '', email: '', role: 'user', password: '' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/users/${encodeURIComponent(id)}`);
      setMessage('User berhasil dihapus.');
      fetchUsers();
    } catch (err) {
      setError('Gagal menghapus user.');
    }
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (editingUser) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/users/${encodeURIComponent(editingUser.id || editingUser._id)}`, {
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
        setMessage('User berhasil diperbarui.');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
          name: form.name,
          email: form.email,
          role: form.role,
          password: form.password,
        });
        setMessage('User baru berhasil ditambahkan.');
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showViewToggle={false} showSidebarToggle={false} onLogout={logout} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Management User</h1>
              <p className="text-slate-600 mt-2">Kelola user: tambah, edit, dan hapus.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={openAddModal} className="cursor-pointer hover:bg-blue-700 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white font-medium">
                Tambah User
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className="cursor-pointer hover:bg-slate-200 inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-slate-700 font-medium">
                Kembali ke Dashboard
              </button>
            </div>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {message && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{message}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-bold">Nama</th>
                  <th className="px-6 py-3 font-bold">Email</th>
                  <th className="px-6 py-3 font-bold">Role</th>
                  <th className="px-6 py-3 font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-center text-slate-500">
                      Memuat...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-center text-slate-500">
                      Tidak ada user.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id || u._id || u.email}>
                      <td className="px-6 py-4 font-medium text-slate-800">{u.name || u.nama || '-'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">{u.role}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(u)} className="cursor-pointer hover:bg-yellow-200 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(u.id || u._id || u.email)} className="cursor-pointer hover:bg-red-200 px-3 py-1 bg-red-100 text-red-800 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{editingUser ? 'Edit User' : 'Tambah User'}</h3>
                <button onClick={closeModal} className="text-slate-500 hover:text-slate-800">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="grid gap-4">
                <label className="block">
                  <span className="text-slate-700 font-semibold">Nama</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold">Email</span>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold">Role</span>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                {!editingUser && (
                  <label className="block">
                    <span className="text-slate-700 font-semibold">Password</span>

                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="masukkan password Anda"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                )}

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 rounded-lg">
                    Batal
                  </button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
