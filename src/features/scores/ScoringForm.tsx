import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Criteria, Student } from '../../types';

export default function ScoringForm() {
  const navigate = useNavigate();
  const { classId, studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Baca periodId, examTypeId, dan assignmentId dari URL query params (dikirim dari StudentList)
  const urlPeriodId = searchParams.get('periodId') ? Number(searchParams.get('periodId')) : null;
  const urlExamTypeId = searchParams.get('examTypeId') ? Number(searchParams.get('examTypeId')) : null;
  const urlAssignmentId = searchParams.get('assignmentId') ? Number(searchParams.get('assignmentId')) : null;

  const [student, setStudent] = useState<Student | null>(null);
  const [criteriaList, setCriteriaList] = useState<Criteria[]>([]);
  const [mistakes, setMistakes] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!studentId) return;
      try {
        const { data: st } = await supabase.from('students').select('*').eq('id', studentId).single();
        if (st) setStudent(st);

        // Fetch criteria aktif dari DB diurutkan berdasarkan sort_order
        const { data: cr } = await supabase
          .from('criteria')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        if (cr) setCriteriaList(cr);
      } catch (err) {
        console.error('Error fetching scoring data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [studentId]);

  const handleMistakeChange = (id: number, delta: number) => {
    setMistakes((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next < 0) return prev;
      return { ...prev, [id]: next };
    });
  };

  // Logika Total: 100 dikurangi seluruh potongan kesalahan kriteria
  const totalScore = useMemo(() => {
    const totalDeduction = criteriaList.reduce((acc, criteria) => {
      const criteriaMistakes = mistakes[criteria.id] || 0;
      return acc + criteriaMistakes * criteria.deduction;
    }, 0);
    return Math.max(0, 100 - totalDeduction);
  }, [mistakes, criteriaList]);

  const handleSave = async () => {
    if (!user || !studentId || !classId) return;
    setIsSaving(true);

    try {
      // 1. Resolve period_id
      let periodId = urlPeriodId;
      if (!periodId) {
        const { data: period } = await supabase.from('exam_periods').select('id').eq('active', true).maybeSingle();
        if (!period) {
          const { data: latestPeriod } = await supabase
            .from('exam_periods')
            .select('id')
            .order('start_date', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!latestPeriod) throw new Error('Tidak ada data periode ujian di database. Harap buat periode ujian di menu Admin.');
          periodId = latestPeriod.id;
        } else {
          periodId = period.id;
        }
      }

      // Resolve exam_type_id
      let examTypeId = urlExamTypeId;
      if (!examTypeId) {
        const { data: defaultExamType } = await supabase.from('exam_types').select('id').eq('active', true).maybeSingle();
        if (!defaultExamType) throw new Error('Tidak ada data jenis ujian di database. Harap tambahkan jenis ujian di menu Admin.');
        examTypeId = defaultExamType.id;
      }

      let assignmentQuery = supabase
        .from('examiner_assignments')
        .select('id')
        .eq('examiner_id', user.id)
        .eq('class_id', parseInt(classId))
        .eq('period_id', periodId);

      if (urlAssignmentId) {
        assignmentQuery = assignmentQuery.eq('id', urlAssignmentId);
      }

      const { data: assignment } = await assignmentQuery.limit(1).maybeSingle();
      if (!assignment) {
        throw new Error('Anda tidak ditugaskan menilai kelas ini pada periode ujian yang dipilih.');
      }

      // Cek apakah santri sudah dinilai dan terkunci
      const { data: existingScore } = await supabase
        .from('scores')
        .select('id, locked')
        .eq('student_id', parseInt(studentId))
        .eq('period_id', periodId)
        .eq('exam_type_id', examTypeId)
        .maybeSingle();

      if (existingScore) {
        if (existingScore.locked) {
          throw new Error('Nilai santri ini sudah dikunci dan tidak dapat diubah.');
        }
        throw new Error('Santri ini sudah memiliki nilai untuk periode ujian ini.');
      }

      // 2. Create score_session
      const { data: session, error: sessionErr } = await supabase
        .from('score_sessions')
        .insert({
          examiner_id: user.id,
          class_id: parseInt(classId),
          period_id: periodId,
          exam_type_id: examTypeId,
          finished_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      // 3. Create score
      const getTempGrade = (score: number) => {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'E';
      };

      const { data: scoreRec, error: scoreErr } = await supabase
        .from('scores')
        .upsert({
          session_id: session.id,
          student_id: parseInt(studentId),
          period_id: periodId,
          exam_type_id: examTypeId,
          total_score: totalScore,
          grade: getTempGrade(totalScore),
        })
        .select()
        .single();

      if (scoreErr) {
        if (scoreErr.code === '23505') {
          throw new Error('Santri ini sudah memiliki nilai untuk periode ujian ini.');
        }
        throw scoreErr;
      }

      // 4. Create score_details
      const detailsToInsert = criteriaList.map((cr) => {
        const mstk = mistakes[cr.id] || 0;
        return {
          score_id: scoreRec.id,
          criteria_id: cr.id,
          mistakes: mstk,
          score: mstk * cr.deduction,
        };
      });

      if (detailsToInsert.length > 0) {
        const { error: detailErr } = await supabase.from('score_details').insert(detailsToInsert);
        if (detailErr) throw detailErr;
      }

      const { data: finalScoreRec } = await supabase
        .from('scores')
        .select('total_score, grade')
        .eq('id', scoreRec.id)
        .single();

      toast.success(`Nilai berhasil disimpan! Total: ${finalScoreRec?.total_score || totalScore} (${finalScoreRec?.grade || '...'})`);
      navigate(-1);
    } catch (err: any) {
      console.error('Error saving score:', err);
      toast.error('Gagal menyimpan nilai: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm font-medium">
        Memuat kriteria penilaian...
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 flex flex-col gap-4 pb-28">
      {/* BEGIN: StudentInfoHeader */}
      <section className="px-1 pt-1" data-purpose="student-context-header">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          {student?.full_name || '...'}
        </h2>
        <p className="text-sm text-slate-500 font-normal mt-0.5">
          {student?.nis ? `NIS: ${student.nis}` : `Santri ID: ${studentId}`} • Penilaian Ujian
        </p>
      </section>
      {/* END: StudentInfoHeader */}

      {/* BEGIN: HeroScoreSummary */}
      <section
        className="bg-gradient-to-b from-white to-emerald-50/40 rounded-3xl p-5 border border-emerald-100/80 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04),0_1px_3px_0_rgba(15,23,42,0.02)] relative overflow-hidden"
        data-purpose="hero-score-card"
      >
        {/* Subtle decorative ambient radial glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                Perhitungan Real-time
              </p>
            </div>
            <h3 className="text-sm font-medium text-slate-600">Total Nilai Otomatis</h3>
            <div
              className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                totalScore >= 90
                  ? 'bg-emerald-100/80 border-emerald-200/60 text-emerald-700'
                  : totalScore >= 75
                  ? 'bg-amber-100/80 border-amber-200/60 text-amber-700'
                  : 'bg-rose-100/80 border-rose-200/60 text-rose-700'
              }`}
            >
              {totalScore === 100
                ? 'Sempurna / Nilai Awal'
                : totalScore >= 90
                ? 'Sangat Baik'
                : totalScore >= 75
                ? 'Baik'
                : 'Perlu Pembinaan'}
            </div>
          </div>

          {/* Prominent Apple-Style Numeric Display */}
          <div className="text-right">
            <div className="flex items-baseline justify-end">
              <span
                className={`text-5xl font-bold tracking-tight font-sans ${
                  totalScore >= 90
                    ? 'text-emerald-600'
                    : totalScore >= 75
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`}
              >
                {totalScore}
              </span>
              <span className="text-xs font-semibold text-slate-400 ml-1">/100</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Skor Maksimal</span>
          </div>
        </div>
      </section>
      {/* END: HeroScoreSummary */}

      {/* BEGIN: AssessmentCriteriaList */}
      <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Kriteria Penilaian
        </h3>
        <span className="text-[11px] font-medium text-slate-400">
          {criteriaList.length} Kategori Pokok
        </span>
      </div>

      <div className="space-y-3" data-purpose="scoring-criteria-cards">
        {criteriaList.map((criteria) => {
          const currentMistakes = mistakes[criteria.id] || 0;
          const currentDeduction = currentMistakes * criteria.deduction;

          return (
            <article
              key={criteria.id}
              className="criterion-card bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04),0_1px_3px_0_rgba(15,23,42,0.02)]"
            >
              {/* Card Header & Subtotal Penalty */}
              <div className="flex items-start justify-between">
                <div className="pr-2">
                  <h4 className="text-[13px] font-bold text-slate-900 leading-snug tracking-tight">
                    {criteria.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">
                    Potongan: -{criteria.deduction} per kesalahan
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`deduction-badge text-xs font-semibold px-2 py-0.5 rounded-md border ${
                      currentDeduction > 0
                        ? 'text-rose-600 bg-rose-50 border-rose-100'
                        : 'text-slate-400 bg-slate-50 border-slate-100'
                    }`}
                  >
                    {currentDeduction > 0 ? `-${currentDeduction}` : '0'}
                  </span>
                </div>
              </div>

              {/* Apple Stepper Control Container */}
              <div className="mt-3.5 pt-3 border-t border-slate-100/80 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Kesalahan</span>
                <div className="flex items-center space-x-3 bg-slate-50/80 px-2 py-1 rounded-full border border-slate-200/60">
                  {/* Decrement Button */}
                  <button
                    onClick={() => handleMistakeChange(criteria.id, -1)}
                    disabled={currentMistakes <= 0}
                    aria-label={`Kurangi kesalahan ${criteria.name}`}
                    className="stepper-btn w-7 h-7 rounded-full bg-white text-slate-600 flex items-center justify-center shadow-sm disabled:opacity-30 disabled:pointer-events-none transition active:scale-90 cursor-pointer"
                    type="button"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  {/* Value Counter */}
                  <span className="count-value text-sm font-semibold text-slate-800 w-4 text-center">
                    {currentMistakes}
                  </span>
                  {/* Increment Button */}
                  <button
                    onClick={() => handleMistakeChange(criteria.id, 1)}
                    aria-label={`Tambah kesalahan ${criteria.name}`}
                    className="stepper-btn w-7 h-7 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-sm transition active:scale-90 cursor-pointer"
                    type="button"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {/* END: AssessmentCriteriaList */}

      {/* BEGIN: FloatingBottomActionBar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="w-full max-w-md p-4 pb-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent pointer-events-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center space-x-2.5 shadow-[0_10px_25px_-5px_rgba(5,150,105,0.25),0_4px_6px_-2px_rgba(5,150,105,0.1)] active:scale-98 transition-all duration-200 cursor-pointer disabled:opacity-50"
            type="button"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                <span className="tracking-wide uppercase font-semibold text-[13px]">SIMPAN NILAI</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* END: FloatingBottomActionBar */}
    </div>
  );
}
