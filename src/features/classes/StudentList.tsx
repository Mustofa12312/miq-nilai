import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Student, Class } from '../../types';
import { fetchClassStudentsData } from '../../services/studentService';

interface StudentWithStatus extends Student {
  status: 'SUDAH' | 'BELUM';
}

export default function StudentList() {
  const navigate = useNavigate();
  const { classId } = useParams();
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
        const data = await fetchClassStudentsData(classId, user.id);
        
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
  }, [classId]);

  if (loading) return <div className="p-8 text-center">Memuat data santri...</div>;

  const total = students.length;
  const scored = students.filter(s => s.status === 'SUDAH').length;
  const progressPercentage = total === 0 ? 0 : Math.round((scored / total) * 100);

  // Buat URL query string untuk ScoringForm
  const scoringParams = new URLSearchParams();
  if (activePeriodId) scoringParams.set('periodId', String(activePeriodId));
  if (defaultExamTypeId) scoringParams.set('examTypeId', String(defaultExamTypeId));
  const paramString = scoringParams.toString() ? `?${scoringParams.toString()}` : '';

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-lg active:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kelas {classInfo?.name || '...'}</h2>
          <p className="text-sm text-gray-500">Pilih Santri untuk dinilai</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-xs text-gray-500 font-medium">Total: {total} Santri</p>
          <p className="text-sm font-bold text-gray-900">{scored} Sudah • {total - scored} Belum</p>
        </div>
        <div className="text-primary font-bold text-xl">
          {progressPercentage}%
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada santri di kelas ini.</div>
        ) : (
          students.map((student) => (
            <button
              key={student.id}
              onClick={() => navigate(`/examiner/class/${classId}/student/${student.id}${paramString}`)}
              className="w-full text-left p-4 active:bg-gray-50 transition-colors flex justify-between items-center group"
            >
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <div className={`w-3 h-3 rounded-full ${student.status === 'SUDAH' ? 'bg-primary' : 'bg-warning'}`} />
                <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">{student.full_name}</p>
              </div>
              {student.status === 'SUDAH' && (
                <span className="text-xs font-medium text-primary bg-accent-bg px-2 py-1 rounded-full">
                  Selesai
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
