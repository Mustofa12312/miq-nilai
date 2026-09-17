import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Profile, ExamPeriod, Class, Ranting, ExaminerAssignment } from '../../types';

export default function AssignmentManagement() {
  const [assignments, setAssignments] = useState<ExaminerAssignment[]>([]);
  const [examiners, setExaminers] = useState<Profile[]>([]);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [rantings, setRantings] = useState<Ranting[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    examiner_id: '',
    period_id: 0,
    class_id: 0,
    ranting_id: 0,
    room: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assnRes, examRes, perRes, classRes, rantRes] = await Promise.all([
        supabase.from('examiner_assignments').select('*, class:classes(*), period:exam_periods(*), ranting:rantings(*)').order('id', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'examiner').eq('status', true).order('full_name'),
        supabase.from('exam_periods').select('*').eq('active', true).order('start_date', { ascending: false }),
        supabase.from('classes').select('*, level:levels(*)').eq('active', true).order('name'),
        supabase.from('rantings').select('*').eq('active', true).order('name')
      ]);

      if (assnRes.data) setAssignments(assnRes.data);
      if (examRes.data) setExaminers(examRes.data);
      if (perRes.data) {
        setPeriods(perRes.data);
        if (perRes.data.length > 0 && form.period_id === 0) {
          setForm(f => ({ ...f, period_id: perRes.data[0].id }));
        }
      }
      if (classRes.data) setClasses(classRes.data);
      if (rantRes.data) setRantings(rantRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examiner_id || !form.period_id || !form.class_id || !form.ranting_id || !form.room.trim()) {
      toast.error('Harap isi semua bidang');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('examiner_assignments').insert({
        examiner_id: form.examiner_id,
        period_id: form.period_id,
        class_id: form.class_id,
        ranting_id: form.ranting_id,
        room: form.room.trim()
      });

      if (error) throw error;
      toast.success('Penguji berhasil ditugaskan');
      setShowModal(false);
      setForm(f => ({ ...f, room: '' })); // reset room
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan penugasan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus penugasan ini?')) return;
    try {
      const { error } = await supabase.from('examiner_assignments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Penugasan dihapus');
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menghapus: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plotting Penguji (Ruangan)</h2>
          <p className="text-gray-500">Tugaskan penguji ke ruangan/halaqoh tertentu pada suatu ranting.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 font-medium transition-colors"
        >
          <Plus size={18} />
          Tugaskan Penguji
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Periode</th>
                <th className="p-4 font-medium">Penguji</th>
                <th className="p-4 font-medium">Kelas</th>
                <th className="p-4 font-medium">Ranting</th>
                <th className="p-4 font-medium">Ruang/Halaqoh</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Memuat data...</td></tr>
              ) : assignments.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada data penugasan</td></tr>
              ) : assignments.map(a => {
                const examiner = examiners.find(e => e.id === a.examiner_id);
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-800">{a.period?.name}</td>
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      {examiner?.full_name || 'Tidak ditemukan'}
                    </td>
                    <td className="p-4 text-gray-800">{a.class?.name}</td>
                    <td className="p-4 text-gray-800">{a.ranting?.name}</td>
                    <td className="p-4 font-bold text-primary">{a.room}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Penugasan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tugaskan Penguji</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periode Ujian</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
                  value={form.period_id}
                  onChange={e => setForm(f => ({ ...f, period_id: Number(e.target.value) }))}
                >
                  <option value={0} disabled>-- Pilih Periode --</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Penguji</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
                  value={form.examiner_id}
                  onChange={e => setForm(f => ({ ...f, examiner_id: e.target.value }))}
                >
                  <option value="" disabled>-- Pilih Penguji --</option>
                  {examiners.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
                  value={form.class_id}
                  onChange={e => setForm(f => ({ ...f, class_id: Number(e.target.value) }))}
                >
                  <option value={0} disabled>-- Pilih Kelas --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level?.name})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ranting</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
                  value={form.ranting_id}
                  onChange={e => setForm(f => ({ ...f, ranting_id: Number(e.target.value) }))}
                >
                  <option value={0} disabled>-- Pilih Ranting --</option>
                  {rantings.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruang / Halaqoh</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ruang 1, Ruang Utama, Halaqoh A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
                  value={form.room}
                  onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
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
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Penugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
