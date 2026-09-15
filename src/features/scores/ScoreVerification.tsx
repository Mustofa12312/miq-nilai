import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckSquare, Search, Lock, Unlock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Class, ExamPeriod, ExamType } from '../../types';

interface ScoreVerificationData {
  id: number;
  student_id: number;
  total_score: number;
  grade: string;
  locked: boolean;
  notes: string | null;
  student: {
    full_name: string;
    class: { name: string; level: { name: string } };
  };
  session: {
    examiner: { full_name: string };
  };
}

export default function ScoreVerification() {
  const [scores, setScores] = useState<ScoreVerificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  
  const [selectedPeriod, setSelectedPeriod] = useState<number | ''>('');
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedExamType, setSelectedExamType] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (selectedPeriod && selectedClass && selectedExamType) {
      fetchScores();
    } else {
      setScores([]);
      setLoading(false);
    }
  }, [selectedPeriod, selectedClass, selectedExamType]);

  const fetchFilters = async () => {
    try {
      const [periodsRes, classesRes, examTypesRes] = await Promise.all([
        supabase.from('exam_periods').select('*').order('start_date', { ascending: false }),
        supabase.from('classes').select('*, level:levels(name)').order('name'),
        supabase.from('exam_types').select('*').order('id')
      ]);

      if (periodsRes.data) {
        setPeriods(periodsRes.data);
        const active = periodsRes.data.find(p => p.active);
        if (active) setSelectedPeriod(active.id);
      }
      
      if (classesRes.data) {
        setClasses(classesRes.data as any);
        if (classesRes.data.length > 0) setSelectedClass(classesRes.data[0].id);
      }
      
      if (examTypesRes.data) {
        setExamTypes(examTypesRes.data);
        if (examTypesRes.data.length > 0) setSelectedExamType(examTypesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchScores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          student_id,
          total_score,
          grade,
          locked,
          notes,
          student:students!inner (
            full_name,
            class_id,
            class:classes (
              name,
              level:levels (name)
            )
          ),
          session:score_sessions!inner (
            period_id,
            exam_type_id,
            examiner:profiles (full_name)
          )
        `)
        .eq('session.period_id', selectedPeriod)
        .eq('session.exam_type_id', selectedExamType)
        .eq('student.class_id', selectedClass);

      if (error) throw error;
      setScores(data as any);
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (scoreId: number, currentLocked: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('scores')
        .update({ locked: !currentLocked })
        .eq('id', scoreId);

      if (error) throw error;
      
      // Update state optimistically
      setScores(scores.map(s => s.id === scoreId ? { ...s, locked: !currentLocked } : s));
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Gagal mengubah status verifikasi');
    } finally {
      setIsUpdating(false);
    }
  };

  const lockAllInClass = async () => {
    if (!scores.length) return;
    const confirm = window.confirm('Apakah Anda yakin ingin mengunci semua nilai di kelas ini?');
    if (!confirm) return;

    setIsUpdating(true);
    try {
      const ids = scores.map(s => s.id);
      const { error } = await supabase
        .from('scores')
        .update({ locked: true })
        .in('id', ids);

      if (error) throw error;
      
      setScores(scores.map(s => ({ ...s, locked: true })));
    } catch (error) {
      console.error('Error locking all:', error);
      toast.error('Gagal mengunci semua nilai');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredScores = scores.filter(s => 
    s.student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="text-primary" />
            Verifikasi & Kunci Nilai
          </h1>
          <p className="text-gray-500 mt-1">Periksa dan kunci nilai santri agar tidak dapat diubah oleh penguji.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          >
            <option value="" disabled>Pilih Periode...</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} {p.active ? '(Aktif)' : ''}</option>)}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Ujian</label>
          <select 
            value={selectedExamType} 
            onChange={(e) => setSelectedExamType(Number(e.target.value))}
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          >
            <option value="" disabled>Pilih Jenis Ujian...</option>
            {examTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          >
            <option value="" disabled>Pilih Kelas...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.level?.name} - {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Search and Action */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama santri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        
        <button
          onClick={lockAllInClass}
          disabled={isUpdating || scores.length === 0 || scores.every(s => s.locked)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Lock size={18} />
          Kunci Semua di Kelas Ini
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
             Memuat data nilai...
          </div>
        ) : filteredScores.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
            <AlertCircle size={48} className="text-gray-300 mb-4" />
            <p>Tidak ada data nilai untuk filter yang dipilih.</p>
            <p className="text-sm mt-1">Pastikan penguji sudah menyimpan nilai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Nama Santri</th>
                  <th className="px-6 py-4">Penguji</th>
                  <th className="px-6 py-4 text-center">Total Nilai</th>
                  <th className="px-6 py-4">Predikat</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredScores.map((score) => (
                  <tr key={score.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{score.student.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{score.session?.examiner?.full_name || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-lg text-gray-900">{score.total_score}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        score.grade === 'Mumtaz' ? 'bg-emerald-100 text-emerald-800' :
                        score.grade === 'Jayyid Jiddan' ? 'bg-blue-100 text-blue-800' :
                        score.grade === 'Jayyid' ? 'bg-indigo-100 text-indigo-800' :
                        score.grade === 'Maqbul' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {score.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {score.locked ? (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
                          <Lock size={12} />
                          Terkunci
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                          <Unlock size={12} />
                          Terbuka
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleLock(score.id, score.locked)}
                        disabled={isUpdating}
                        className={`p-2 rounded-lg transition-colors ${
                          score.locked 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={score.locked ? 'Buka Kunci' : 'Kunci Nilai'}
                      >
                        {score.locked ? <Unlock size={20} /> : <Lock size={20} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
