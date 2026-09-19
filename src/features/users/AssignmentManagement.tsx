import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Users, MapPin, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Profile, ExamPeriod, Class, ExaminerAssignment } from '../../types';
import SearchableSelect from '../../components/SearchableSelect';

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
  const [editingId, setEditingId] = useState<number | null>(null);
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
        if (!editingId) {
          setForm(f => ({ ...f, room: '' }));
          setSelectedRoomRantings([]);
        }
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
      if (editingId) {
        // Mode Edit: Hanya update penguji dan periode
        const { error } = await supabase.from('examiner_assignments')
          .update({
            examiner_id: form.examiner_id,
            period_id: form.period_id,
          })
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success('Penugasan berhasil diperbarui');
      } else {
        // Mode Insert
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
      }

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
    setEditingId(null);
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

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setForm({
      examiner_id: a.examiner_id,
      period_id: a.period_id,
      class_id: a.class_id,
      room: a.room || '',
    });
    // Set selected room rantings for display if needed
    if (a.room) {
      handleRoomChange(a.room); // Might not accurately fetch all for that class immediately if not loaded, but it's ok for edit view since we disable them.
    }
    setShowModal(true);
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
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(a)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Penguji"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Penugasan"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Penguji' : 'Penugasan Penguji'}</h3>
              <p className="text-sm text-gray-500 mt-1">{editingId ? 'Ubah penguji untuk kelas dan ruangan ini.' : 'Pilih kelas lalu pilih ruangan — ranting otomatis terisi.'}</p>
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
                <SearchableSelect
                  placeholder="-- Pilih Penguji --"
                  options={examiners.map(e => ({ value: e.id, label: e.full_name }))}
                  value={form.examiner_id}
                  onChange={(val) => setForm(f => ({ ...f, examiner_id: String(val) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <select
                  required
                  disabled={editingId !== null}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
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
                  {!loadingRooms && availableRooms.length === 0 && !editingId ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      Tidak ada data ruangan/halaqoh yang terisi untuk santri di kelas ini.
                    </div>
                  ) : (
                    <select
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                      value={form.room}
                      disabled={editingId !== null}
                      onChange={e => handleRoomChange(e.target.value)}
                    >
                      <option value="">-- Semua Ruangan --</option>
                      {editingId && !availableRooms.find(r => r.room === form.room) && form.room && (
                        <option value={form.room}>{form.room}</option>
                      )}
                      {availableRooms.map(r => (
                        <option key={r.room} value={r.room}>{r.room} ({r.rantings.length} ranting)</option>
                      ))}
                    </select>
                  )}
                  {editingId && <p className="text-xs text-blue-600 mt-2">Peringatan: Kelas dan Ruangan tidak dapat diubah saat Edit. Hapus penugasan ini dan buat baru jika ingin mengubah kelas/ruangan.</p>}
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
