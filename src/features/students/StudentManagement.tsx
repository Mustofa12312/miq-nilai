import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2, Download, FileDown, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import type { Student, Class, Level, Ranting } from '../../types';

interface StudentData extends Student {
  class?: Class & { level?: Level };
}

interface ImportRow {
  no?: number;
  nis?: string;
  full_name: string;
  gender?: string;
  father_name?: string;
  branch_code?: string;
  branch_name?: string;
  birth_place?: string;
  birth_date?: string;
  class_name?: string;
  tingkat?: string;  // ULA / Wustho / etc.
  class_id?: number;
  ranting_id?: number | null;
  room?: string;
  status: 'valid' | 'error';
  error?: string;
}

export default function StudentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [rantings, setRantings] = useState<Ranting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  
  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Single student form state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({ 
    id: 0, 
    nis: '',
    full_name: '', 
    gender: 'L',
    father_name: '',
    branch_code: '',
    branch_name: '',
    class_id: 0, 
    active: true 
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes, levelsRes, rantingsRes] = await Promise.all([
        supabase.from('students').select('*, class:classes(id, name, level_id, level:levels(id, name))').order('id', { ascending: true }),
        supabase.from('classes').select('*').order('name'),
        supabase.from('levels').select('*').order('sort_order'),
        supabase.from('rantings').select('*').order('code'),
      ]);
      if (studentsRes.data) setStudents(studentsRes.data as any);
      if (classesRes.data) {
        const sortedClasses = [...classesRes.data].sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
        setClasses(sortedClasses);
      }
      if (levelsRes.data) setLevels(levelsRes.data);
      if (rantingsRes.data) setRantings(rantingsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // -- IMPORT LOGIC --
  // Helper: Normalize kelas value (VI -> 6, 'VI ' -> 6, dll)
  const normalizeKelas = (val: any): string => {
    const s = String(val).trim();
    const romanMap: Record<string, string> = { I: '1', II: '2', III: '3', IV: '4', V: '5', VI: '6', VII: '7' };
    const upper = s.toUpperCase().trim();
    if (romanMap[upper]) return romanMap[upper];
    return s;
  };

  // Helper: Parse date dari Excel (number atau string)
  const parseDate = (val: any): string | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val.toISOString().split('T')[0];
    if (typeof val === 'number') {
      // Excel serial date
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + val * 86400000);
      return d.toISOString().split('T')[0];
    }
    return String(val).trim() || undefined;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportError('');
    setImportDone(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Auto-detect: cari baris header (ada kolom "Nama" atau "No")
        // Sheet mungkin punya 3-4 baris judul sebelum data
        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
        
        // Coba format standar dulu (header di baris pertama)
        let rows = rawRows;
        
        // Jika header utama bukan kolom data, coba skip baris awal (format ranting.xlsx)
        const isRantingFormat = rawRows.length > 0 && (
          rawRows[0]['No'] !== undefined || rawRows[0]['Kode Ranting'] !== undefined
        );

        if (!isRantingFormat) {
          // Coba baca dengan skipRows untuk menghindari baris judul
          const rawAll: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
          // Cari index baris yang mengandung 'Nama'
          const headerRowIndex = rawAll.findIndex(r => 
            r.some(cell => String(cell).toLowerCase() === 'nama')
          );
          if (headerRowIndex >= 0) {
            const headers = rawAll[headerRowIndex] as string[];
            rows = rawAll.slice(headerRowIndex + 1).map(r => {
              const obj: any = {};
              headers.forEach((h, i) => { obj[h] = r[i] ?? ''; });
              return obj;
            }).filter(r => r['Nama'] || r['nama']);
          }
        }

        if (rows.length === 0) {
          setImportError('File kosong atau format tidak sesuai.');
          return;
        }

        // Validate each row
        const parsed: ImportRow[] = rows
          .filter((row: any) => {
            const name = row['Nama'] || row['nama'] || row['full_name'] || '';
            return String(name).trim() !== '';
          })
          .map((row: any) => {
            const name = String(row['Nama'] || row['nama'] || row['full_name'] || '').trim();
            const rawKelas = row['Kelas'] || row['kelas'] || row['class_name'] || '';
            const kelas = normalizeKelas(rawKelas);
            const tingkat = String(row['Tingkat'] || row['tingkat'] || '').trim();
            const gender = String(row['L/P'] || row['JK'] || row['jk'] || 'L').trim().toUpperCase();
            const fatherName = String(row['Nama Ayah'] || row['nama_ayah'] || '').trim();
            const branchCode = String(row['Kode Ranting'] || row['kode_ranting'] || '').trim().toUpperCase();
            const branchName = String(row['Nama Ranting'] || row['nama_ranting'] || '').trim();
            const birthPlace = String(row['Tempat Lahir'] || row['tempat_lahir'] || '').trim();
            const birthDateRaw = row['Tanggal Lahir'] || row['tanggal_lahir'];
            const birthDate = parseDate(birthDateRaw);
            const room = String(row['Ruangan'] || row['Ruang'] || row['Halaqoh'] || row['ruangan'] || '').trim();

            if (!name) return { full_name: name, status: 'error', error: 'Nama kosong' };
            if (!kelas) return { full_name: name, status: 'error', error: 'Kelas kosong' };

            // Cari kelas yang cocok berdasarkan: nama kelas = kelas, dan nama tingkat = level name
            let foundClass = classes.find(c => {
              const nameMatch = c.name.toLowerCase() === kelas.toLowerCase();
              if (!tingkat) return nameMatch;
              const level = levels.find(l => l.id === c.level_id);
              const levelMatch = level?.name?.toLowerCase().includes(tingkat.toLowerCase()) ||
                level?.name?.toLowerCase() === tingkat.toLowerCase();
              return nameMatch && levelMatch;
            });

            // Jika tidak ketemu dengan tingkat, coba tanpa filter tingkat
            if (!foundClass) {
              foundClass = classes.find(c => c.name.toLowerCase() === kelas.toLowerCase());
            }

            // Cari ranting
            let foundRanting = rantings.find(r => r.code === branchCode);
            const rantingId = foundRanting?.id ?? null;

            // Auto-generate NIS dari kode ranting + nomor urut jika kosong
            const rawNis = String(row['NIS'] || row['nis'] || row['ID'] || '').trim();
            const nis = rawNis || undefined; // biarkan undefined, bisa di-generate saat import

            if (!foundClass) {
              return {
                full_name: name,
                class_name: kelas,
                tingkat,
                status: 'error',
                error: `Kelas "${kelas}" (${tingkat}) belum ada di sistem — buat dulu di menu Kelas`,
                branch_code: branchCode,
                branch_name: branchName,
              };
            }

            return {
              full_name: name,
              nis,
              gender: gender === 'P' ? 'P' : 'L',
              father_name: fatherName,
              birth_place: birthPlace,
              birth_date: birthDate,
              branch_code: branchCode,
              branch_name: branchName,
              class_name: kelas,
              tingkat,
              class_id: foundClass.id,
              ranting_id: rantingId,
              room,
              status: 'valid',
            };
          });

        setImportRows(parsed);
        setShowImportModal(true);
      } catch (err) {
        console.error('Import error:', err);
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
    setImportError('');
    try {
      // Step 1: Auto-create rantings yang belum ada
      const newRantingCodes = [...new Set(
        validRows
          .filter(r => r.branch_code && r.ranting_id == null)
          .map(r => ({ code: r.branch_code!, name: r.branch_name || r.branch_code! }))
      )];
      
      if (newRantingCodes.length > 0) {
        // Deduplicate by code
        const unique = newRantingCodes.filter((r, i, arr) => arr.findIndex(x => x.code === r.code) === i);
        const { data: newRantings } = await supabase
          .from('rantings')
          .upsert(unique, { onConflict: 'code' })
          .select();
        
        if (newRantings) {
          // Update ranting_id di rows yang baru dibuat
          newRantings.forEach(nr => {
            validRows.forEach(row => {
              if (row.branch_code === nr.code) row.ranting_id = nr.id;
            });
          });
        }
      }

      // Step 2: Insert santri
      let sisaCursor = 1;
      const toInsert = validRows.map(r => {
        const generatedNis = r.nis || `${r.branch_code || 'MIQ'}-${String(sisaCursor++).padStart(3, '0')}`;
        return {
          nis: generatedNis,
          full_name: r.full_name,
          gender: r.gender,
          father_name: r.father_name,
          birth_place: r.birth_place,
          birth_date: r.birth_date || null,
          branch_code: r.branch_code,
          branch_name: r.branch_name,
          ranting_id: r.ranting_id ?? null,
          class_id: r.class_id,
          room: r.room || null,
          active: true,
        };
      });

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error } = await supabase.from('students').insert(batch);
        if (error) throw error;
      }

      setImportDone(true);
      toast.success(`${validRows.length} santri berhasil diimport!`);
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
      { 'No': 1, 'Kode Ranting': 'A-001', 'Nama Ranting': 'PPMU. PANYEPPEN PUTRA', 'NIS': '', 'Nama': 'Ahmad Fulan', 'L/P': 'L', 'Tempat Lahir': 'Sampang', 'Tanggal Lahir': '2010-01-15', 'Nama Ayah': 'Budi', 'Kelas': '4', 'Tingkat': 'ULA' },
      { 'No': 2, 'Kode Ranting': 'A-001', 'Nama Ranting': 'PPMU. PANYEPPEN PUTRA', 'NIS': '', 'Nama': 'Hasan Ali', 'L/P': 'L', 'Tempat Lahir': 'Pamekasan', 'Tanggal Lahir': '2009-06-20', 'Nama Ayah': 'Ali', 'Kelas': '4', 'Tingkat': 'ULA' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Santri_MIQ.xlsx');
  };

  const handleExportData = () => {
    const exportData = filteredStudents.map(s => ({
      'NIS': s.nis || '-',
      'Nama Santri': s.full_name,
      'L/P': s.gender || '-',
      'Nama Ayah': s.father_name || '-',
      'Kode Ranting': s.branch_code || '-',
      'Nama Ranting': s.branch_name || '-',
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

  const handleExportCards = async () => {
    if (filteredStudents.length === 0) {
      toast.error('Tidak ada santri untuk dicetak');
      return;
    }
    
    const toastId = toast.loading('Membuat PDF Kartu Ujian...');
    try {
      const doc = new jsPDF();
      
      const cardWidth = 85;
      const cardHeight = 55;
      const startX = 20;
      const startY = 20;
      const xMargin = 5;
      const yMargin = 5;
      
      let currentX = startX;
      let currentY = startY;
      
      for (let i = 0; i < filteredStudents.length; i++) {
        const s = filteredStudents[i];
        
        // Cek halaman baru jika tidak muat (4 baris x 2 kolom)
        if (i > 0 && i % 8 === 0) {
          doc.addPage();
          currentX = startX;
          currentY = startY;
        } else if (i > 0 && i % 2 === 0) {
          currentX = startX;
          currentY += cardHeight + yMargin;
        } else if (i > 0) {
          currentX += cardWidth + xMargin;
        }
        
        // Gambar kotak kartu
        doc.setDrawColor(0);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 3, 3, 'FD');
        
        // Teks Kartu Ujian
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 120, 87); // Primary green
        doc.text('KARTU UJIAN MIQ', currentX + 5, currentY + 10);
        
        // Garis pemisah
        doc.setDrawColor(4, 120, 87);
        doc.setLineWidth(0.5);
        doc.line(currentX + 5, currentY + 12, currentX + cardWidth - 5, currentY + 12);
        
        // Nama dan Kelas
        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.text(`Nama : ${s.full_name.length > 20 ? s.full_name.substring(0,20)+'...' : s.full_name}`, currentX + 5, currentY + 20);
        doc.text(`NIS  : ${s.nis || '-'}`, currentX + 5, currentY + 26);
        doc.text(`Kelas: ${s.class?.name || '-'}`, currentX + 5, currentY + 32);
        doc.text(`Rtg  : ${s.branch_name || '-'}`, currentX + 5, currentY + 38);
        
        // Generate QR Code untuk student nis (atau fallback id)
        const qrDataUrl = await QRCode.toDataURL(s.nis || s.id.toString(), { margin: 1, width: 60 });
        doc.addImage(qrDataUrl, 'PNG', currentX + cardWidth - 30, currentY + 15, 25, 25);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Gunakan QR ini untuk', currentX + cardWidth - 32, currentY + 44);
        doc.text('scan absensi ujian', currentX + cardWidth - 32, currentY + 48);
      }
      
      doc.save(`Kartu_Ujian_MIQ.pdf`);
      toast.success('Kartu ujian berhasil diunduh', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Gagal membuat kartu ujian', { id: toastId });
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (studentForm.id === 0) {
        // Create
        const { error } = await supabase.from('students').insert({
          nis: studentForm.nis,
          full_name: studentForm.full_name,
          gender: studentForm.gender,
          father_name: studentForm.father_name,
          branch_code: studentForm.branch_code,
          branch_name: studentForm.branch_name,
          class_id: studentForm.class_id,
          active: studentForm.active
        });
        if (error) throw error;
      } else {
        // Update
        const { error } = await supabase.from('students').update({
          nis: studentForm.nis,
          full_name: studentForm.full_name,
          gender: studentForm.gender,
          father_name: studentForm.father_name,
          branch_code: studentForm.branch_code,
          branch_name: studentForm.branch_name,
          class_id: studentForm.class_id,
          active: studentForm.active
        }).eq('id', studentForm.id);
        if (error) throw error;
      }
      toast.success('Data santri berhasil disimpan');
      setShowStudentModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(`Gagal menyimpan santri: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openStudentModal = (student?: StudentData) => {
    if (student) {
      setStudentForm({
        id: student.id,
        nis: student.nis || '',
        full_name: student.full_name,
        gender: student.gender || 'L',
        father_name: student.father_name || '',
        branch_code: student.branch_code || '',
        branch_name: student.branch_name || '',
        class_id: student.class_id,
        active: student.active
      });
    } else {
      setStudentForm({
        id: 0,
        nis: '',
        full_name: '',
        gender: 'L',
        father_name: '',
        branch_code: '',
        branch_name: '',
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
      toast.error(`Gagal menghapus santri: ${err.message}`);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      // Langkah 1: Hapus semua detail nilai
      await supabase.from('score_details').delete().neq('id', 0);
      // Langkah 2: Hapus semua nilai
      await supabase.from('scores').delete().neq('id', 0);
      // Langkah 3: Hapus semua santri
      const { error } = await supabase.from('students').delete().neq('id', 0);
      if (error) throw error;
      
      toast.success('Berhasil menghapus seluruh data santri dan nilainya.');
      setShowDeleteAllModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Delete all error:', err);
      toast.error(`Gagal menghapus data: ${err.message}`);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.nis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.branch_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.class?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const studentLevelId = (s.class as any)?.level?.id?.toString() || '';
    const matchesLevel = filterLevel === 'all' || studentLevelId === filterLevel;

    const studentClassId = s.class_id?.toString() || '';
    const matchesClass = filterClass === 'all' || studentClassId === filterClass;

    return matchesSearch && matchesLevel && matchesClass;
  });

  const handleDownloadTemplate = () => {
    const headers = [
      'NIS',
      'Nama',
      'L/P',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Nama Ayah',
      'Kode Ranting',
      'Nama Ranting',
      'Tingkat',
      'Kelas',
      'Ruangan'
    ];
    const example = [
      '123456',
      'Ahmad Fulan',
      'L',
      'Jakarta',
      '2010-01-01',
      'Fulan',
      'RTG-01',
      'Ranting Pusat',
      'ULA',
      'Kelas 1',
      'Ruang A'
    ];
    const csvContent = headers.join(',') + '\n' + example.join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Template_Import_Santri.csv';
    link.click();
  };

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
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            <FileDown size={18} />
            Template
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
            onClick={handleExportCards}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            <FileDown size={18} className="text-red-600" />
            Cetak Kartu Ujian
          </button>
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
                <th className="p-4 font-medium">NIS</th>
                <th className="p-4 font-medium">Nama Santri</th>
                <th className="p-4 font-medium">L/P</th>
                <th className="p-4 font-medium">Ranting</th>
                <th className="p-4 font-medium">Kelas</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600">{student.nis || '-'}</td>
                    <td className="p-4 font-medium text-gray-900">
                      <div>{student.full_name}</div>
                      {student.father_name && <div className="text-xs text-gray-500 font-normal mt-0.5">Ayah: {student.father_name}</div>}
                    </td>
                    <td className="p-4 text-gray-600">{student.gender || '-'}</td>
                    <td className="p-4 text-gray-600">{student.branch_name || '-'}</td>
                    <td className="p-4 text-gray-600">
                      <div>{student.class?.name || '-'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{(student.class as any)?.level?.name || '-'}</div>
                    </td>
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
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Tidak ada santri yang ditemukan.</td></tr>
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
            <form onSubmit={handleSaveStudent} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
                  <input 
                    type="text" required 
                    placeholder="Nomor Induk Santri"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={studentForm.nis}
                    onChange={(e) => setStudentForm(p => ({ ...p, nis: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm(p => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ayah</label>
                  <input 
                    type="text"
                    placeholder="Nama ayah santri (Opsional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={studentForm.father_name}
                    onChange={(e) => setStudentForm(p => ({ ...p, father_name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Ranting</label>
                  <input 
                    type="text"
                    placeholder="Misal: R01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={studentForm.branch_code}
                    onChange={(e) => setStudentForm(p => ({ ...p, branch_code: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ranting</label>
                  <input 
                    type="text"
                    placeholder="Misal: Ranting Pusat"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    value={studentForm.branch_name}
                    onChange={(e) => setStudentForm(p => ({ ...p, branch_name: e.target.value }))}
                  />
                </div>

                <div className="sm:col-span-2">
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
              </div>

              <div className="flex items-center gap-2 mt-4">
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

      {/* Modal Hapus Semua */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Seluruh Santri?</h3>
              <p className="text-gray-500 mb-6">
                Anda yakin ingin menghapus <strong>seluruh data santri</strong>? Tindakan ini tidak dapat dibatalkan dan akan <strong>menghapus semua nilai</strong> yang terkait.
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

    </div>
  );
}
