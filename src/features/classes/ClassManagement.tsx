import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Loader2, Edit2, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Class, Level } from '../../types';

interface ClassData extends Class {
  level?: Level;
  student_count?: number;
}

export default function ClassManagement() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  
  // Forms state
  const [levelForm, setLevelForm] = useState({ id: 0, name: '', prefix: '', sort_order: 0 });
  const [classForm, setClassForm] = useState({ id: 0, name: '', level_id: 0 });
  
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch levels
      const { data: levelsData } = await supabase
        .from('levels')
        .select('*')
        .order('sort_order', { ascending: true });
      if (levelsData) setLevels(levelsData);

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          *,
          level:levels(*)
        `)
        .order('name', { ascending: true });
      
      if (classesData) {
        const { data: studentCounts } = await supabase
           .from('students')
           .select('class_id');
           
        const counts: Record<number, number> = {};
        studentCounts?.forEach(s => {
           counts[s.class_id] = (counts[s.class_id] || 0) + 1;
        });
        
        const mapped = classesData.map(c => ({
          ...c,
          student_count: counts[c.id] || 0
        }));
        
        setClasses(mapped as any);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LEVEL ACTIONS ---
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (levelForm.id === 0) {
        // Create
        await supabase.from('levels').insert({ 
          name: levelForm.name, 
          prefix: levelForm.prefix, 
          sort_order: levelForm.sort_order 
        });
      } else {
        // Update
        await supabase.from('levels').update({ 
          name: levelForm.name, 
          prefix: levelForm.prefix, 
          sort_order: levelForm.sort_order 
        }).eq('id', levelForm.id);
      }
      setShowLevelModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan tingkatan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLevel = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus tingkatan ini? Pastikan tidak ada kelas yang menggunakan tingkatan ini.')) return;
    try {
      const { error } = await supabase.from('levels').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const openLevelModal = (level?: Level) => {
    if (level) {
      setLevelForm({ id: level.id, name: level.name, prefix: level.prefix || '', sort_order: level.sort_order || 0 });
    } else {
      setLevelForm({ id: 0, name: '', prefix: '', sort_order: (levels.length + 1) * 10 });
    }
    setShowLevelModal(true);
  };

  // --- CLASS ACTIONS ---
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (classForm.id === 0) {
        // Create
        await supabase.from('classes').insert({ 
          name: classForm.name, 
          level_id: classForm.level_id 
        });
      } else {
        // Update
        await supabase.from('classes').update({ 
          name: classForm.name, 
          level_id: classForm.level_id 
        }).eq('id', classForm.id);
      }
      setShowClassModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan kelas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus kelas ini? Pastikan tidak ada santri yang terkait.')) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const openClassModal = (cls?: ClassData) => {
    if (cls) {
      setClassForm({ id: cls.id, name: cls.name, level_id: cls.level_id });
    } else {
      setClassForm({ id: 0, name: '', level_id: levels.length > 0 ? levels[0].id : 0 });
    }
    setShowClassModal(true);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Kelas & Tingkat</h2>
          <p className="text-gray-500">Atur pembagian kelas berdasarkan tingkatan Al-Qur'an.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => openClassModal()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 font-medium transition-colors"
          >
            <Plus size={18} />
            Tambah Kelas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Daftar Kelas</h3>
            <span className="text-sm text-gray-500">{classes.length} Kelas Aktif</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Nama Kelas</th>
                  <th className="p-4 font-medium">Tingkatan</th>
                  <th className="p-4 font-medium">Jml Santri</th>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                   <tr><td colSpan={4} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
                ) : classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 font-bold text-gray-900">{cls.name}</td>
                    <td className="p-4 text-gray-600">{cls.level?.name || '-'}</td>
                    <td className="p-4 text-gray-600">{cls.student_count}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openClassModal(cls)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteClass(cls.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Levels List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Tingkatan (Levels)</h3>
            <button 
              onClick={() => openLevelModal()}
              className="text-primary hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} /> Tambah
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {loading ? (
               <li className="p-4 text-center text-gray-500">Memuat data...</li>
            ) : levels.map((level) => (
              <li key={level.id} className="p-4 hover:bg-gray-50 flex justify-between items-center group transition-colors">
                <span className="font-medium text-gray-700">{level.name} <span className="text-xs text-gray-400 font-normal ml-2">Urutan: {level.sort_order}</span></span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => openLevelModal(level)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                     <Edit2 size={14} />
                   </button>
                   <button onClick={() => handleDeleteLevel(level.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                     <Trash2 size={14} />
                   </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- LEVEL MODAL --- */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{levelForm.id === 0 ? 'Tambah Tingkatan' : 'Edit Tingkatan'}</h3>
              <button onClick={() => setShowLevelModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveLevel} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tingkatan</label>
                <input 
                  type="text" required 
                  placeholder="Misal: Al Quran I"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={levelForm.name}
                  onChange={(e) => setLevelForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Singkatan / Prefix (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Misal: AQ1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={levelForm.prefix}
                  onChange={(e) => setLevelForm(p => ({ ...p, prefix: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Urut (Sort Order)</label>
                <input 
                  type="number" required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={levelForm.sort_order}
                  onChange={(e) => setLevelForm(p => ({ ...p, sort_order: parseInt(e.target.value) }))}
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowLevelModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-emerald-600 flex justify-center items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CLASS MODAL --- */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{classForm.id === 0 ? 'Tambah Kelas' : 'Edit Kelas'}</h3>
              <button onClick={() => setShowClassModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
                <input 
                  type="text" required 
                  placeholder="Misal: A1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={classForm.name}
                  onChange={(e) => setClassForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tingkatan</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={classForm.level_id}
                  onChange={(e) => setClassForm(p => ({ ...p, level_id: parseInt(e.target.value) }))}
                >
                  <option value={0} disabled>Pilih Tingkatan</option>
                  {levels.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowClassModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-emerald-600 flex justify-center items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
