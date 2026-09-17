import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Search, Users, Building2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Ranting } from '../../types';

interface RantingWithCount extends Ranting {
  student_count: number;
}

const genderLabel = (g: string) => {
  if (g === 'MALE') return 'Putra';
  if (g === 'FEMALE') return 'Putri';
  return 'Campuran';
};

const genderBadge = (g: string) => {
  if (g === 'MALE') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (g === 'FEMALE') return 'bg-pink-50 text-pink-700 border-pink-100';
  return 'bg-purple-50 text-purple-700 border-purple-100';
};

export default function RantingManagement() {
  const [rantings, setRantings] = useState<RantingWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    id: 0, code: '', name: '', gender: 'MIXED' as 'MALE' | 'FEMALE' | 'MIXED', active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: rantingData } = await supabase
        .from('rantings')
        .select('*')
        .order('code', { ascending: true });

      if (!rantingData) return;

      // Count students per ranting
      const { data: countData } = await supabase
        .from('students')
        .select('ranting_id')
        .not('ranting_id', 'is', null);

      const countMap: Record<number, number> = {};
      if (countData) {
        countData.forEach((s: any) => {
          if (s.ranting_id) countMap[s.ranting_id] = (countMap[s.ranting_id] || 0) + 1;
        });
      }

      setRantings(rantingData.map(r => ({ ...r, student_count: countMap[r.id] || 0 })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm({ id: 0, code: '', name: '', gender: 'MIXED', active: true });
    setShowModal(true);
  };

  const openEdit = (r: RantingWithCount) => {
    setForm({ id: r.id, code: r.code, name: r.name, gender: r.gender, active: r.active });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (form.id === 0) {
        const { error } = await supabase.from('rantings').insert({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          gender: form.gender,
          active: form.active,
        });
        if (error) throw error;
        toast.success(`Ranting "${form.name}" berhasil ditambahkan!`);
      } else {
        const { error } = await supabase.from('rantings').update({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          gender: form.gender,
          active: form.active,
        }).eq('id', form.id);
        if (error) throw error;
        toast.success('Ranting berhasil diperbarui!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan ranting.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (r: RantingWithCount) => {
    if (r.student_count > 0) {
      toast.error(`Tidak bisa dihapus. Masih ada ${r.student_count} santri di ranting ini.`);
      return;
    }
    if (!window.confirm(`Hapus ranting "${r.name}"?`)) return;
    setDeletingId(r.id);
    try {
      const { error } = await supabase.from('rantings').delete().eq('id', r.id);
      if (error) throw error;
      toast.success('Ranting berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = rantings.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Ranting</h2>
          <p className="text-gray-500">Kelola data cabang/ranting peserta ujian MIQ.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 font-medium transition-colors"
        >
          <Plus size={18} />
          Tambah Ranting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{rantings.length}</p>
            <p className="text-xs text-gray-500">Total Ranting</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {rantings.reduce((s, r) => s + r.student_count, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Santri</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {rantings.filter(r => r.active).length}
            </p>
            <p className="text-xs text-gray-500">Ranting Aktif</p>
          </div>
        </div>
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama ranting..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">{filtered.length} ranting</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Kode</th>
                <th className="p-4 font-medium">Nama Ranting</th>
                <th className="p-4 font-medium">Jenis</th>
                <th className="p-4 font-medium text-center">Santri</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Memuat data ranting...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Tidak ada ranting ditemukan.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{r.code}</span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{r.name}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${genderBadge(r.gender)}`}>
                      {genderLabel(r.gender)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-semibold text-gray-700">{r.student_count}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deletingId === r.id}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus"
                      >
                        {deletingId === r.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Ranting */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="text-primary" size={22} />
                <h3 className="font-bold text-gray-900">{form.id === 0 ? 'Tambah Ranting Baru' : 'Edit Ranting'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Ranting</label>
                <input
                  required
                  type="text"
                  placeholder="ex: A-001"
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ranting</label>
                <input
                  required
                  type="text"
                  placeholder="ex: MMU. MATHOLIUL ANWAR"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin Santri</label>
                <select
                  value={form.gender}
                  onChange={e => setForm(p => ({ ...p, gender: e.target.value as any }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="FEMALE">Putri</option>
                  <option value="MALE">Putra</option>
                  <option value="MIXED">Campuran</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ranting-active"
                  checked={form.active}
                  onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="ranting-active" className="text-sm font-medium text-gray-700">Aktif</label>
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
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
