import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Loader2, Users, BookOpen, GraduationCap, UserCheck,
  TrendingUp, Award, Clock, ChevronRight, BarChart3,
  CalendarDays, CheckCircle2, AlertCircle
} from 'lucide-react';

interface RecentScore {
  id: number;
  total_score: number;
  grade: string;
  created_at: string;
  student: { full_name: string };
  session: { examiner: { full_name: string } };
}

interface TopStudent {
  student_name: string;
  class_name: string;
  total_score: number;
  grade: string;
}

interface ExaminerActivity {
  examiner_name: string;
  total_scored: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalScored: 0,
    totalClasses: 0,
    finishedClasses: 0,
    activeExaminers: 0,
    totalLevels: 0,
    avgScore: 0,
    activePeriod: '',
  });
  const [recentScores, setRecentScores] = useState<RecentScore[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [examinerActivities, setExaminerActivities] = useState<ExaminerActivity[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<{ grade: string; count: number }[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Parallel fetch all basic counts
        const [
          studentsRes, scoresRes, classesRes,
          examinersRes, levelsRes, periodsRes
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('active', true),
          supabase.from('scores').select('*', { count: 'exact', head: true }),
          supabase.from('classes').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'examiner'),
          supabase.from('levels').select('*', { count: 'exact', head: true }),
          supabase.from('exam_periods').select('name').eq('active', true).limit(1).single(),
        ]);

        // Finished classes
        const { data: sessions } = await supabase.from('score_sessions').select('class_id');
        const finishedClasses = new Set(sessions?.map(s => s.class_id)).size;

        // Average score
        const { data: allScores } = await supabase.from('scores').select('total_score, grade');
        const avgScore = allScores && allScores.length > 0
          ? Math.round(allScores.reduce((sum, s) => sum + s.total_score, 0) / allScores.length)
          : 0;

        // Grade distribution
        const gradeMap: Record<string, number> = {};
        allScores?.forEach(s => {
          const g = s.grade || 'Belum';
          gradeMap[g] = (gradeMap[g] || 0) + 1;
        });
        setGradeDistribution(Object.entries(gradeMap).map(([grade, count]) => ({ grade, count })));

        setStats({
          totalStudents: studentsRes.count || 0,
          totalScored: scoresRes.count || 0,
          totalClasses: classesRes.count || 0,
          finishedClasses,
          activeExaminers: examinersRes.count || 0,
          totalLevels: levelsRes.count || 0,
          avgScore,
          activePeriod: periodsRes.data?.name || 'Belum ada periode aktif',
        });

        // Recent scores (last 5)
        const { data: recentData } = await supabase
          .from('scores')
          .select(`
            id, total_score, grade, created_at,
            student:students(full_name),
            session:score_sessions(examiner:profiles(full_name))
          `)
          .order('created_at', { ascending: false })
          .limit(5);
        if (recentData) setRecentScores(recentData as any);

        // Top students (highest scores)
        const { data: topData } = await supabase
          .from('scores')
          .select(`
            total_score, grade,
            student:students(full_name, class:classes(name))
          `)
          .order('total_score', { ascending: false })
          .limit(5);
        if (topData) {
          setTopStudents(topData.map((t: any) => ({
            student_name: t.student?.full_name || '-',
            class_name: t.student?.class?.name || '-',
            total_score: t.total_score,
            grade: t.grade || '-',
          })));
        }

        // Examiner activity (most scores)
        const { data: examinerData } = await supabase
          .from('score_sessions')
          .select('examiner:profiles(full_name), id');
        if (examinerData) {
          const countMap: Record<string, number> = {};
          examinerData.forEach((s: any) => {
            const name = s.examiner?.full_name || 'Unknown';
            countMap[name] = (countMap[name] || 0) + 1;
          });
          setExaminerActivities(
            Object.entries(countMap)
              .map(([examiner_name, total_scored]) => ({ examiner_name, total_scored }))
              .sort((a, b) => b.total_scored - a.total_scored)
              .slice(0, 5)
          );
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'Mumtaz': return 'bg-emerald-500 text-white';
      case 'Jayyid Jiddan': return 'bg-emerald-100 text-emerald-700';
      case 'Jayyid': return 'bg-blue-100 text-blue-700';
      case 'Maqbul': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getGradeBarColor = (grade: string) => {
    switch (grade) {
      case 'Mumtaz': return 'bg-emerald-500';
      case 'Jayyid Jiddan': return 'bg-teal-400';
      case 'Jayyid': return 'bg-blue-400';
      case 'Maqbul': return 'bg-amber-400';
      default: return 'bg-gray-300';
    }
  };

  const progressPercent = stats.totalStudents > 0
    ? Math.round((stats.totalScored / stats.totalStudents) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-3" size={36} />
          <p className="text-gray-500 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-emerald-100 text-sm font-medium mb-1">{getGreeting()},</p>
          <h2 className="text-3xl font-bold mb-2">{profile?.full_name || 'Admin'} 👋</h2>
          <p className="text-emerald-100 max-w-lg">
            Berikut ringkasan terkini sistem penilaian MIQ. Pantau progres ujian, data santri, dan aktivitas penguji.
          </p>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-2 text-sm text-emerald-200">
          <CalendarDays size={16} />
          <span>Periode Aktif: <strong className="text-white">{stats.activePeriod}</strong></span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate('/admin/students')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Users size={20} className="text-emerald-600" />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
          <p className="text-sm text-gray-500 font-medium">Total Santri</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate('/admin/reports')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <GraduationCap size={20} className="text-blue-600" />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalScored}</p>
          <p className="text-sm text-gray-500 font-medium">Sudah Dinilai</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate('/admin/classes')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <BookOpen size={20} className="text-purple-600" />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.finishedClasses} <span className="text-lg text-gray-400 font-normal">/ {stats.totalClasses}</span></p>
          <p className="text-sm text-gray-500 font-medium">Kelas Selesai</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <UserCheck size={20} className="text-amber-600" />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeExaminers}</p>
          <p className="text-sm text-gray-500 font-medium">Penguji Aktif</p>
        </div>
      </div>

      {/* Progress & Average Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Progress */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Progres Penilaian</h3>
              <p className="text-xs text-gray-500">{stats.totalScored} dari {stats.totalStudents} santri sudah dinilai</p>
            </div>
          </div>
          <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{progressPercent}% selesai</span>
            <span className="text-gray-500 font-medium">{stats.totalStudents - stats.totalScored} tersisa</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Award size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Rata-rata Nilai & Distribusi Predikat</h3>
              <p className="text-xs text-gray-500">Berdasarkan seluruh penilaian</p>
            </div>
          </div>
          {stats.totalScored > 0 ? (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{stats.avgScore}</p>
                <p className="text-xs text-gray-500 mt-1">Rata-rata</p>
              </div>
              <div className="flex-1 space-y-2">
                {gradeDistribution.map((g) => {
                  const maxCount = Math.max(...gradeDistribution.map(d => d.count));
                  const widthPercent = maxCount > 0 ? (g.count / maxCount) * 100 : 0;
                  return (
                    <div key={g.grade} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-24 truncate">{g.grade}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getGradeBarColor(g.grade)} transition-all duration-700`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-6 text-right">{g.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada data nilai</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent & Top */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Scores */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              <h3 className="font-bold text-gray-900">Penilaian Terbaru</h3>
            </div>
            <button
              onClick={() => navigate('/admin/reports')}
              className="text-xs font-semibold text-primary hover:text-emerald-700 transition-colors"
            >
              Lihat Semua →
            </button>
          </div>
          {recentScores.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentScores.map((score) => (
                <div key={score.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                      {(score.student as any)?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{(score.student as any)?.full_name}</p>
                      <p className="text-xs text-gray-400">
                        oleh {(score.session as any)?.examiner?.full_name || '-'} • {new Date(score.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{score.total_score}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getGradeColor(score.grade)}`}>
                      {score.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <AlertCircle size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada penilaian yang tercatat.</p>
            </div>
          )}
        </div>

        {/* Top Students & Examiner Activity */}
        <div className="space-y-6">
          {/* Top Students */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <h3 className="font-bold text-gray-900">Santri Terbaik</h3>
            </div>
            {topStudents.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {topStudents.map((s, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{s.student_name}</p>
                        <p className="text-xs text-gray-400">{s.class_name}</p>
                      </div>
                    </div>
                    <span className="font-bold text-primary text-sm">{s.total_score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">Belum ada data</div>
            )}
          </div>

          {/* Examiner Activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-teal-500" />
              <h3 className="font-bold text-gray-900">Aktivitas Penguji</h3>
            </div>
            {examinerActivities.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {examinerActivities.map((ea, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                        {ea.examiner_name.charAt(0)}
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{ea.examiner_name}</p>
                    </div>
                    <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">
                      {ea.total_scored} sesi
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">Belum ada aktivitas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
