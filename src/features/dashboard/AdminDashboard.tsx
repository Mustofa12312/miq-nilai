import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalScored: 0,
    totalClasses: 0,
    finishedClasses: 0,
    activeExaminers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Total Santri Dinilai (Jumlah record di tabel scores)
        const { count: totalScored } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true });

        // 2. Total Kelas
        const { count: totalClasses } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });

        // 3. Kelas Selesai (Jumlah unik class_id di tabel score_sessions)
        const { data: sessions } = await supabase
          .from('score_sessions')
          .select('class_id');
        
        const finishedClasses = new Set(sessions?.map(s => s.class_id)).size;

        // 4. Penguji Aktif
        const { count: activeExaminers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'examiner');

        setStats({
          totalScored: totalScored || 0,
          totalClasses: totalClasses || 0,
          finishedClasses: finishedClasses || 0,
          activeExaminers: activeExaminers || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Admin</h2>
        <p className="text-gray-500">Ringkasan ujian periode ini.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat Cards */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Santri Dinilai</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalScored}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Kelas Selesai</p>
            <p className="text-3xl font-bold text-gray-900">{stats.finishedClasses} / {stats.totalClasses}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-1">Penguji Aktif</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeExaminers}</p>
          </div>
        </div>
      )}
    </div>
  );
}
