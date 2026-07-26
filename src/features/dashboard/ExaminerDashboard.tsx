import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Class, ExamPeriod, Level } from '../../types';

interface ClassWithLevel extends Class {
  level: Level;
}

export default function ExaminerDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [classes, setClasses] = useState<ClassWithLevel[]>([]);
  const [activePeriod, setActivePeriod] = useState<ExamPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch active exam period
        const { data: periodData } = await supabase
          .from('exam_periods')
          .select('*')
          .eq('active', true)
          .single();
          
        if (periodData) {
          setActivePeriod(periodData);
        }
        
        // 2. Fetch all classes
        const { data: classData, error } = await supabase
          .from('classes')
          .select(`
            *,
            level:levels(*)
          `)
          .order('level_id'); 

        if (!error && classData) {
          setClasses(classData as any);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.level?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by level
  const groupedClasses = filteredClasses.reduce((acc, curr) => {
    const levelName = curr.level?.name || 'Lainnya';
    if (!acc[levelName]) acc[levelName] = [];
    acc[levelName].push(curr);
    return acc;
  }, {} as Record<string, ClassWithLevel[]>);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Assalamu'alaikum, {profile?.full_name || 'Penguji'}</h2>
        <p className="text-sm text-gray-500">Periode: {activePeriod?.name || 'Tidak ada periode aktif'}</p>
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
        
        {Object.keys(groupedClasses).length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Tidak ada kelas yang ditemukan.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedClasses).map(levelName => (
              <div key={levelName}>
                <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase px-1">{levelName}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupedClasses[levelName].map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => navigate(`/examiner/class/${cls.id}`)}
                      className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-primary active:scale-95 transition-all flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">Kelas {cls.name}</p>
                        <p className="text-sm text-gray-500">{cls.level?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium px-3 py-1 rounded-full text-primary bg-primary/10">
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
