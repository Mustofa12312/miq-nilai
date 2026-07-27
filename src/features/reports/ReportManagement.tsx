import { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, FileDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  id: number;
  total_score: number;
  grade: string;
  locked: boolean;
  created_at: string;
  student: { full_name: string; class: { name: string; level: { name: string } } };
  session: { examiner: { full_name: string }, period: { name: string } };
  details: { errors: number; criteria: { name: string } }[];
}

export default function ReportManagement() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [selectedLevel, setSelectedLevel] = useState('Semua Tingkatan');

  const [classes, setClasses] = useState<{name: string, level: {name: string}}[]>([]);
  const [levels, setLevels] = useState<{name: string}[]>([]);

  const fetchData = async () => {
    try {
      const [reportsRes, classesRes, levelsRes] = await Promise.all([
        supabase
          .from('scores')
          .select(`
            id,
            total_score,
            grade,
            locked,
            created_at,
            student:students (
              full_name,
              class:classes (
                name,
                level:levels (name)
              )
            ),
            session:score_sessions (
              period:exam_periods (name),
              examiner:profiles (full_name)
            ),
            details:score_details (
              errors,
              criteria:exam_criteria (name)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('classes').select('name, level:levels(name)').order('name'),
        supabase.from('levels').select('name').order('sort_order')
      ]);

      if (reportsRes.error) throw reportsRes.error;
      if (reportsRes.data) setReports(reportsRes.data as any);
      if (classesRes.data) setClasses(classesRes.data as any);
      if (levelsRes.data) setLevels(levelsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cascading dropdown logic: when level changes, reset class
  useEffect(() => {
    setSelectedClass('Semua Kelas');
  }, [selectedLevel]);

  const uniqueLevels = levels.map(l => l.name);
  const filteredClassesList = selectedLevel === 'Semua Tingkatan' 
    ? classes 
    : classes.filter(c => c.level?.name === selectedLevel);
  const uniqueClasses = filteredClassesList.map(c => c.name);

  const filteredReports = reports.filter(r => {
    const matchSearch = r.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = selectedClass === 'Semua Kelas' || r.student?.class?.name === selectedClass;
    const matchLevel = selectedLevel === 'Semua Tingkatan' || r.student?.class?.level?.name === selectedLevel;
    return matchSearch && matchClass && matchLevel;
  });

  const handleExportExcel = () => {
    if (filteredReports.length === 0) return alert('Tidak ada data untuk diexport');
    
    const exportData = filteredReports.map(r => {
      const baseRow: any = {
        'Nama Santri': r.student?.full_name,
        'Tingkatan': r.student?.class?.level?.name,
        'Kelas': r.student?.class?.name,
      };

      // Tambahkan kolom kesalahan berdasarkan kriteria
      if (r.details && r.details.length > 0) {
        r.details.forEach(d => {
          if (d.criteria?.name) {
            baseRow[`Salah ${d.criteria.name}`] = d.errors;
          }
        });
      }

      baseRow['Total Nilai'] = r.total_score;
      baseRow['Predikat'] = r.grade;
      baseRow['Penguji'] = r.session?.examiner?.full_name;
      baseRow['Periode'] = r.session?.period?.name;
      baseRow['Tanggal'] = new Date(r.created_at).toLocaleDateString('id-ID');
      baseRow['Status'] = r.locked ? 'Terkunci' : 'Terbuka';

      return baseRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Nilai');
    
    XLSX.writeFile(workbook, `Laporan_Nilai_MIQ_${new Date().getTime()}.xlsx`);
  };

  const handleExportPDF = () => {
    if (filteredReports.length === 0) return alert('Tidak ada data untuk diexport');

    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Laporan Penilaian MIQ', 14, 15);
    doc.setFontSize(10);
    doc.text(`Tingkatan: ${selectedLevel} | Kelas: ${selectedClass}`, 14, 22);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);

    const tableData = filteredReports.map((r, index) => [
      index + 1,
      r.student?.full_name,
      `${r.student?.class?.name} (${r.student?.class?.level?.name})`,
      r.total_score,
      r.grade,
      r.session?.examiner?.full_name
    ]);

    autoTable(doc, {
      head: [['No', 'Nama Santri', 'Kelas', 'Total Nilai', 'Predikat', 'Penguji']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [4, 120, 87] } // Primary green
    });

    doc.save(`Laporan_Nilai_MIQ_${new Date().getTime()}.pdf`);
  };

  const handleToggleLock = async (id: number, currentLockedStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('scores')
        .update({ locked: !currentLockedStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error toggling lock:', err);
      alert('Gagal mengunci/membuka nilai');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Penilaian</h2>
          <p className="text-gray-500">Lihat hasil akhir penilaian santri dari seluruh penguji.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            <FileSpreadsheet size={18} className="text-green-600" />
            Export Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            <FileDown size={18} className="text-red-600" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama santri..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-700 min-w-[160px]"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="Semua Tingkatan">Semua Tingkatan</option>
            {uniqueLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-700 min-w-[140px]"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="Semua Kelas">Semua Kelas</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Santri</th>
                <th className="p-4 font-medium">Kelas</th>
                <th className="p-4 font-medium text-center">Total Nilai</th>
                <th className="p-4 font-medium text-center">Predikat</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium">Penguji</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Memuat laporan...</td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{report.student?.full_name}</td>
                    <td className="p-4 text-gray-600">
                      {report.student?.class?.name} <span className="text-xs text-gray-400">({report.student?.class?.level?.name})</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-lg text-primary">{report.total_score}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${report.grade === 'Mumtaz' ? 'bg-primary text-white' : 
                          report.grade === 'Jayyid Jiddan' ? 'bg-emerald-100 text-emerald-800' : 
                          report.grade === 'Jayyid' ? 'bg-blue-100 text-blue-800' : 
                          'bg-warning text-yellow-900'}`}>
                        {report.grade}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${report.locked ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                        {report.locked ? 'Terkunci' : 'Terbuka'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {report.session?.examiner?.full_name || 'Ust. Ahmad'}
                    </td>
                    <td className="p-4 text-right">
                       <button 
                         onClick={() => handleToggleLock(report.id, report.locked)}
                         className={`text-xs font-medium px-3 py-1 rounded-full transition-colors
                           ${report.locked ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                       >
                         {report.locked ? 'Buka Kunci' : 'Kunci Nilai'}
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Tidak ada laporan penilaian yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
