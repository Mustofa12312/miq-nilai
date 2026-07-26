import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Class, ExamPeriod } from '../../types';

interface AssignmentWithClass {
  id: number;
  class_id: number;
  classes: Class & { level: { name: string } };
  period_id: number;
}

export default function ExaminerDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [assignments, setAssignments] = useState<AssignmentWithClass[]>([]);
  const [activePeriod, setActivePeriod] = useState<ExamPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Fetch active exam period
        const { data: periodData } = await supabase
          .from('exam_periods')
          .select('*')
          .eq('active', true)
          .single();
          
        if (periodData) {
          setActivePeriod(periodData);
          
          // 2. Fetch assignments for this examiner and period
          // Note: using inner join syntax for classes and levels
          const { data: assignmentData, error } = await supabase
            .from('examiner_assignments')
            .select(`
              id,
              class_id,
              period_id,
              classes (
                id,
                name,
                level:levels (
                  name
                )
              )
            `)
            .eq('examiner_id', user.id)
            .eq('period_id', periodData.id);

          if (!error && assignmentData) {
            // Need to type cast or ignore due to complex join typing
            setAssignments(assignmentData as any);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Assalamu'alaikum, {profile?.full_name || 'Penguji'}</h2>
        <p className="text-sm text-gray-500">Periode: {activePeriod?.name || 'Tidak ada periode aktif'}</p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">Kelas Tugas Anda</h3>
        
        {assignments.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Belum ada kelas yang ditugaskan kepada Anda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <button
                key={assignment.id}
                onClick={() => navigate(`/examiner/class/${assignment.class_id}`)}
                className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:scale-95 transition-transform flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-900 text-lg">Kelas {assignment.classes?.name}</p>
                  <p className="text-sm text-gray-500">{assignment.classes?.level?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium px-2 py-1 rounded-full text-primary bg-accent-bg">
                    Buka Kelas
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
