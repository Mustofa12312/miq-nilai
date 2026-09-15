import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Criteria, Student } from '../../types';

export default function ScoringForm() {
  const navigate = useNavigate();
  const { classId, studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // FIX: Baca periodId dan examTypeId dari URL query params (dikirim dari StudentList)
  // Jika tidak ada di URL, akan di-resolve dari database di dalam handleSave
  const urlPeriodId = searchParams.get('periodId') ? Number(searchParams.get('periodId')) : null;
  const urlExamTypeId = searchParams.get('examTypeId') ? Number(searchParams.get('examTypeId')) : null;

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

        // Fetch criteria dari DB (bukan hardcode)
        const { data: cr } = await supabase.from('criteria').select('*').eq('active', true).order('sort_order', { ascending: true });
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

  const totalScore = useMemo(() => {
    return criteriaList.reduce((acc, criteria) => {
      const criteriaMistakes = mistakes[criteria.id] || 0;
      const penalty = criteriaMistakes * criteria.deduction;
      let finalCriteriaScore = criteria.default_score - penalty;
      if (finalCriteriaScore < 0) finalCriteriaScore = 0;
      return acc + finalCriteriaScore;
    }, 0);
  }, [mistakes, criteriaList]);

  const handleSave = async () => {
    if (!user || !studentId || !classId) return;
    setIsSaving(true);
    
    try {
      // 1. Resolve period_id: pakai dari URL jika ada, fallback ke query DB
      let periodId = urlPeriodId;
      if (!periodId) {
        const { data: period } = await supabase.from('exam_periods').select('id').eq('active', true).maybeSingle();
        if (!period) {
          const { data: latestPeriod } = await supabase.from('exam_periods').select('id').order('start_date', { ascending: false }).limit(1).maybeSingle();
          if (!latestPeriod) throw new Error("Tidak ada data periode ujian di database. Harap buat periode ujian di menu Admin.");
          periodId = latestPeriod.id;
        } else {
          periodId = period.id;
        }
      }

      // FIX: Resolve exam_type_id: pakai dari URL jika ada, fallback ke pertama di DB
      let examTypeId = urlExamTypeId;
      if (!examTypeId) {
        const { data: defaultExamType } = await supabase.from('exam_types').select('id').order('id', { ascending: true }).limit(1).maybeSingle();
        if (!defaultExamType) throw new Error("Tidak ada data jenis ujian di database. Harap tambahkan jenis ujian di menu Admin.");
        examTypeId = defaultExamType.id;
      }

      // FIX: Cek BR-001 — apakah santri sudah punya nilai di periode + jenis ujian ini?
      const { data: existingScore } = await supabase
        .from('scores')
        .select('id, locked')
        .eq('student_id', parseInt(studentId))
        .eq('period_id', periodId)
        .eq('exam_type_id', examTypeId)
        .maybeSingle();

      if (existingScore) {
        if (existingScore.locked) {
          throw new Error("Nilai santri ini sudah dikunci dan tidak dapat diubah.");
        }
        throw new Error("Santri ini sudah memiliki nilai untuk periode ujian ini.");
      }

      // 2. Create score_session
      const { data: session, error: sessionErr } = await supabase
        .from('score_sessions')
        .insert({
          examiner_id: user.id,
          class_id: parseInt(classId),
          period_id: periodId,
          exam_type_id: examTypeId,
          finished_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (sessionErr) throw sessionErr;

      // Hitung grade berbasis persentase
      const maxPossibleScore = criteriaList.reduce((sum, c) => sum + c.default_score, 0);
      const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      const grade = percentage >= 90 ? 'Mumtaz'
        : percentage >= 80 ? 'Jayyid Jiddan'
        : percentage >= 70 ? 'Jayyid'
        : percentage >= 60 ? 'Maqbul'
        : 'I\'adah';

      // 3. Create score — FIX: sertakan period_id dan exam_type_id sesuai BR-001
      const { data: scoreRec, error: scoreErr } = await supabase
        .from('scores')
        .insert({
          session_id: session.id,
          student_id: parseInt(studentId),
          total_score: totalScore,
          grade,
          period_id: periodId,
          exam_type_id: examTypeId,
        })
        .select()
        .single();

      if (scoreErr) {
        if (scoreErr.code === '23505') {
          throw new Error("Santri ini sudah memiliki nilai untuk periode ujian ini.");
        }
        throw scoreErr;
      }

      // 4. Create score_details
      const detailsToInsert = criteriaList.map(cr => {
        const mstk = mistakes[cr.id] || 0;
        return {
          score_id: scoreRec.id,
          criteria_id: cr.id,
          mistakes: mstk,
          score: Math.max(0, cr.default_score - (mstk * cr.deduction))
        };
      });

      if (detailsToInsert.length > 0) {
        const { error: detailErr } = await supabase.from('score_details').insert(detailsToInsert);
        if (detailErr) throw detailErr;
      }

      alert(`Nilai berhasil disimpan! Total: ${totalScore} (${grade})`);
      navigate(-1);

    } catch (err: any) {
      console.error('Error saving score:', err);
      alert("Gagal menyimpan nilai: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat kriteria...</div>;

  const categories = Array.from(new Set(criteriaList.map(c => c.category)));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-lg active:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{student?.full_name || '...'}</h2>
          <p className="text-sm text-gray-500">ID Santri: {studentId} • Penilaian</p>
        </div>
      </div>

      {/* Realtime Score Badge */}
      <div className="sticky top-0 z-20 bg-primary text-white p-4 rounded-xl shadow-lg flex justify-between items-center">
        <span className="font-medium">Total Nilai Otomatis</span>
        <span className="text-3xl font-bold">{totalScore}</span>
      </div>

      {/* Scoring List */}
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 px-1">{category}</h3>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
              {criteriaList.filter(c => c.category === category).map(criteria => {
                const currentMistakes = mistakes[criteria.id] || 0;
                const currentScore = Math.max(0, criteria.default_score - (currentMistakes * criteria.deduction));

                return (
                  <div key={criteria.id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{criteria.name}</p>
                        <p className="text-xs text-gray-500">Maks: {criteria.default_score} • Potongan: -{criteria.deduction}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{currentScore}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="text-sm font-medium text-gray-600 px-2">Kesalahan</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleMistakeChange(criteria.id, -1)}
                          disabled={currentMistakes === 0}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg active:bg-gray-100 disabled:opacity-50 text-error"
                        >
                          <Minus size={20} />
                        </button>
                        <span className="text-xl font-bold w-6 text-center text-gray-900">{currentMistakes}</span>
                        <button 
                          onClick={() => handleMistakeChange(criteria.id, 1)}
                          disabled={currentScore === 0}
                          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg active:bg-gray-100 disabled:opacity-50 text-accent"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 max-w-md mx-auto z-30 pointer-events-none">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-primary hover:bg-emerald-600 shadow-xl text-white font-bold py-4 rounded-xl transition-transform active:scale-95 flex justify-center items-center gap-2 pointer-events-auto"
        >
          {isSaving ? (
             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={24} />
              SIMPAN NILAI
            </>
          )}
        </button>
      </div>
    </div>
  );
}
