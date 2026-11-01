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
    return (
      <div className="p-8 text-center text-slate-400 font-medium">
        Memuat data...
      </div>
    );
  }

  // Calculate global stats
  const globalTotal = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const globalScored = Object.values(stats).reduce((sum, s) => sum + s.scored, 0);
  const globalUnscored = Object.values(stats).reduce((sum, s) => sum + s.unscored, 0);

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      {/* BEGIN: GreetingSummaryCard */}
      <section className="relative overflow-hidden bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_14px_-2px_rgba(0,0,0,0.03),0_1px_3px_0_rgba(0,0,0,0.02)]">
        {/* Subtle Apple-like abstract light accent on background */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-br from-emerald-100/40 via-teal-50/20 to-transparent pointer-events-none blur-xl"></div>
        <div className="absolute -bottom-8 -right-6 w-28 h-28 rounded-full bg-emerald-50/30 pointer-events-none"></div>

        <div className="relative z-10">
          {/* User Greeting */}
          <h2 className="text-[17px] leading-snug font-semibold text-slate-900 tracking-tight">
            Assalamu'alaikum, <span className="text-slate-800">{profile?.full_name || 'Penguji'}</span>
          </h2>
          {/* Period Status */}
          <p className="text-[13px] font-medium text-slate-400 mt-0.5">
            Periode: <span className="text-slate-600 font-semibold">{activePeriod?.name || 'Tidak ada periode aktif'}</span>
          </p>

          {/* Badges / Indicators Grid */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Badge 1: Total Santri */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/50 text-[12.5px] font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span><strong>{globalTotal}</strong> Total Santri</span>
            </div>
            {/* Badge 2: Sudah Dinilai */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[12.5px] font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span><strong>{globalScored}</strong> Sudah Dinilai</span>
            </div>
            {/* Badge 3: Belum Dinilai */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/90 border border-amber-200/70 text-[12.5px] font-medium text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span><strong>{globalUnscored}</strong> Belum Dinilai</span>
            </div>
          </div>
        </div>
      </section>
      {/* END: GreetingSummaryCard */}

      {/* BEGIN: SearchSection */}
      <section className="relative">
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
          </svg>
          <input
            className="w-full h-11 pl-10 pr-4 text-[14px] bg-[#EFEFF3]/70 hover:bg-[#EFEFF3] focus:bg-white text-slate-800 placeholder-slate-400 rounded-2xl border border-transparent focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 outline-none"
            placeholder="Cari kelas atau tingkatan..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>
      {/* END: SearchSection */}

      {/* BEGIN: ClassListSection */}
      <section className="space-y-4 pt-1">
        {Object.keys(groupedAssignments).length === 0 ? (
          <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
            <p className="text-sm text-slate-400 font-medium">Tidak ada kelas yang ditugaskan untuk periode aktif.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.keys(groupedAssignments).map((levelName) => {
              const levelAssignments = groupedAssignments[levelName];
              return (
                <div key={levelName} className="space-y-2.5">
                  {/* Section Header */}
                  <div className="flex items-baseline justify-between px-1">
                    <div>
                      <h3 className="text-[14px] font-bold tracking-tight text-slate-900">Pilih Kelas untuk Dinilai</h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 block mt-0.5">
                        Tingkatan {levelName}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{levelAssignments.length} Kelas</span>
                  </div>

                  {/* Class Cards Container */}
                  <div className="space-y-2.5">
                    {levelAssignments.map((assignment) => (
                      <article
                        key={assignment.id}
                        onClick={() => navigate(`/examiner/class/${assignment.class.id}?assignmentId=${assignment.id}`)}
                        className="group bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_2px_14px_-2px_rgba(0,0,0,0.03),0_1px_3px_0_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition duration-200 ease-out flex items-center justify-between cursor-pointer"
                      >
                        <div className="space-y-2 flex-1 pr-3">
                          <div>
                            <h4 className="text-[16px] font-semibold text-slate-900 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors">
                              Kelas {assignment.class.name}
                            </h4>
                            <p className="text-[12.5px] font-normal text-slate-500 mt-0.5">
                              {assignment.class.level?.name || levelName}{' '}
                              <span className="text-slate-300 mx-1">•</span>{' '}
                              {stats[assignment.id]?.total ?? 0} Santri
                            </p>
                          </div>
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {assignment.room && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600">
                                {assignment.room}
                              </span>
                            )}
                            {assignment.ranting && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-50 text-[11px] font-medium text-emerald-700 border border-emerald-100/60">
                                {assignment.ranting.code} - {(assignment.ranting as any).name}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Action Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/examiner/class/${assignment.class.id}?assignmentId=${assignment.id}`);
                          }}
                          className="self-center px-4 py-1.5 rounded-full text-[13px] font-semibold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white active:scale-95 transition-all duration-150 border border-emerald-200/50 group-hover:border-emerald-600 shadow-sm shrink-0"
                        >
                          Buka
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* END: ClassListSection */}
    </div>
  );
}
