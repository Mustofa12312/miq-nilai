import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Class, ExamPeriod, Level } from '../../types';

interface ClassWithLevel extends Class {
  level: Level;
}

interface ExaminerAssignment {
  id: number;
  class_id: number;
  room: string | null;
  ranting_id: number | null;
  ranting: { name: string; code: string } | null;
  class: ClassWithLevel;
}

interface AssignmentStats {
  total: number;
  scored: number;
  unscored: number;
}

export default function ExaminerDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [assignments, setAssignments] = useState<ExaminerAssignment[]>([]);
  const [stats, setStats] = useState<Record<number, AssignmentStats>>({});
  const [activePeriod, setActivePeriod] = useState<ExamPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        // 1. Fetch active exam period
        const { data: periodData } = await supabase
          .from('exam_periods')
          .select('*')
          .eq('active', true)
          .single();
          
        if (periodData) {
          setActivePeriod(periodData);
        } else {
          setAssignments([]);
          return;
        }
        
        // 2. Fetch assigned classes
        const { data: assignmentData, error } = await supabase
          .from('examiner_assignments')
          .select(`
            id,
            class_id,
            room,
            ranting_id,
            ranting:rantings(name, code),
            class:classes (
              *,
              level:levels(*)
            )
          `)
          .eq('examiner_id', profile.id)
          .eq('period_id', periodData.id);

        if (!error && assignmentData) {
          const sorted = (assignmentData as any[]).filter(a => a.class).sort((a, b) => {
            const levelSort = (a.class.level?.sort_order ?? 0) - (b.class.level?.sort_order ?? 0);
            return levelSort || a.class.name.localeCompare(b.class.name, undefined, { numeric: true, sensitivity: 'base' });
          });
          setAssignments(sorted);
          
          // 3. Fetch stats (students & scores) for these assignments
          if (sorted.length > 0) {
             const classIds = [...new Set(sorted.map(a => a.class_id))];
             const { data: studentsData } = await supabase
                .from('students')
                .select('id, class_id, room, ranting_id')
                .in('class_id', classIds)
                .eq('active', true);
             
             const { data: examTypeData } = await supabase
                .from('exam_types')
                .select('id')
                .order('id', { ascending: true })
                .limit(1)
                .single();
                
             let scoredStudentIds = new Set<number>();
             if (studentsData && studentsData.length > 0 && examTypeData) {
                // To avoid large IN clauses, just fetch all scores for the period & examType
                const { data: scores } = await supabase
                   .from('scores')
                   .select('student_id')
                   .eq('period_id', periodData.id)
                   .eq('exam_type_id', examTypeData.id);
                if (scores) {
                   scoredStudentIds = new Set(scores.map(s => s.student_id));
                }
             }
             
             const newStats: Record<number, AssignmentStats> = {};
             for (const a of sorted) {
                let assignmentStudents = studentsData || [];
                assignmentStudents = assignmentStudents.filter(s => {
                   if (s.class_id !== a.class_id) return false;
                   if (a.room && s.room !== a.room) return false;
                   if (a.ranting_id && s.ranting_id !== a.ranting_id) return false;
                   return true;
                });
                const total = assignmentStudents.length;
                const scored = assignmentStudents.filter(s => scoredStudentIds.has(s.id)).length;
                newStats[a.id] = { total, scored, unscored: total - scored };
             }
             setStats(newStats);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.id]);

  const filteredAssignments = assignments.filter(a => {
    const c = a.class;
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.level?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (a.room && a.room.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Group by level
  const groupedAssignments = filteredAssignments.reduce((acc, curr) => {
    const levelName = curr.class?.level?.name || 'Lainnya';
    if (!acc[levelName]) acc[levelName] = [];
    acc[levelName].push(curr);
    return acc;
  }, {} as Record<string, ExaminerAssignment[]>);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  }

  // Calculate global stats
  const globalTotal = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const globalScored = Object.values(stats).reduce((sum, s) => sum + s.scored, 0);
  const globalUnscored = Object.values(stats).reduce((sum, s) => sum + s.unscored, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-4 -mt-4 transition-all" />
        <div className="absolute bottom-0 right-10 w-16 h-16 bg-primary/5 rounded-tl-[50px] -mb-4 transition-all" />
        
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Assalamu'alaikum, {profile?.full_name || 'Penguji'}</h2>
          <p className="text-sm text-gray-500 mb-4">Periode: {activePeriod?.name || 'Tidak ada periode aktif'}</p>
          
          {Object.keys(stats).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-100/60">
              <div className="bg-gray-50/80 px-3 py-2 rounded-xl flex items-center gap-2 border border-gray-200/50">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                <span className="text-sm font-bold text-gray-700">{globalTotal} <span className="font-medium">Total Santri</span></span>
              </div>
              <div className="bg-emerald-50/80 px-3 py-2 rounded-xl flex items-center gap-2 border border-emerald-200/50">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                <span className="text-sm font-bold text-emerald-700">{globalScored} <span className="font-medium">Sudah Dinilai</span></span>
              </div>
              <div className="bg-amber-50/80 px-3 py-2 rounded-xl flex items-center gap-2 border border-amber-200/50">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-200"></span>
                <span className="text-sm font-bold text-amber-700">{globalUnscored} <span className="font-medium">Belum Dinilai</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
         <input
           type="text"
           placeholder="Cari kelas atau tingkatan..."
           className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-4 px-1">Pilih Kelas untuk Dinilai</h3>
        
        {Object.keys(groupedAssignments).length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Tidak ada kelas yang ditugaskan untuk periode aktif.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedAssignments).map(levelName => (
              <div key={levelName}>
                <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase px-1">{levelName}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupedAssignments[levelName].map((assignment) => (
                    <button
                      key={assignment.id}
                      onClick={() => navigate(`/examiner/class/${assignment.class.id}?assignmentId=${assignment.id}`)}
                      className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-primary active:scale-95 transition-all flex justify-between items-start group"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">Kelas {assignment.class.name}</p>
                        <div className="flex items-center gap-2 mb-2">
                           <p className="text-sm text-gray-500">{assignment.class.level?.name}</p>
                           {stats[assignment.id] && (
                             <>
                               <span className="text-gray-300 text-xs">•</span>
                               <p className="text-sm text-gray-500 font-medium">{stats[assignment.id].total} Santri</p>
                             </>
                           )}
                        </div>
                        
                        {(assignment.room || assignment.ranting) && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {assignment.room && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">{assignment.room}</span>}
                            {assignment.ranting && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">{assignment.ranting.code} - {(assignment.ranting as any).name}</span>}
                          </div>
                        )}
                      </div>
                      <div className="text-right pl-3 mt-1">
                        <span className="text-xs font-medium px-3 py-1.5 rounded-full text-primary bg-primary/10">
                          Buka
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
