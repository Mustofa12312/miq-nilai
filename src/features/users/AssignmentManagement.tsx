import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Users, MapPin, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Profile, ExamPeriod, Class, ExaminerAssignment } from '../../types';

interface RoomInfo {
  room: string;
  rantings: { id: number; code: string; name: string }[];
}

export default function AssignmentManagement() {
  const [assignments, setAssignments] = useState<ExaminerAssignment[]>([]);
  const [examiners, setExaminers] = useState<Profile[]>([]);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Room data derived from student import
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomRantings, setSelectedRoomRantings] = useState<{ id: number; code: string; name: string }[]>([]);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    examiner_id: '',
    period_id: 0,
    class_id: 0,
    room: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assnRes, examRes, perRes, classRes] = await Promise.all([
        supabase.from('examiner_assignments').select('*, class:classes(*), period:exam_periods(*), ranting:rantings(*)').order('id', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'examiner').eq('status', true).order('full_name'),
        supabase.from('exam_periods').select('*').eq('active', true).order('start_date', { ascending: false }),
        supabase.from('classes').select('*, level:levels(*)').eq('active', true).order('name'),
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
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  // Load rooms from student data when class changes
  useEffect(() => {
    if (!form.class_id) {
      setAvailableRooms([]);
      setSelectedRoomRantings([]);
      return;
    }
    const fetchRoomsForClass = async () => {
      setLoadingRooms(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('room, ranting:rantings(id, code, name)')
          .eq('class_id', form.class_id)
          .eq('active', true)
          .not('room', 'is', null);
        if (error) throw error;

        const roomMap = new Map<string, Map<number, { id: number; code: string; name: string }>>();
        (data || []).forEach((s: any) => {
          const room = s.room?.trim();
          if (!room) return;
          if (!roomMap.has(room)) roomMap.set(room, new Map());
          if (s.ranting?.id) roomMap.get(room)!.set(s.ranting.id, s.ranting);
        });

        const rooms: RoomInfo[] = Array.from(roomMap.entries())
          .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
          .map(([room, rantingMap]) => ({ room, rantings: Array.from(rantingMap.values()) }));

        setAvailableRooms(rooms);
        setForm(f => ({ ...f, room: '' }));
        setSelectedRoomRantings([]);
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat data ruangan');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRoomsForClass();
  }, [form.class_id]);

  const handleRoomChange = (roomName: string) => {
    setForm(f => ({ ...f, room: roomName }));
    if (!roomName) { setSelectedRoomRantings([]); return; }
    const roomInfo = availableRooms.find(r => r.room === roomName);
    setSelectedRoomRantings(roomInfo?.rantings || []);
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examiner_id || !form.period_id || !form.class_id) {
      toast.error('Harap isi semua bidang yang wajib');
      return;
    }

    setIsSaving(true);
    try {
      const inserts = [];
      if (selectedRoomRantings.length > 0) {
        for (const r of selectedRoomRantings) {
          inserts.push({
            examiner_id: form.examiner_id,
            period_id: form.period_id,
            class_id: form.class_id,
            ranting_id: r.id,
            room: form.room || null,
            gender: null,
          });
        }
      } else {
        inserts.push({
          examiner_id: form.examiner_id,
          period_id: form.period_id,
          class_id: form.class_id,
          ranting_id: null,
          room: form.room || null,
          gender: null,
        });
      }

      const { error } = await supabase.from('examiner_assignments').insert(inserts);
      if (error) throw error;

      toast.success('Penguji berhasil ditugaskan');
      resetModal();
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan penugasan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setForm(f => ({ ...f, examiner_id: '', class_id: 0, room: '' }));
    setAvailableRooms([]);
    setSelectedRoomRantings([]);
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
          <h2 className="text-2xl font-bold text-gray-900">Plotting Penguji</h2>
          <p className="text-gray-500">Tugaskan penguji ke kelas dan ruangan santri.</p>
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
                <th className="p-4 font-medium">Ruangan</th>
                <th className="p-4 font-medium">Ranting</th>
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
                    <td className="p-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        {examiner?.full_name || 'Tidak ditemukan'}
                      </div>
                    </td>
                    <td className="p-4 text-gray-800">{a.class?.name}</td>
                    <td className="p-4 text-gray-800">
                      {a.room ? (
                        <div className="flex items-center gap-1 text-emerald-700">
                          <MapPin size={14} />
                          {a.room}
                        </div>
                      ) : <span className="text-gray-400 italic">-</span>}
                    </td>
                    <td className="p-4 text-gray-800">
                      {a.ranting ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          <Tag size={11} />
                          {a.ranting.code} - {(a.ranting as any).name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Semua Ranting</span>
                      )}
                    </td>
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
              <p className="text-sm text-gray-500 mt-1">Pilih kelas lalu pilih ruangan — ranting otomatis terisi.</p>
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
                  onChange={e => setForm(f => ({ ...f, class_id: Number(e.target.value), room: '' }))}
                >
                  <option value={0} disabled>-- Pilih Kelas --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level?.name})</option>)}
                </select>
              </div>

              {/* Ruangan — dropdown dari data santri, muncul setelah kelas dipilih */}
              {form.class_id > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ruangan / Halaqoh
                    {loadingRooms && <span className="ml-2 text-xs text-gray-400">Memuat ruangan...</span>}
                  </label>
                  {!loadingRooms && availableRooms.length === 0 ? (
                    <div className="w-full px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-gray-400 text-sm bg-gray-50">
                      Tidak ada data ruangan untuk kelas ini. Pastikan data santri sudah diimpor dengan kolom "Ruangan" atau "Halaqoh".
                    </div>
                  ) : (
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none"
                      value={form.room}
                      onChange={e => handleRoomChange(e.target.value)}
                      disabled={loadingRooms}
                    >
                      <option value="">-- Pilih Ruangan (opsional) --</option>
                      {availableRooms.map(r => (
                        <option key={r.room} value={r.room}>
                          {r.room}{r.rantings.length > 0 ? ` (${r.rantings.map(rt => rt.code).join(', ')})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Ranting — auto-filled, read-only */}
              {form.room && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ranting di Ruangan Ini
                    <span className="ml-2 text-xs text-gray-400 font-normal">(Otomatis dari data santri)</span>
                  </label>
                  {selectedRoomRantings.length > 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-wrap gap-2">
                      {selectedRoomRantings.map(r => (
                        <span key={r.id} className="inline-flex items-center gap-1.5 bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                          <Tag size={12} />
                          {r.code} — {r.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-400 italic">
                      Ruangan ini tidak memiliki data ranting — akan disimpan tanpa ranting tertentu.
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetModal}
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
