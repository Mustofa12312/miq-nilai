import { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReportData {
  id: number;
  total_score: number;
  grade: string;
  created_at: string;
  student: { full_name: string; class: { name: string; level: { name: string } } };
  session: { examiner: { full_name: string }, period: { name: string } };
}

export default function ReportManagement() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [selectedLevel, setSelectedLevel] = useState('Semua Tingkatan');

  const [classes, setClasses] = useState<{name: string}[]>([]);
  const [levels, setLevels] = useState<{name: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, classesRes, levelsRes] = await Promise.all([
          supabase
            .from('scores')
            .select(`
              id,
              total_score,
              grade,
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
              )
            `)
            .order('created_at', { ascending: false }),
          supabase.from('classes').select('name').order('name'),
          supabase.from('levels').select('name').order('sort_order')
        ]);

        if (reportsRes.error) throw reportsRes.error;
        if (reportsRes.data) setReports(reportsRes.data as any);
        if (classesRes.data) setClasses(classesRes.data);
        if (levelsRes.data) setLevels(levelsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const uniqueClasses = classes.map(c => c.name);
  const uniqueLevels = levels.map(l => l.name);

  const filteredReports = reports.filter(r => {
    const matchSearch = r.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = selectedClass === 'Semua Kelas' || r.student?.class?.name === selectedClass;
    const matchLevel = selectedLevel === 'Semua Tingkatan' || r.student?.class?.level?.name === selectedLevel;
    return matchSearch && matchClass && matchLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Penilaian</h2>
          <p className="text-gray-500">Lihat hasil akhir penilaian santri dari seluruh penguji.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            <Download size={18} />
            Export Excel
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
                <th className="p-4 font-medium">Penguji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Memuat laporan...</td>
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
                    <td className="p-4 text-sm text-gray-600">
                      {report.session?.examiner?.full_name || 'Ust. Ahmad'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
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
