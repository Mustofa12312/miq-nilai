import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2, Download, FileDown, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import type { Student, Class, Level } from '../../types';

interface StudentData extends Student {
  class?: Class & { level?: Level };
}

interface ImportRow {
  full_name: string;
  class_name?: string;
  status?: string; // 'valid' | 'error'
  error?: string;
  class_id?: number;
}

export default function StudentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  
  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Single student form state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ id: 0, full_name: '', class_id: 0, active: true });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes, levelsRes] = await Promise.all([
        supabase.from('students').select('*, class:classes(id, name, level_id, level:levels(id, name))').order('full_name'),
        supabase.from('classes').select('*').order('name'),
        supabase.from('levels').select('*').order('sort_order')
      ]);
      if (studentsRes.data) setStudents(studentsRes.data as any);
      if (classesRes.data) setClasses(classesRes.data);
      if (levelsRes.data) setLevels(levelsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // -- IMPORT LOGIC --
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportError('');
    setImportDone(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        
        if (rows.length === 0) {
          setImportError('File kosong atau format tidak sesuai.');
          return;
        }

        // Validate each row
        const parsed: ImportRow[] = rows.map((row) => {
          const name = row['Nama'] || row['nama'] || row['full_name'] || '';
          const className = row['Kelas'] || row['kelas'] || row['class_name'] || '';
          
          if (!name.trim()) return { full_name: name, class_name: className, status: 'error', error: 'Nama kosong' };
          
          // Find matching class_id
          const foundClass = classes.find(c => c.name.toLowerCase() === className.toLowerCase());
          if (!foundClass) return { full_name: name, class_name: className, status: 'error', error: `Kelas "${className}" tidak ditemukan` };
          
          return { full_name: name.trim(), class_name: className, class_id: foundClass.id, status: 'valid' };
        });

        setImportRows(parsed);
        setShowImportModal(true);
      } catch (err) {
        setImportError('Gagal membaca file. Pastikan format Excel (.xlsx) atau CSV.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    const validRows = importRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) return;

    setImportLoading(true);
    try {
      const toInsert = validRows.map(r => ({
        full_name: r.full_name,
        class_id: r.class_id,
        active: true,
      }));

      const { error } = await supabase.from('students').insert(toInsert);
      if (error) throw error;

      setImportDone(true);
      setTimeout(() => {
        setShowImportModal(false);
        setImportRows([]);
        setImportDone(false);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nama: 'Ahmad Fulan', Kelas: 'A1' },
      { Nama: 'Siti Aisyah', Kelas: 'B2' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Santri.xlsx');
  };

  const handleExportData = () => {
    const exportData = filteredStudents.map(s => ({
      'Nama Santri': s.full_name,
      'Kelas': s.class?.name || '-',
      'Tingkatan': (s.class as any)?.level?.name || '-',
      'Status': s.active ? 'Aktif' : 'Nonaktif'
    }));
    
    if (exportData.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Santri');
    XLSX.writeFile(wb, 'Data_Santri_MIQ.xlsx');
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (studentForm.id === 0) {
        // Create
        const { error } = await supabase.from('students').insert({
          full_name: studentForm.full_name,
          class_id: studentForm.class_id,
          active: studentForm.active
        });
        if (error) throw error;
      } else {
        // Update
        const { error } = await supabase.from('students').update({
          full_name: studentForm.full_name,
          class_id: studentForm.class_id,
          active: studentForm.active
        }).eq('id', studentForm.id);
        if (error) throw error;
      }
      setShowStudentModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Gagal menyimpan santri: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openStudentModal = (student?: StudentData) => {
    if (student) {
      setStudentForm({
        id: student.id,
        full_name: student.full_name,
        class_id: student.class_id,
        active: student.active
      });
    } else {
      setStudentForm({
        id: 0,
        full_name: '',
        class_id: classes.length > 0 ? classes[0].id : 0,
        active: true
      });
    }
    setShowStudentModal(true);
  };

  const handleDelete = async (studentId: number, studentName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus santri "${studentName}"?\nSemua data nilai santri ini juga akan dihapus secara permanen.`)) {
      return;
    }

    try {
      // Langkah 1: Cari semua scores milik santri ini
      const { data: scoresData } = await supabase
        .from('scores')
        .select('id')
        .eq('student_id', studentId);

      // Langkah 2: Hapus score_details (anak dari scores)
      if (scoresData && scoresData.length > 0) {
        const scoreIds = scoresData.map(s => s.id);
        const { error: detailErr } = await supabase
          .from('score_details')
          .delete()
          .in('score_id', scoreIds);
        if (detailErr) throw detailErr;

        // Langkah 3: Hapus scores
        const { error: scoreErr } = await supabase
          .from('scores')
          .delete()
          .eq('student_id', studentId);
        if (scoreErr) throw scoreErr;
      }

      // Langkah 4: Hapus santri
      const { error: studentErr } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);
      if (studentErr) throw studentErr;

      // Berhasil — refresh data
      fetchData();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`Gagal menghapus santri: ${err.message}`);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.class?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const studentLevelId = (s.class as any)?.level?.id?.toString() || '';
    const matchesLevel = filterLevel === 'all' || studentLevelId === filterLevel;

    const studentClassId = s.class_id?.toString() || '';
    const matchesClass = filterClass === 'all' || studentClassId === filterClass;

    return matchesSearch && matchesLevel && matchesClass;
  });

  const validCount = importRows.filter(r => r.status === 'valid').length;
  const errorCount = importRows.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Santri</h2>
          <p className="text-gray-500">Kelola data santri, kelas, dan status keaktifan.</p>
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
            onClick={() => openStudentModal()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 font-medium transition-colors"
          >
            <Plus size={18} />
            Tambah
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama santri atau kelas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-gray-700 min-w-[180px]"
          value={filterLevel}
          onChange={(e) => { setFilterLevel(e.target.value); setFilterClass('all'); }}
        >
          <option value="all">Semua Tingkatan</option>
          {levels.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white text-gray-700 min-w-[150px]"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="all">Semua Kelas</option>
          {classes
            .filter(c => filterLevel === 'all' || c.level_id.toString() === filterLevel)
            .map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Nama Santri</th>
                <th className="p-4 font-medium">Kelas</th>
                <th className="p-4 font-medium">Tingkatan</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{student.full_name}</td>
                    <td className="p-4 text-gray-600">{student.class?.name || '-'}</td>
                    <td className="p-4 text-gray-600">{(student.class as any)?.level?.name || '-'}</td>
                    <td className="p-4">
                      {student.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Nonaktif</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openStudentModal(student)}
                          className="text-blue-500 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                          title="Edit Santri"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.full_name)}
                          className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                          title="Hapus Santri"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Tidak ada santri yang ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Preview Import Santri</h3>
                  <p className="text-sm text-gray-500">
                    <span className="text-green-600 font-semibold">{validCount} valid</span>
                    {errorCount > 0 && <span className="text-red-500 font-semibold"> • {errorCount} error</span>}
                    {' '}dari {importRows.length} baris
                  </p>
                </div>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportRows([]); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Format hint */}
            <div className="px-6 pt-4 space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                💡 Format kolom Excel yang dibutuhkan: <strong>Nama</strong> dan <strong>Kelas</strong> (nama kelas harus persis sama, contoh: A1, B2, C1)
              </div>
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm text-primary hover:text-emerald-600 font-medium"
              >
                <FileDown size={16} />
                Download Contoh File Excel (Template)
              </button>
            </div>

            {/* Rows preview */}
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                    <th className="p-3 text-left rounded-tl-lg">Nama</th>
                    <th className="p-3 text-left">Kelas</th>
                    <th className="p-3 text-left rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importRows.map((row, i) => (
                    <tr key={i} className={row.status === 'error' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="p-3 font-medium text-gray-900">{row.full_name || <span className="text-gray-400 italic">kosong</span>}</td>
                      <td className="p-3 text-gray-600">{row.class_name || '-'}</td>
                      <td className="p-3">
                        {row.status === 'valid' ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={14} /> Valid</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-medium"><AlertCircle size={14} /> {row.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3 items-center">
              {importError && <p className="text-sm text-red-500 flex-1">{importError}</p>}
              {importDone && <p className="text-sm text-green-600 font-bold flex-1">✅ {validCount} santri berhasil diimport!</p>}
              {!importDone && !importError && <div className="flex-1" />}
              <button onClick={() => { setShowImportModal(false); setImportRows([]); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0 || importLoading || importDone}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                {importLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Import {validCount} Santri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{studentForm.id === 0 ? 'Tambah Santri' : 'Edit Santri'}</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" required 
                  placeholder="Masukkan nama santri"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={studentForm.full_name}
                  onChange={(e) => setStudentForm(p => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={studentForm.class_id}
                  onChange={(e) => setStudentForm(p => ({ ...p, class_id: parseInt(e.target.value) }))}
                >
                  <option value={0} disabled>Pilih Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({(c as any).level?.name || 'Tanpa Tingkat'})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="active-status"
                  checked={studentForm.active}
                  onChange={(e) => setStudentForm(p => ({ ...p, active: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                />
                <label htmlFor="active-status" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Status Santri Aktif
                </label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowStudentModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-emerald-600 flex justify-center items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
