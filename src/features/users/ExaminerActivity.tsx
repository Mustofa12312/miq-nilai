import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExaminerActivityData {
  examiner_name: string;
  total_scored: number;
}

interface InactiveExaminer {
  examiner_name: string;
}

export default function ExaminerActivity() {
  const [loading, setLoading] = useState(true);
  const [activeExaminers, setActiveExaminers] = useState<ExaminerActivityData[]>([]);
  const [inactiveExaminers, setInactiveExaminers] = useState<InactiveExaminer[]>([]);
  const [tab, setTab] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const [examinersRes, sessionsRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name').eq('role', 'examiner'),
          supabase.from('score_sessions').select('examiner_id, examiner:profiles(full_name), id')
        ]);

        if (sessionsRes.data && examinersRes.data) {
          const countMap: Record<string, number> = {};
          const activeIds = new Set<string>();

          sessionsRes.data.forEach((s: any) => {
            const name = s.examiner?.full_name || 'Unknown';
            countMap[name] = (countMap[name] || 0) + 1;
            if (s.examiner_id) activeIds.add(s.examiner_id);
          });

          setActiveExaminers(
            Object.entries(countMap)
              .map(([examiner_name, total_scored]) => ({ examiner_name, total_scored }))
              .sort((a, b) => b.total_scored - a.total_scored)
          );

          setInactiveExaminers(
            examinersRes.data
              .filter(e => !activeIds.has(e.id))
              .map(e => ({ examiner_name: e.full_name }))
              .sort((a, b) => a.examiner_name.localeCompare(b.examiner_name))
          );
        }
      } catch (err: any) {
        toast.error('Gagal memuat aktivitas');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aktivitas Penguji</h2>
          <p className="text-gray-500">Pantau daftar seluruh penguji yang sudah atau belum menginputkan nilai.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 p-4 flex gap-3">
           <button 
             onClick={() => setTab('active')}
             className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'active' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200/50'}`}
           >
             Teraktif ({activeExaminers.length})
           </button>
           <button 
             onClick={() => setTab('inactive')}
             className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'inactive' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200/50'}`}
           >
             Belum Input ({inactiveExaminers.length})
           </button>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-primary">
            <Loader2 className="animate-spin mb-4" size={36} />
            <p className="text-gray-500 font-medium">Memuat data aktivitas...</p>
          </div>
        ) : tab === 'active' ? (
          activeExaminers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {activeExaminers.map((ea, i) => (
                <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-teal-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
                      {ea.examiner_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg mb-0.5">{ea.examiner_name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-teal-500" />
                        Sedang aktif melakukan penilaian
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold bg-teal-50 text-teal-700 border border-teal-200 px-4 py-2 rounded-full shadow-sm">
                    {ea.total_scored} Sesi
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Belum ada aktivitas penguji.</p>
            </div>
          )
        ) : (
          inactiveExaminers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {inactiveExaminers.map((ea, i) => (
                <div key={i} className="px-6 py-5 flex items-center justify-between hover:bg-red-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl">
                      {ea.examiner_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg mb-0.5">{ea.examiner_name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <AlertCircle size={16} className="text-red-500" />
                        Belum memiliki sesi penilaian
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-full shadow-sm">
                    Belum Input
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center text-gray-400">
              <CheckCircle2 size={56} className="mx-auto mb-4 text-teal-400" />
              <p className="text-xl font-bold text-gray-700 mb-1">Hebat!</p>
              <p>Semua penguji sudah mulai melakukan penilaian.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
