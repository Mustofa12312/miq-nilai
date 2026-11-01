import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Student, Class } from '../../types';
import { fetchClassStudentsData } from '../../services/studentService';

interface StudentWithStatus extends Student {
  status: 'SUDAH' | 'BELUM';
}

export default function StudentList() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const assignmentIdParam = searchParams.get('assignmentId');
  const assignmentId = assignmentIdParam ? Number(assignmentIdParam) : undefined;
  const { user } = useAuth();

  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Simpan context periode dan exam_type untuk diteruskan ke ScoringForm via URL
  const [activePeriodId, setActivePeriodId] = useState<number | null>(null);
  const [defaultExamTypeId, setDefaultExamTypeId] = useState<number | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!classId || !user?.id) return;
      try {
        const data = await fetchClassStudentsData(classId, user.id, assignmentId);
        
        setClassInfo(data.classInfo);
        setActivePeriodId(data.activePeriodId);
        setDefaultExamTypeId(data.defaultExamTypeId);

        if (!data.activePeriodId || !data.hasAssignment) {
          setStudents([]);
          return;
        }

        const mapped: StudentWithStatus[] = data.students.map(s => ({
          ...s,
          status: data.scoredStudentIds.has(s.id) ? 'SUDAH' : 'BELUM'
        }));

        setStudents(mapped);
      } catch (err) {
        console.error('Error fetching students data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classId, user?.id, assignmentId]);

  const total = students.length;
  const scored = students.filter(s => s.status === 'SUDAH').length;
  const progressPercentage = total === 0 ? 0 : Math.round((scored / total) * 100);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => 
      s.full_name.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'S';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Buat URL query string untuk ScoringForm
  const scoringParams = new URLSearchParams();
  if (activePeriodId) scoringParams.set('periodId', String(activePeriodId));
  if (defaultExamTypeId) scoringParams.set('examTypeId', String(defaultExamTypeId));
  if (assignmentId) scoringParams.set('assignmentId', String(assignmentId));
  const paramString = scoringParams.toString() ? `?${scoringParams.toString()}` : '';

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm font-medium">
        Memuat data santri...
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 flex flex-col gap-4 pb-12">
      {/* BEGIN: SectionHeader */}
      <section className="px-1 pt-1" data-purpose="class-context-header">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Kelas {classInfo?.name || '...'}
        </h2>
        <p className="text-sm text-slate-500 font-normal mt-0.5">
          Pilih santri untuk memasukkan penilaian
        </p>
      </section>
      {/* END: SectionHeader */}

      {/* BEGIN: ProgressCard */}
      <section
        className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04),0_2px_6px_-1px_rgba(0,0,0,0.02)] border border-black/[0.03]"
        data-purpose="evaluation-progress-card"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
              <span>Total: {total} Santri</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[13px] font-medium text-neutral-700">
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {scored} Sudah
              </span>
              <span className="text-neutral-300">•</span>
              <span className="inline-flex items-center gap-1 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {total - scored} Belum
              </span>
            </div>
          </div>
          {/* Big Minimal Percentage Display */}
          <div className="text-right">
            <span className={`text-3xl font-bold tracking-tight ${progressPercentage > 0 ? 'text-emerald-600' : 'text-neutral-300'}`}>
              {progressPercentage}
              <span className="text-lg font-medium">%</span>
            </span>
          </div>
        </div>
        {/* Apple-like Progress Bar Line */}
        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mt-4">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </section>
      {/* END: ProgressCard */}

      {/* BEGIN: SearchInput */}
      <div className="relative" data-purpose="student-search">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
          <svg className="w-4 h-4 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </div>
        <input
          className="w-full pl-10 pr-4 py-2.5 bg-white border-0 shadow-[0_1px_3px_rgba(0,0,0,0.03)] rounded-2xl text-[14px] text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
          placeholder="Cari nama santri..."
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {/* END: SearchInput */}

      {/* BEGIN: StudentListSection */}
      <section className="space-y-1.5" data-purpose="students-grouped-list">
        <div className="flex items-center justify-between px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <span>Daftar Nama Santri</span>
          <span className="font-normal lowercase">{filteredStudents.length} anak</span>
        </div>
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04),0_2px_6px_-1px_rgba(0,0,0,0.02)] border border-black/[0.03] overflow-hidden divide-y divide-neutral-100">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              {students.length === 0 ? 'Belum ada santri di kelas ini.' : 'Tidak ditemukan santri dengan nama tersebut.'}
            </div>
          ) : (
            filteredStudents.map((student, index) => (
              <button
                key={student.id}
                onClick={() => navigate(`/examiner/class/${classId}/student/${student.id}${paramString}`)}
                className="w-full text-left group flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50/80 active:bg-neutral-100 transition-colors cursor-pointer"
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-700 uppercase shrink-0">
                    {getInitials(student.full_name)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-neutral-900 group-hover:text-emerald-700 transition-colors leading-snug">
                      {student.full_name}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-normal">
                      Santri No. {String(index + 1).padStart(2, '0')}{student.nis ? ` • NIS: ${student.nis}` : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {student.status === 'SUDAH' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Selesai
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Belum dinilai"></span>
                  )}
                  <svg
                    className="w-4 h-4 text-neutral-300 stroke-[2] group-hover:translate-x-0.5 group-hover:text-neutral-500 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
      {/* END: StudentListSection */}

      {/* BEGIN: SubtleStatusLegend */}
      <footer className="pt-2 pb-6 flex items-center justify-center gap-6 text-[12px] text-neutral-400" data-purpose="list-legend">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Belum Dinilai</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Selesai Dinilai</span>
        </div>
      </footer>
      {/* END: SubtleStatusLegend */}
    </div>
  );
}
