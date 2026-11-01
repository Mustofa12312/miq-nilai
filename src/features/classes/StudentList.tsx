import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
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

  if (loading) return <div className="p-8 text-center">Memuat data santri...</div>;

  const total = students.length;
  const scored = students.filter(s => s.status === 'SUDAH').length;
  const progressPercentage = total === 0 ? 0 : Math.round((scored / total) * 100);

  // Buat URL query string untuk ScoringForm
  const scoringParams = new URLSearchParams();
  if (activePeriodId) scoringParams.set('periodId', String(activePeriodId));
  if (defaultExamTypeId) scoringParams.set('examTypeId', String(defaultExamTypeId));
  if (assignmentId) scoringParams.set('assignmentId', String(assignmentId));
  const paramString = scoringParams.toString() ? `?${scoringParams.toString()}` : '';

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      {/* Header Info */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="w-9 h-9 rounded-full bg-white border border-slate-200/70 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug">Kelas {classInfo?.name || '...'}</h2>
          <p className="text-[12.5px] text-slate-400 font-medium">Pilih Santri untuk dinilai</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-[0_2px_14px_-2px_rgba(0,0,0,0.03),0_1px_3px_0_rgba(0,0,0,0.02)] flex justify-between items-center">
        <div>
          <p className="text-[12px] text-slate-400 font-medium">Total: {total} Santri</p>
          <p className="text-[14px] font-semibold text-slate-800 mt-0.5">
            <span className="text-emerald-700">{scored} Sudah</span> <span className="text-slate-300 mx-1">•</span> <span className="text-amber-700">{total - scored} Belum</span>
          </p>
        </div>
        <div className="text-emerald-700 font-bold text-lg px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/60">
          {progressPercentage}%
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_14px_-2px_rgba(0,0,0,0.03),0_1px_3px_0_rgba(0,0,0,0.02)] overflow-hidden divide-y divide-slate-100">
        {students.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm font-medium">Belum ada santri di kelas ini.</div>
        ) : (
          students.map((student) => (
            <button
              key={student.id}
              onClick={() => navigate(`/examiner/class/${classId}/student/${student.id}${paramString}`)}
              className="w-full text-left p-4 active:bg-slate-50 transition-colors flex justify-between items-center group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <div className={`w-2.5 h-2.5 rounded-full ${student.status === 'SUDAH' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-amber-400'}`} />
                <div>
                  <p className="text-[14px] font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">{student.full_name}</p>
                  {student.room && <span className="text-[11px] text-slate-400 font-medium">{student.room}</span>}
                </div>
              </div>
              {student.status === 'SUDAH' ? (
                <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                  Selesai
                </span>
              ) : (
                <span className="text-[12px] font-medium text-slate-400 group-hover:text-emerald-600 transition-colors">
                  Nilai &rarr;
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
