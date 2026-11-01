import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Loader2, Users, BookOpen, GraduationCap, UserCheck,
  TrendingUp, Award, Clock, ChevronRight, BarChart3,
  Calendar, RotateCw, CheckCircle2, AlertCircle,
  FileText, CheckSquare
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
  const [refreshing, setRefreshing] = useState(false);
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
  const [inactiveExaminers, setInactiveExaminers] = useState<{ examiner_name: string }[]>([]);
  const [examinerTab, setExaminerTab] = useState<'active' | 'inactive'>('active');
  const [gradeDistribution, setGradeDistribution] = useState<{ grade: string; count: number }[]>([]);

  const fetchDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      // Parallel fetch all basic counts
      const [
        studentsRes, scoresRes, classesRes,
        examinersRes, levelsRes, periodsRes
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('scores').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, full_name', { count: 'exact' }).eq('role', 'examiner'),
        supabase.from('levels').select('*', { count: 'exact', head: true }),
        supabase.from('exam_periods').select('name').eq('active', true).limit(1).maybeSingle(),
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
        activePeriod: periodsRes.data?.name || 'Tidak ada periode aktif',
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

      // Examiner activity (most scores and inactive)
      const { data: examinerData } = await supabase
        .from('score_sessions')
        .select('examiner_id, examiner:profiles(full_name), id');

      if (examinerData && examinersRes.data) {
        const countMap: Record<string, number> = {};
        const activeExaminerIds = new Set<string>();

        examinerData.forEach((s: any) => {
          const name = s.examiner?.full_name || 'Unknown';
          countMap[name] = (countMap[name] || 0) + 1;
          if (s.examiner_id) activeExaminerIds.add(s.examiner_id);
        });

        setExaminerActivities(
          Object.entries(countMap)
            .map(([examiner_name, total_scored]) => ({ examiner_name, total_scored }))
            .sort((a, b) => b.total_scored - a.total_scored)
        );

        const inactive = examinersRes.data
          .filter(e => !activeExaminerIds.has(e.id))
          .map(e => ({ examiner_name: e.full_name }))
          .sort((a, b) => a.examiner_name.localeCompare(b.examiner_name));

        setInactiveExaminers(inactive);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'Mumtaz':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold';
      case 'Jayyid Jiddan':
        return 'bg-teal-50 text-teal-700 border border-teal-200/60 font-semibold';
      case 'Jayyid':
        return 'bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold';
      case 'Maqbul':
        return 'bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold';
      default:
        return 'bg-slate-100 text-slate-600 font-semibold';
    }
  };

  const getGradeBarColor = (grade: string) => {
    switch (grade) {
      case 'Mumtaz': return 'bg-emerald-500';
      case 'Jayyid Jiddan': return 'bg-teal-400';
      case 'Jayyid': return 'bg-blue-400';
      case 'Maqbul': return 'bg-amber-400';
      default: return 'bg-slate-300';
    }
  };

  const progressPercent = stats.totalStudents > 0
    ? Math.round((stats.totalScored / stats.totalStudents) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mb-4 shadow-sm animate-pulse">
          <Loader2 className="animate-spin text-brand-600" size={24} />
        </div>
        <p className="text-sm font-semibold text-slate-700">Memuat Smart Assessment Dashboard...</p>
        <p className="text-xs text-slate-400 mt-1">Menyiapkan data penilaian MIQ</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8 animate-fade-in text-left">
      {/* BEGIN: Hero / Welcome Banner (Apple Minimalist Frosted Card) */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-white via-white to-brand-50/40 rounded-3xl p-5 sm:p-7 md:p-8 border border-[#E9ECEF] shadow-apple"
        data-purpose="greeting-hero-card"
      >
        {/* Subtle Decorative Glass Circle Accent */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-60 h-60 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-100/60">
                {getGreeting()}
              </span>
              <button
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                title="Perbarui Data"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 px-2 py-1 rounded-md border border-slate-200/60 transition-colors cursor-pointer"
              >
                <RotateCw size={12} className={refreshing ? 'animate-spin text-brand-600' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mb-1.5 sm:mb-2">
              <span>{profile?.full_name || 'Admin MIQ'}</span>
              <span className="text-2xl animate-pulse">👋</span>
            </h2>
            <p className="text-slate-500 text-[13px] sm:text-[14.5px] leading-relaxed font-normal">
              Berikut ringkasan terkini sistem penilaian MIQ. Pantau progres ujian, data santri, dan aktivitas penguji secara real-time.
            </p>
          </div>

          {/* Period Badge / Pill */}
          <div className="self-start md:self-center shrink-0 flex items-center gap-2">
            <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-slate-700">
              <span className="p-1.5 rounded-lg bg-slate-50 text-slate-500">
                <Calendar size={15} />
              </span>
              <div className="text-xs">
                <span className="text-slate-400 font-medium">Periode Aktif:</span>
                <span className="font-bold text-slate-800 ml-1.5">{stats.activePeriod}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: Hero Banner */}

      {/* BEGIN: Quick Actions on Mobile / Small Screens */}
      <section className="block sm:hidden" data-purpose="mobile-quick-actions">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aksi Cepat</span>
          <span className="text-[11px] text-slate-400">Pintas Admin</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => navigate('/admin/students')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-sm active:scale-95 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center mb-1.5">
              <Users size={18} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Santri</span>
          </button>
          <button
            onClick={() => navigate('/admin/classes')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-sm active:scale-95 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
              <BookOpen size={18} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Kelas</span>
          </button>
          <button
            onClick={() => navigate('/admin/verification')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-sm active:scale-95 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
              <CheckSquare size={18} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Verifikasi</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs hover:shadow-sm active:scale-95 transition-all text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
              <FileText size={18} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Laporan</span>
          </button>
        </div>
      </section>
      {/* END: Quick Actions */}

      {/* BEGIN: Stat Cards Grid (4 columns on desktop, 2 columns on phone) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5" data-purpose="stat-metrics">
        {/* Metric 1: Total Santri */}
        <div
          onClick={() => navigate('/admin/students')}
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#ECEEF2] shadow-apple hover:shadow-apple-hover transition-all duration-300 flex flex-col justify-between group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <Users size={20} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
              {stats.totalStudents}
            </div>
            <div className="text-[12px] sm:text-xs font-medium text-slate-400 mt-2 truncate">
              Total Santri
            </div>
          </div>
        </div>

        {/* Metric 2: Sudah Dinilai */}
        <div
          onClick={() => navigate('/admin/reports')}
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#ECEEF2] shadow-apple hover:shadow-apple-hover transition-all duration-300 flex flex-col justify-between group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <GraduationCap size={20} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
              {stats.totalScored}
            </div>
            <div className="text-[12px] sm:text-xs font-medium text-slate-400 mt-2 truncate">
              Sudah Dinilai
            </div>
          </div>
        </div>

        {/* Metric 3: Kelas Selesai */}
        <div
          onClick={() => navigate('/admin/classes')}
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#ECEEF2] shadow-apple hover:shadow-apple-hover transition-all duration-300 flex flex-col justify-between group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <BookOpen size={20} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
              {stats.finishedClasses} <span className="text-lg sm:text-xl font-normal text-slate-400">/ {stats.totalClasses}</span>
            </div>
            <div className="text-[12px] sm:text-xs font-medium text-slate-400 mt-2 truncate">
              Kelas Selesai
            </div>
          </div>
        </div>

        {/* Metric 4: Penguji Aktif */}
        <div
          onClick={() => navigate('/admin/activity')}
          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#ECEEF2] shadow-apple hover:shadow-apple-hover transition-all duration-300 flex flex-col justify-between group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <UserCheck size={20} />
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
              {stats.activeExaminers}
            </div>
            <div className="text-[12px] sm:text-xs font-medium text-slate-400 mt-2 truncate">
              Penguji Aktif
            </div>
          </div>
        </div>
      </section>
      {/* END: Stat Cards */}

      {/* BEGIN: Mid Section: Progress & Predicate Distribution (2 columns) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7" data-purpose="mid-analytics-section">
        {/* Left: Progres Penilaian */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#ECEEF2] shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-3.5 mb-5 sm:mb-6">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-slate-900 leading-tight">Progres Penilaian</h3>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  {stats.totalScored} dari {stats.totalStudents} santri sudah dinilai
                </p>
              </div>
            </div>

            {/* Sleek Progress Bar */}
            <div className="space-y-2.5 my-4 sm:my-5">
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="font-semibold text-brand-600">{progressPercent}% selesai</span>
                <span>{stats.totalStudents - stats.totalScored} tersisa</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Target kelulusan periode</span>
            <span className="font-semibold text-slate-700">100% Santri</span>
          </div>
        </div>

        {/* Right: Rata-rata Nilai & Distribusi Predikat */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#ECEEF2] shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-slate-900 leading-tight">Rata-rata Nilai &amp; Distribusi Predikat</h3>
                <p className="text-xs text-slate-400 font-normal mt-0.5">Berdasarkan seluruh penilaian</p>
              </div>
            </div>

            {stats.totalScored > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
                <div className="text-center sm:text-left shrink-0 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 w-full sm:w-auto">
                  <div className="text-4xl font-extrabold tracking-tight text-brand-600 leading-none">
                    {stats.avgScore}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 mt-1.5 uppercase tracking-wide">
                    Rata-rata
                  </div>
                </div>
                <div className="flex-1 w-full space-y-2">
                  {gradeDistribution.map((g) => {
                    const maxCount = Math.max(...gradeDistribution.map(d => d.count));
                    const widthPercent = maxCount > 0 ? (g.count / maxCount) * 100 : 0;
                    return (
                      <div key={g.grade} className="flex items-center gap-2.5">
                        <span className="text-xs font-medium text-slate-600 w-24 truncate">{g.grade}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getGradeBarColor(g.grade)} transition-all duration-700`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-7 text-right">{g.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Apple-like Empty State Placeholder */
              <div className="flex flex-col items-center justify-center py-7">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
                  <BarChart3 className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-xs font-medium text-slate-400">Belum ada data nilai</span>
              </div>
            )}
          </div>

          <div className="text-right pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-normal">Data diperbarui otomatis</span>
          </div>
        </div>
      </section>
      {/* END: Mid Section */}

      {/* BEGIN: Bottom Section: Latest Assessments & Top Performers / Activity (Split Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7" data-purpose="bottom-details-section">
        {/* Left Column: Penilaian Terbaru (Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-7 border border-[#ECEEF2] shadow-apple flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Clock size={18} className="text-slate-400" />
                <h3 className="font-bold text-[15px] text-slate-900">Penilaian Terbaru</h3>
              </div>
              <button
                onClick={() => navigate('/admin/reports')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group transition-colors cursor-pointer"
              >
                <span>Lihat Semua</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {recentScores.length > 0 ? (
              <div className="divide-y divide-slate-100 mt-2">
                {recentScores.map((score) => (
                  <div
                    key={score.id}
                    className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {(score.student as any)?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {(score.student as any)?.full_name || 'Santri'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          oleh {(score.session as any)?.examiner?.full_name || '-'} • {new Date(score.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-bold text-slate-900 text-sm">{score.total_score}</span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${getGradeBadge(score.grade)}`}>
                        {score.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Apple-like Empty State Container */
              <div className="flex-1 flex flex-col items-center justify-center py-10 sm:py-14">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
                  <AlertCircle className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-xs font-medium text-slate-400 text-center">Belum ada penilaian yang tercatat.</p>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 text-center pt-3 border-t border-slate-100">
            Riwayat penilaian santri akan muncul seketika setelah penguji melakukan input
          </div>
        </div>

        {/* Right Column: Santri Terbaik & Aktivitas Penguji (Span 5) */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-7 flex flex-col justify-between">
          {/* Sub-card 1: Santri Terbaik */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECEEF2] shadow-apple">
            <div className="flex items-center gap-2 mb-4">
              <Award size={18} className="text-amber-500" />
              <h3 className="font-bold text-[14.5px] text-slate-900">Santri Terbaik</h3>
            </div>

            {topStudents.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {topStudents.map((s, i) => (
                  <div key={i} className="py-2.5 sm:py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          i === 0
                            ? 'bg-amber-400 text-white shadow-xs'
                            : i === 1
                            ? 'bg-slate-300 text-slate-700'
                            : i === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-[13px] truncate">{s.student_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{s.class_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-brand-600 text-sm">{s.total_score}</span>
                      <span className="text-[10.5px] font-medium text-slate-400">{s.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs font-medium text-slate-400">Belum ada data</p>
              </div>
            )}
          </div>

          {/* Sub-card 2: Aktivitas Penguji */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECEEF2] shadow-apple flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-brand-700 stroke-[3]" />
                  </div>
                  <h3 className="font-bold text-[14.5px] text-slate-900">Aktivitas Penguji</h3>
                </div>

                {/* Apple-style Segmented Control Pills */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl text-[11px] font-semibold">
                  <button
                    onClick={() => setExaminerTab('active')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      examinerTab === 'active'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    type="button"
                  >
                    Teraktif
                  </button>
                  <button
                    onClick={() => setExaminerTab('inactive')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      examinerTab === 'inactive'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    type="button"
                  >
                    Belum Input
                  </button>
                </div>
              </div>

              {examinerTab === 'active' ? (
                examinerActivities.length > 0 ? (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {examinerActivities.map((ea, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {ea.examiner_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-slate-800 truncate">
                              {ea.examiner_name}
                            </div>
                            <div className="text-[10.5px] text-slate-400">Penguji</div>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-bold text-[11px] border border-brand-200/50 shrink-0">
                          {ea.total_scored} sesi
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Belum ada aktivitas
                  </div>
                )
              ) : (
                inactiveExaminers.length > 0 ? (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {inactiveExaminers.map((ea, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/50 border border-rose-100/70"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {ea.examiner_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-slate-800 truncate">
                              {ea.examiner_name}
                            </div>
                            <div className="text-[10.5px] text-slate-400">Penguji</div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-semibold text-[11px] border border-red-200/50 shrink-0">
                          <AlertCircle size={11} />
                          Belum Input
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center flex flex-col items-center gap-2">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-700">Semua penguji sudah input nilai!</p>
                  </div>
                )
              )}
            </div>

            {/* Sub-card Footer */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Sinkronisasi otomatis</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-brand-700 font-medium">Real-time</span>
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* END: Bottom Section */}
    </div>
  );
}
