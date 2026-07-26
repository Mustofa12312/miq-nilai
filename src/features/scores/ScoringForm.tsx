import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Save } from 'lucide-react';

// MOCK DATA CRITERIA
const MOCK_CRITERIA = [
  { id: 1, category: 'TAJWID', name: 'Makhroj', default_score: 30, deduction: 2 },
  { id: 2, category: 'TAJWID', name: 'Sifatul Huruf', default_score: 20, deduction: 1 },
  { id: 3, category: 'TAJWID', name: 'Ahkamul Huruf', default_score: 30, deduction: 2 },
  { id: 4, category: 'FASOHAH', name: 'Waqof Ibtida', default_score: 10, deduction: 1 },
  { id: 5, category: 'FASOHAH', name: 'Kelancaran', default_score: 10, deduction: 1 },
];

export default function ScoringForm() {
  const navigate = useNavigate();
  const { studentId } = useParams();

  // State: Record mistakes per criteria ID
  const [mistakes, setMistakes] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleMistakeChange = (id: number, delta: number) => {
    setMistakes((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next < 0) return prev; // Cannot have negative mistakes
      return { ...prev, [id]: next };
    });
  };

  // Auto calculate total score
  const totalScore = useMemo(() => {
    return MOCK_CRITERIA.reduce((acc, criteria) => {
      const criteriaMistakes = mistakes[criteria.id] || 0;
      const penalty = criteriaMistakes * criteria.deduction;
      let finalCriteriaScore = criteria.default_score - penalty;
      if (finalCriteriaScore < 0) finalCriteriaScore = 0; // Prevent negative scores per criteria
      return acc + finalCriteriaScore;
    }, 0);
  }, [mistakes]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API Call
    setTimeout(() => {
      setIsSaving(false);
      // Navigate back to list
      navigate(-1);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Info */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-lg active:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ahmad Fulan</h2>
          <p className="text-sm text-gray-500">ID Santri: {studentId} • Kelas B4</p>
        </div>
      </div>

      {/* Realtime Score Badge */}
      <div className="sticky top-0 z-20 bg-primary text-white p-4 rounded-xl shadow-lg flex justify-between items-center">
        <span className="font-medium">Total Nilai Otomatis</span>
        <span className="text-3xl font-bold">{totalScore}</span>
      </div>

      {/* Scoring List */}
      <div className="space-y-6">
        {['TAJWID', 'FASOHAH'].map(category => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-bold text-gray-500 px-1">{category}</h3>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
              {MOCK_CRITERIA.filter(c => c.category === category).map(criteria => {
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

      {/* Floating Action Button for Saving */}
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
