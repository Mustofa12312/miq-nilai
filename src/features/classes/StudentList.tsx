import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Student, Class } from '../../types';

interface StudentWithStatus extends Student {
  status: 'SUDAH' | 'BELUM';
}

export default function StudentList() {
  const navigate = useNavigate();
  const { classId } = useParams();

  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!classId) return;
      try {
        // Fetch class info
        const { data: cls } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();
        if (cls) setClassInfo(cls);

        // Fetch students
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId)
          .eq('active', true)
          .order('id', { ascending: true });

        if (studentsData) {
          // Check if scored (Simplification: fetch all scores for this class)
          // Ideally we query scores and join. For now we just query scores.
          const { data: scoresData } = await supabase
            .from('scores')
            .select('student_id');
            
          const scoredStudentIds = new Set(scoresData?.map(s => s.student_id) || []);

          const mapped: StudentWithStatus[] = studentsData.map(s => ({
            ...s,
            status: scoredStudentIds.has(s.id) ? 'SUDAH' : 'BELUM'
          }));

          setStudents(mapped);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
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
              onClick={() => navigate(`/examiner/class/${classId}/student/${student.id}`)}
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
