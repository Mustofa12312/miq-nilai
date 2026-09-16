import { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, Edit2, Trash2, X, Save, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
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

  // Export & Import state
  const fileRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  
  // Delete All state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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
        })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        
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
      toast.success('Data tingkatan berhasil disimpan');
      setShowLevelModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan tingkatan');
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
      toast.error('Gagal menghapus: ' + err.message);
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
      toast.success('Data kelas berhasil disimpan');
      setShowClassModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan kelas');
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
      toast.error('Gagal menghapus: ' + err.message);
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

  const handleExportData = () => {
    const exportData = classes.map(c => ({
      'Nama Kelas': c.name,
      'Tingkatan': c.level?.name || '-',
      'Jumlah Santri': c.student_count || 0
    }));
    
    if (exportData.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Kelas');
    XLSX.writeFile(wb, 'Data_Kelas.xlsx');
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Nama Kelas': 'A1', 'Tingkatan': 'Al Quran I' },
      { 'Nama Kelas': 'B2', 'Tingkatan': 'Al Quran II' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Kelas.xlsx');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const parsedRows = data.map((row: any) => {
          const levelName = row['Tingkatan'] || '';
          const matchedLvl = levels.find(l => l.name.toLowerCase() === levelName.toLowerCase());
          return {
            name: row['Nama Kelas'] || '',
            level_name: levelName,
            level_id: matchedLvl?.id || 0,
            status: matchedLvl ? 'valid' : 'error'
          };
        });
        
        setImportRows(parsedRows);
        setShowImportModal(true);
      } catch (err) {
        toast.error('Gagal membaca file excel');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    const validRows = importRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) return;
    
    setImportLoading(true);
    try {
      const toInsert = validRows.map(r => ({
        name: r.name,
        level_id: r.level_id
      }));
      
      const { error } = await supabase.from('classes').insert(toInsert);
      if (error) throw error;
      
      toast.success('Berhasil mengimpor kelas');
      setShowImportModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal impor: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      // Sesuai dengan "menyesuaikan dengan data santri"
      // Hapus seluruh dependensi agar tabel kelas dapat dibersihkan
      await supabase.from('score_details').delete().neq('id', 0);
      await supabase.from('scores').delete().neq('id', 0);
      await supabase.from('students').delete().neq('id', 0);
      
      const { error } = await supabase.from('classes').delete().neq('id', 0);
      if (error) throw error;
      
      toast.success('Berhasil menghapus seluruh data kelas beserta data santri.');
      setShowDeleteAllModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menghapus: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Kelas & Tingkat</h2>
          <p className="text-gray-500">Atur pembagian kelas berdasarkan tingkatan Al-Qur'an.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            <Upload size={18} />
            Import
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
          
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium transition-colors"
          >
            <Trash2 size={18} />
            Hapus Semua
          </button>

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

      {/* Modal Hapus Semua */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Seluruh Kelas?</h3>
              <p className="text-gray-500 mb-6">
                Anda yakin ingin menghapus <strong>seluruh data kelas</strong>? Tindakan ini juga akan <strong>menghapus seluruh santri dan nilai</strong> yang menggunakan kelas-kelas ini secara permanen.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteAllModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeletingAll ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Hapus Semua'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">Review Import Data Kelas</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Ditemukan {importRows.length} baris data. 
                  <span className="text-emerald-600 font-medium ml-2">{importRows.filter(r => r.status === 'valid').length} valid</span>,
                  <span className="text-red-600 font-medium ml-2">{importRows.filter(r => r.status === 'error').length} bermasalah</span>
                </p>
                <button onClick={handleDownloadTemplate} className="text-sm text-primary hover:underline font-medium">Download Template Excel</button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Nama Kelas</th>
                      <th className="px-4 py-3 font-medium">Tingkatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {importRows.map((row, i) => (
                      <tr key={i} className={row.status === 'error' ? 'bg-red-50' : 'bg-white'}>
                        <td className="px-4 py-3">
                          {row.status === 'valid' ? 
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Valid</span> : 
                            <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">Error: Tingkatan Tidak Ditemukan</span>
                          }
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 text-gray-600">{row.level_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Batal
              </button>
              <button 
                onClick={handleImport}
                disabled={importLoading || importRows.filter(r => r.status === 'valid').length === 0}
                className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importLoading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Import {importRows.filter(r => r.status === 'valid').length} Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
