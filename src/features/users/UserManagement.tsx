import { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, Loader2, UserCheck, Mail, Key, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'examiner' as 'admin' | 'examiner',
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(form),
        }
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Gagal membuat akun.');

      setSuccessMsg(`✅ Akun untuk ${form.full_name} berhasil dibuat!`);
      setForm({ full_name: '', email: '', password: '', role: 'examiner' });
      setShowModal(false);
      fetchUsers(); // refresh list
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      super_admin: 'Super Admin', admin: 'Admin', examiner: 'Penguji', leader: 'Pimpinan'
    };
    return map[role] || role;
  };

  const roleBadgeColor = (role: string) => {
    if (role === 'super_admin') return 'bg-purple-100 text-purple-800';
    if (role === 'admin') return 'bg-blue-100 text-blue-800';
    if (role === 'examiner') return 'bg-emerald-100 text-emerald-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h2>
          <p className="text-gray-500">Tambah dan kelola akun Admin & Tim Penguji.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setErrorMsg(''); setSuccessMsg(''); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 font-medium transition-colors"
        >
          <Plus size={18} />
          Tambah Pengguna
        </button>
      </div>

      {/* Success notification */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl font-medium">
          {successMsg}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700">Daftar Pengguna Aktif</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Nama</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-400">Memuat data...</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">{u.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Pengguna */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="text-primary" size={22} />
                Buat Akun Pengguna Baru
              </h3>
              <p className="text-sm text-gray-500 mt-1">Akun langsung aktif tanpa verifikasi email.</p>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{errorMsg}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" required
                    placeholder="Ust. Ahmad Fauzi"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={form.full_name}
                    onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" required
                    placeholder="penguji@miq.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required minLength={6}
                    placeholder="Min. 6 karakter"
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={form.password}
                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role / Jabatan</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={form.role}
                  onChange={(e) => setForm(p => ({ ...p, role: e.target.value as any }))}
                >
                  <option value="examiner">Penguji</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
