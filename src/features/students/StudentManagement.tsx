import { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Upload, FileSpreadsheet, X, CheckCircle,
  AlertCircle, Loader2, Download, FileDown, Trash2,
  Edit2, ChevronLeft, ChevronRight, Building2, BookOpen
} from 'lucide-react';
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
  tingkat?: string;
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLevel, filterClass]);

  // -- IMPORT LOGIC --
  const normalizeKelas = (val: any): string => {
    const s = String(val).trim();
    const romanMap: Record<string, string> = { I: '1', II: '2', III: '3', IV: '4', V: '5', VI: '6', VII: '7' };
    const upper = s.toUpperCase().trim();
    if (romanMap[upper]) return romanMap[upper];
    return s;
  };

  const parseDate = (val: any): string | undefined => {
    if (!val) return undefined;

    if (val instanceof Date) {
      if (isNaN(val.getTime())) return undefined;
      const d = new Date(val.getTime() + 12 * 3600 * 1000);
      return d.toISOString().split('T')[0];
    }

    const str = String(val).trim();
    if (!str) return undefined;

    if (/^\d+(\.\d+)?$/.test(str)) {
      const num = Number(str);
      if (num >= 1900 && num <= 2100 && /^\d{4}$/.test(str)) {
        return `${num}-01-01`;
      }
      if (num >= 1000 && num <= 80000) {
        try {
          const p = XLSX.SSF.parse_date_code(num);
          if (p && p.y && p.m && p.d) {
            return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
          }
        } catch {}
      }
    }

    const months: Record<string, string> = {
      januari: '01', jan: '01', january: '01',
      februari: '02', feb: '02', february: '02',
      maret: '03', mar: '03', march: '03',
      april: '04', apr: '04',
      mei: '05', may: '05',
      juni: '06', jun: '06', june: '06',
      juli: '07', jul: '07', july: '07',
      agustus: '08', agu: '08', agus: '08', august: '08',
      september: '09', sep: '09', sept: '09',
      oktober: '10', okt: '10', october: '10',
      november: '11', nov: '11',
      desember: '12', des: '12', december: '12'
    };

    const textDateMatch = str.match(/^(\d{1,2})[\s\-]+([a-zA-Z]+)[\s\-]+(\d{4})$/);
    if (textDateMatch) {
      const day = textDateMatch[1].padStart(2, '0');
      const monName = textDateMatch[2].toLowerCase();
      const year = textDateMatch[3];
      if (months[monName]) {
        return `${year}-${months[monName]}-${day}`;
      }
    }

    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }

    const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return undefined;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError('');
    setImportDone(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawData.length === 0) {
          setImportError('File kosong atau format tidak sesuai.');
          setImportLoading(false);
          return;
        }

        const classMap = new Map(classes.map(c => [c.name.toLowerCase().trim(), c.id]));
        const rantingMap = new Map(rantings.map(r => [r.code.toLowerCase().trim(), r.id]));

        const rows: ImportRow[] = rawData.map((row) => {
          const findKey = (candidates: string[]) => {
            const found = Object.keys(row).find(k =>
              candidates.includes(k.toLowerCase().trim().replace(/[\s_\.]/g, ''))
            );
            return found ? String(row[found]).trim() : '';
          };

          const rawNo = findKey(['no', 'nomor']);
          const rawNis = findKey(['nis', 'noinduk', 'nomorinduk', 'nisn']);
          const rawName = findKey(['nama', 'namasantri', 'namalengkap', 'fullname', 'name']);
          const rawGender = findKey(['lp', 'jk', 'jeniskelamin', 'gender', 'sex']).toUpperCase();
          const rawFather = findKey(['namaayah', 'ayah', 'bapak', 'walisantri', 'wali', 'fathername', 'father']);
          const rawBranchCode = findKey(['koderanting', 'kodecabang', 'branchcode', 'kd_ranting']);
          const rawBranchName = findKey(['namaranting', 'ranting', 'cabang', 'branchname', 'branch', 'subbranch']);
          const rawBirthPlace = findKey(['tempatlahir', 'tmplahir', 'birthplace']);
          const rawBirthDate = findKey(['tanggallahir', 'tgllahir', 'birthdate']);
          const rawKelas = findKey(['kelas', 'kls', 'class', 'classname']);
          const rawTingkat = findKey(['tingkat', 'tingkatan', 'jenjang', 'level']).toUpperCase();
          const rawRoom = findKey(['ruang', 'ruangan', 'room']);

          let gender: 'L' | 'P' = 'L';
          if (rawGender === 'P' || rawGender.startsWith('PEREMPUAN') || rawGender.startsWith('WANITA')) {
            gender = 'P';
          }

          let classId: number | undefined;
          let matchedClassName = rawKelas;

          if (rawKelas) {
            const normKelas = normalizeKelas(rawKelas);
            const tryKeys = [
              `${normKelas} ${rawTingkat}`.toLowerCase().trim(),
              `${rawTingkat} ${normKelas}`.toLowerCase().trim(),
              normKelas.toLowerCase().trim(),
              rawKelas.toLowerCase().trim(),
            ];
            for (const key of tryKeys) {
              if (classMap.has(key)) {
                classId = classMap.get(key);
                matchedClassName = key.toUpperCase();
                break;
              }
            }
          }

          let rantingId: number | null = null;
          if (rawBranchCode && rantingMap.has(rawBranchCode.toLowerCase())) {
            rantingId = rantingMap.get(rawBranchCode.toLowerCase()) || null;
          }

          let errorMsg = '';
          if (!rawName) errorMsg = 'Nama wajib diisi.';
          else if (!classId) errorMsg = `Kelas "${rawKelas || 'kosong'}" tidak ditemukan.`;

          return {
            no: rawNo ? parseInt(rawNo) : undefined,
            nis: rawNis,
            full_name: rawName,
            gender,
            father_name: rawFather,
            branch_code: rawBranchCode,
            branch_name: rawBranchName,
            birth_place: rawBirthPlace,
            birth_date: parseDate(rawBirthDate),
            class_name: matchedClassName,
            tingkat: rawTingkat,
            class_id: classId,
            ranting_id: rantingId,
            room: rawRoom,
            status: errorMsg ? 'error' : 'valid',
            error: errorMsg,
          };
        });

        setImportRows(rows);
        setShowImportModal(true);
      } catch (err: any) {
        setImportError(`Gagal membaca file: ${err.message}`);
      } finally {
        setImportLoading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validRows = importRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) return;

    setImportLoading(true);
    setImportError('');
    try {
      const newRantingsMap = new Map<string, string>();
      validRows.forEach(r => {
        if (r.branch_code && !r.ranting_id && !newRantingsMap.has(r.branch_code)) {
          newRantingsMap.set(r.branch_code, r.branch_name || r.branch_code);
        }
      });

      if (newRantingsMap.size > 0) {
        const toInsertRanting = Array.from(newRantingsMap.entries()).map(([code, name]) => ({
          code,
          name,
        }));
        const { data: insertedRantings, error: rantingErr } = await supabase
          .from('rantings')
          .insert(toInsertRanting)
          .select('id, code');

        if (!rantingErr && insertedRantings) {
          insertedRantings.forEach(nr => {
            validRows.forEach(row => {
              if (row.branch_code === nr.code) row.ranting_id = nr.id;
            });
          });
        }
      }

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
      { 'No': 1, 'Kode Ranting': 'A-001', 'Nama Ranting': 'PPMU. PANYEPPEN PUTRA', 'NIS': '', 'Nama': 'Ahmad Fulan', 'L/P': 'L', 'Tempat Lahir': 'Sampang', 'Tanggal Lahir': '2010-01-15', 'Nama Ayah': 'Budi', 'Kelas': '4', 'Tingkat': 'ULA', 'Ruangan': 'Ruang 1' },
      { 'No': 2, 'Kode Ranting': 'A-001', 'Nama Ranting': 'PPMU. PANYEPPEN PUTRA', 'NIS': '', 'Nama': 'Hasan Ali', 'L/P': 'L', 'Tempat Lahir': 'Pamekasan', 'Tanggal Lahir': '2009-06-20', 'Nama Ayah': 'Ali', 'Kelas': '4', 'Tingkat': 'ULA', 'Ruangan': 'Ruang 1' },
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

    if (exportData.length === 0) {
      toast.error('Tidak ada data santri untuk diexport');
      return;
    }

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

        doc.setDrawColor(0);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 120, 87);
        doc.text('KARTU UJIAN MIQ', currentX + 5, currentY + 10);

        doc.setDrawColor(4, 120, 87);
        doc.setLineWidth(0.5);
        doc.line(currentX + 5, currentY + 12, currentX + cardWidth - 5, currentY + 12);

        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.text(`Nama : ${s.full_name.length > 20 ? s.full_name.substring(0, 20) + '...' : s.full_name}`, currentX + 5, currentY + 20);
        doc.text(`NIS  : ${s.nis || '-'}`, currentX + 5, currentY + 26);
        doc.text(`Kelas: ${s.class?.name || '-'}`, currentX + 5, currentY + 32);
        doc.text(`Rtg  : ${s.branch_name || '-'}`, currentX + 5, currentY + 38);

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
      const { data: scoresData } = await supabase
        .from('scores')
        .select('id')
        .eq('student_id', studentId);

      if (scoresData && scoresData.length > 0) {
        const scoreIds = scoresData.map(s => s.id);
        const { error: detailErr } = await supabase
          .from('score_details')
          .delete()
          .in('score_id', scoreIds);
        if (detailErr) throw detailErr;

        const { error: scoreErr } = await supabase
          .from('scores')
          .delete()
          .eq('student_id', studentId);
        if (scoreErr) throw scoreErr;
      }

      const { error: studentErr } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);
      if (studentErr) throw studentErr;

      fetchData();
      toast.success(`Santri "${studentName}" berhasil dihapus`);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(`Gagal menghapus santri: ${err.message}`);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await supabase.from('score_details').delete().neq('id', 0);
      await supabase.from('scores').delete().neq('id', 0);
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

  // Paginated students
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  const validCount = importRows.filter(r => r.status === 'valid').length;
  const errorCount = importRows.filter(r => r.status === 'error').length;

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 sm:space-y-6 text-left">
      {/* Header & Action Buttons */}
      <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-4" data-purpose="page-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Santri</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data santri, kelas, dan status keaktifan.
          </p>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2" data-purpose="action-buttons">
          {/* Export Button */}
          <button
            onClick={handleExportData}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-apple-card hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export</span>
          </button>

          {/* Template Button */}
          <button
            onClick={handleDownloadTemplate}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-apple-card hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
          >
            <FileDown size={14} className="text-slate-500" />
            <span>Template</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => fileRef.current?.click()}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-apple-card hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Upload size={14} className="text-slate-500" />
            <span>Import</span>
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

          {/* Hapus Semua Button */}
          <button
            onClick={() => setShowDeleteAllModal(true)}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-rose-600 bg-white border border-rose-200/80 rounded-xl shadow-apple-card hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Trash2 size={14} className="text-rose-500" />
            <span>Hapus Semua</span>
          </button>

          {/* Cetak Kartu Ujian Button */}
          <button
            onClick={handleExportCards}
            type="button"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-apple-card hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
          >
            <FileDown size={14} className="text-rose-500" />
            <span>Cetak Kartu Ujian</span>
          </button>

          {/* Primary Tambah Button */}
          <button
            onClick={() => openStudentModal()}
            type="button"
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-apple-glow transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tambah</span>
          </button>
        </div>
      </section>

      {/* Filter & Search Toolbar Card */}
      <section
        className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-apple-card flex flex-col md:flex-row items-center gap-3"
        data-purpose="table-filters"
      >
        {/* Inset Apple Search Bar */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            placeholder="Cari nama santri atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdown: Semua Tingkatan */}
        <div className="w-full md:w-56 shrink-0">
          <div className="relative">
            <select
              className="w-full appearance-none bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium py-2 px-3.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
              value={filterLevel}
              onChange={(e) => { setFilterLevel(e.target.value); setFilterClass('all'); }}
            >
              <option value="all">Semua Tingkatan</option>
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Filter Dropdown: Semua Kelas */}
        <div className="w-full md:w-52 shrink-0">
          <div className="relative">
            <select
              className="w-full appearance-none bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium py-2 px-3.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
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
            <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>
      </section>

      {/* BEGIN: Desktop Table View (hidden on mobile, visible md+) */}
      <section className="hidden md:block bg-white rounded-2xl border border-slate-200/70 shadow-apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="santri-data-table">
            <thead>
              <tr className="border-b border-slate-100 bg-[#FAFBFD] text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                <th className="py-3.5 px-6" scope="col">NIS</th>
                <th className="py-3.5 px-6" scope="col">NAMA SANTRI</th>
                <th className="py-3.5 px-6 text-center" scope="col">L/P</th>
                <th className="py-3.5 px-6" scope="col">RANTING</th>
                <th className="py-3.5 px-6 text-center" scope="col">KELAS</th>
                <th className="py-3.5 px-6 text-center" scope="col">STATUS</th>
                <th className="py-3.5 px-6 text-right" scope="col">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-xs text-slate-700 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-brand-600" />
                    <span>Memuat data santri...</span>
                  </td>
                </tr>
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                      {student.nis || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{student.full_name}</div>
                      {student.father_name && (
                        <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                          Ayah: {student.father_name}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-500 font-medium">
                      {student.gender || '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {student.branch_name || '-'}
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="block font-semibold text-slate-800">
                        {student.class?.name || '-'}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                        {(student.class as any)?.level?.name || ''}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      {student.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-200/50">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openStudentModal(student)}
                        className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id, student.full_name)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada santri yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Table Footer: Minimalist Apple Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
          <div>
            Menampilkan <span className="font-semibold text-slate-800">{filteredStudents.length > 0 ? startIndex + 1 : 0}</span> - <span className="font-semibold text-slate-800">{Math.min(startIndex + pageSize, filteredStudents.length)}</span> dari <span className="font-semibold text-slate-800">{filteredStudents.length}</span> santri
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                  className={`w-8 h-8 rounded-lg font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </section>
      {/* END: Desktop Table View */}

      {/* BEGIN: Mobile (HP) Card List View (visible on mobile only, < md) */}
      <section className="block md:hidden space-y-3" data-purpose="mobile-student-cards">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/70 text-center text-slate-400">
            <Loader2 size={24} className="animate-spin mx-auto mb-2 text-brand-600" />
            <p className="text-xs">Memuat data santri...</p>
          </div>
        ) : paginatedStudents.length > 0 ? (
          paginatedStudents.map((student) => (
            <article
              key={student.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-apple-card space-y-3"
            >
              {/* Header: Name, Father, Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-[15px] font-bold text-slate-900 tracking-tight leading-snug truncate">
                    {student.full_name}
                  </h4>
                  {student.father_name && (
                    <p className="text-xs text-slate-400 font-normal mt-0.5">
                      Ayah: {student.father_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-600">
                    {student.gender || 'L'}
                  </span>
                  {student.active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-rose-50 text-rose-600 border border-rose-200/50">
                      Nonaktif
                    </span>
                  )}
                </div>
              </div>

              {/* Info Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-medium">
                  NIS: <strong>{student.nis || '-'}</strong>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100/60 text-brand-700 text-[11px] font-semibold">
                  <BookOpen size={11} />
                  {student.class?.name || '-'} {(student.class as any)?.level?.name ? `(${(student.class as any)?.level?.name})` : ''}
                </span>
                {student.branch_name && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-[11px] truncate max-w-full">
                    <Building2 size={11} />
                    <span className="truncate">{student.branch_name}</span>
                  </span>
                )}
              </div>

              {/* Action Buttons for Mobile */}
              <div className="pt-2 border-t border-slate-100/80 flex items-center gap-2">
                <button
                  onClick={() => openStudentModal(student)}
                  type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50/80 text-blue-600 hover:bg-blue-100 active:scale-95 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Edit Data</span>
                </button>
                <button
                  onClick={() => handleDelete(student.id, student.full_name)}
                  type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50/80 text-rose-600 hover:bg-rose-100 active:scale-95 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Hapus</span>
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/70 text-center text-slate-400 text-xs">
            Tidak ada santri yang ditemukan.
          </div>
        )}

        {/* Mobile Pagination Footer */}
        {filteredStudents.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-apple-card flex items-center justify-between text-xs text-slate-500">
            <span>
              {startIndex + 1}-{Math.min(startIndex + pageSize, filteredStudents.length)} dari {filteredStudents.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-semibold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
      {/* END: Mobile Card List View */}

      {/* BEGIN: Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200/80 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Preview Import Santri</h3>
                  <p className="text-xs text-slate-500">
                    <span className="text-emerald-600 font-semibold">{validCount} valid</span>
                    {errorCount > 0 && <span className="text-rose-500 font-semibold"> • {errorCount} error</span>}
                    {' '}dari {importRows.length} baris
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowImportModal(false); setImportRows([]); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 sm:px-6 pt-4 space-y-2.5">
              <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-700">
                💡 Format kolom Excel: <strong>Nama</strong> dan <strong>Kelas</strong> (contoh: 4, 4 ULA, 1 WUSTHA).
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold cursor-pointer"
              >
                <FileDown size={14} />
                <span>Download Contoh File Excel (Template)</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 sm:p-6">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
                    <th className="p-3 text-left">Nama</th>
                    <th className="p-3 text-left">Kelas</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importRows.map((row, i) => (
                    <tr key={i} className={row.status === 'error' ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'}>
                      <td className="p-3 font-medium text-slate-800">
                        {row.full_name || <span className="text-slate-400 italic">kosong</span>}
                      </td>
                      <td className="p-3 text-slate-600">{row.class_name || '-'}</td>
                      <td className="p-3">
                        {row.status === 'valid' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle size={13} /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                            <AlertCircle size={13} /> {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
              {importError && <p className="text-xs text-rose-500 flex-1">{importError}</p>}
              {importDone && <p className="text-xs text-emerald-600 font-bold flex-1">✅ {validCount} santri berhasil diimport!</p>}
              {!importDone && !importError && <div className="flex-1" />}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => { setShowImportModal(false); setImportRows([]); }}
                  className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0 || importLoading || importDone}
                  className="flex-1 sm:flex-none px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-apple-glow cursor-pointer"
                >
                  {importLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>Import {validCount} Santri</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* END: Import Modal */}

      {/* BEGIN: Add/Edit Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#FAFBFD]">
              <h3 className="font-bold text-slate-900 text-base">
                {studentForm.id === 0 ? 'Tambah Santri' : 'Edit Santri'}
              </h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama santri"
                    className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    value={studentForm.full_name}
                    onChange={(e) => setStudentForm(p => ({ ...p, full_name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">NIS</label>
                    <input
                      type="text"
                      required
                      placeholder="Nomor Induk"
                      className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      value={studentForm.nis}
                      onChange={(e) => setStudentForm(p => ({ ...p, nis: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      required
                      className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm(p => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ayah (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nama ayah santri"
                    className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    value={studentForm.father_name}
                    onChange={(e) => setStudentForm(p => ({ ...p, father_name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Ranting</label>
                    <input
                      type="text"
                      placeholder="Misal: R01"
                      className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      value={studentForm.branch_code}
                      onChange={(e) => setStudentForm(p => ({ ...p, branch_code: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ranting</label>
                    <input
                      type="text"
                      placeholder="Nama Ranting"
                      className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      value={studentForm.branch_name}
                      onChange={(e) => setStudentForm(p => ({ ...p, branch_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    required
                    className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer"
                    value={studentForm.class_id}
                    onChange={(e) => setStudentForm(p => ({ ...p, class_id: parseInt(e.target.value) }))}
                  >
                    <option value={0} disabled>Pilih Kelas</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({(c as any).level?.name || 'Tanpa Tingkat'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="active-status"
                    checked={studentForm.active}
                    onChange={(e) => setStudentForm(p => ({ ...p, active: e.target.checked }))}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="active-status" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Status Santri Aktif
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 shadow-apple-glow transition-all flex justify-center items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END: Add/Edit Student Modal */}

      {/* BEGIN: Modal Hapus Semua */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200/80 p-6 text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Seluruh Santri?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Anda yakin ingin menghapus <strong>seluruh data santri</strong>? Tindakan ini tidak dapat dibatalkan dan akan <strong>menghapus semua nilai</strong> yang terkait.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-xs hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-sm"
              >
                {isDeletingAll ? <Loader2 size={15} className="animate-spin" /> : 'Ya, Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: Modal Hapus Semua */}
    </div>
  );
}
