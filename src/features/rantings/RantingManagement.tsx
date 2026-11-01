import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Loader2, Search, Users, Building2,
  X, Save, ShieldCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
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
  if (g === 'MALE') return 'bg-blue-50 text-blue-700 border-blue-100/60';
  if (g === 'FEMALE') return 'bg-pink-50 text-pink-700 border-pink-100/60';
  return 'bg-purple-50 text-purple-600 border-purple-100/60';
};

export default function RantingManagement() {
  const [rantings, setRantings] = useState<RantingWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState({
    id: 0,
    code: '',
    name: '',
    gender: 'MIXED' as 'MALE' | 'FEMALE' | 'MIXED',
    active: true
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

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const totalSantriCount = rantings.reduce((s, r) => s + r.student_count, 0);
  const totalActiveRantings = rantings.filter(r => r.active).length;

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRantings = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 sm:space-y-6 text-left">
      {/* BEGIN: Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-purpose="page-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Ranting</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data cabang/ranting peserta ujian MIQ.
          </p>
        </div>
        <div>
          <button
            onClick={openCreate}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-apple-glow transition active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tambah Ranting</span>
          </button>
        </div>
      </section>
      {/* END: Page Header */}

      {/* BEGIN: Metric Summary Cards (3 cards) */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5" data-purpose="metric-widgets">
        {/* Card 1: Total Ranting */}
        <article className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-apple-card hover:shadow-apple-hover transition duration-200 flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              {rantings.length}
            </div>
            <p className="text-[11.5px] sm:text-xs font-medium text-slate-400 mt-0.5">
              Total Ranting
            </p>
          </div>
        </article>

        {/* Card 2: Total Santri */}
        <article className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-apple-card hover:shadow-apple-hover transition duration-200 flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              {totalSantriCount}
            </div>
            <p className="text-[11.5px] sm:text-xs font-medium text-slate-400 mt-0.5">
              Total Santri
            </p>
          </div>
        </article>

        {/* Card 3: Ranting Aktif */}
        <article className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-apple-card hover:shadow-apple-hover transition duration-200 flex items-center space-x-3.5 sm:space-x-4 col-span-2 md:col-span-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              {totalActiveRantings}
            </div>
            <p className="text-[11.5px] sm:text-xs font-medium text-slate-400 mt-0.5">
              Ranting Aktif
            </p>
          </div>
        </article>
      </section>
      {/* END: Metric Summary Cards */}

      {/* BEGIN: Search & Table Container */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-apple-card overflow-hidden" data-purpose="ranting-table-container">
        {/* Search and Counter Filter Row */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Cari kode atau nama ranting..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100/70 px-3 py-1.5 rounded-lg self-end sm:self-center">
            {filtered.length} ranting
          </div>
        </div>

        {/* Desktop Table View (hidden on mobile, visible md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#FAFBFD] text-[11px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                <th className="py-3.5 pl-6 pr-4" scope="col">Kode</th>
                <th className="py-3.5 px-4" scope="col">Nama Ranting</th>
                <th className="py-3.5 px-4 text-center" scope="col">Jenis</th>
                <th className="py-3.5 px-4 text-center" scope="col">Santri</th>
                <th className="py-3.5 px-4 text-center" scope="col">Status</th>
                <th className="py-3.5 pl-4 pr-6 text-right" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-normal text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-brand-600" />
                    <span>Memuat data ranting...</span>
                  </td>
                </tr>
              ) : paginatedRantings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada ranting ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedRantings.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 pl-6 pr-4 font-mono text-xs font-medium text-slate-500 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-md border border-slate-200/50">
                        {r.code}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      {r.name}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${genderBadge(r.gender)}`}>
                        {genderLabel(r.gender)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                      {r.student_count}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {r.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100/60">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200/50">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition inline-flex items-center justify-center cursor-pointer"
                        title="Ubah"
                        type="button"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deletingId === r.id}
                        className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition inline-flex items-center justify-center disabled:opacity-50 cursor-pointer"
                        title="Hapus"
                        type="button"
                      >
                        {deletingId === r.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile (HP) Card List View (visible on mobile only, < md) */}
        <div className="block md:hidden divide-y divide-slate-100 p-3 sm:p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 size={24} className="animate-spin mx-auto mb-2 text-brand-600" />
              <span className="text-xs">Memuat data ranting...</span>
            </div>
          ) : paginatedRantings.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada ranting ditemukan.
            </div>
          ) : (
            paginatedRantings.map(r => (
              <article
                key={r.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-3"
              >
                {/* Header: Code & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 bg-slate-100 rounded-md border border-slate-200/50 mb-1.5">
                      {r.code}
                    </span>
                    <h4 className="text-[14.5px] font-bold text-slate-900 leading-snug">
                      {r.name}
                    </h4>
                  </div>
                  {r.active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100/60 shrink-0">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-500 shrink-0">
                      Nonaktif
                    </span>
                  )}
                </div>

                {/* Details Row: Gender & Student Count */}
                <div className="flex items-center gap-2 pt-0.5 text-xs">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${genderBadge(r.gender)}`}>
                    {genderLabel(r.gender)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    <Users size={12} className="text-slate-500" />
                    <span>{r.student_count} Santri</span>
                  </span>
                </div>

                {/* Mobile Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => openEdit(r)}
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50/80 text-blue-600 hover:bg-blue-100 active:scale-95 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit Ranting</span>
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={deletingId === r.id}
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50/80 text-rose-600 hover:bg-rose-100 active:scale-95 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {deletingId === r.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    <span>Hapus</span>
                  </button>
                </div>
              </article>
            ))
          )}
        {/* Mobile Pagination Footer */}
        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-apple-card flex items-center justify-between text-xs text-slate-500">
            <span>
              {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} dari {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 cursor-pointer"
                type="button"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-semibold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 cursor-pointer"
                type="button"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sleek Apple-Style Pagination Footer for Desktop */}
      {filtered.length > 0 && (
        <div className="hidden md:flex px-5 sm:px-6 py-4 border-t border-slate-100 items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div>
            Menampilkan <span className="font-semibold text-slate-800">{startIndex + 1}</span> - <span className="font-semibold text-slate-800">{Math.min(startIndex + pageSize, filtered.length)}</span> dari <span className="font-semibold text-slate-800">{filtered.length}</span> ranting
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              type="button"
            >
              Sebelumnya
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = idx + 1;
              else if (currentPage <= 3) pageNum = idx + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
              else pageNum = currentPage - 2 + idx;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg font-semibold transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  type="button"
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              type="button"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
      </section>
      {/* END: Search & Table Container */}

      {/* BEGIN: Modal Add/Edit Ranting */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#FAFBFD]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {form.id === 0 ? 'Tambah Ranting Baru' : 'Edit Ranting'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Ranting</label>
                <input
                  required
                  type="text"
                  placeholder="ex: A-001"
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ranting</label>
                <input
                  required
                  type="text"
                  placeholder="ex: MMU. MATHOLIUL ANWAR"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin Santri</label>
                <select
                  value={form.gender}
                  onChange={e => setForm(p => ({ ...p, gender: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
                >
                  <option value="FEMALE">Putri</option>
                  <option value="MALE">Putra</option>
                  <option value="MIXED">Campuran</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ranting-active"
                  checked={form.active}
                  onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <label htmlFor="ranting-active" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status Ranting Aktif
                </label>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 shadow-apple-glow transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END: Modal Add/Edit Ranting */}
    </div>
  );
}
