import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Class, Level } from '../../types';

interface ClassData extends Class {
  level?: Level;
  student_count?: number;
}

export default function ClassManagement() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch levels
        const { data: levelsData } = await supabase
          .from('levels')
          .select('*')
          .order('sort_order', { ascending: true });
        if (levelsData) setLevels(levelsData);

        // Fetch classes
        const { data: classesData } = await supabase
          .from('classes')
          .select(`
            *,
            level:levels(*)
          `)
          .order('name', { ascending: true });
        
        if (classesData) {
          // For a real app, we might want to do a count query or a view
          // For MVP, we'll just fetch all students and count them client side, or ignore the count for now.
          // Let's just mock the student count if we can't do a quick join.
          const { data: studentCounts } = await supabase
             .from('students')
             .select('class_id');
             
          const counts: Record<number, number> = {};
          studentCounts?.forEach(s => {
             counts[s.class_id] = (counts[s.class_id] || 0) + 1;
          });
          
          const mapped = classesData.map(c => ({
            ...c,
            student_count: counts[c.id] || 0
          }));
          
          setClasses(mapped as any);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Kelas & Tingkat</h2>
          <p className="text-gray-500">Atur pembagian kelas berdasarkan tingkatan Al-Qur'an.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 font-medium transition-colors">
            <Plus size={18} />
            Tambah Kelas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Daftar Kelas</h3>
            <span className="text-sm text-gray-500">{classes.length} Kelas Aktif</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Nama Kelas</th>
                  <th className="p-4 font-medium">Tingkatan</th>
                  <th className="p-4 font-medium">Jml Santri</th>
                  <th className="p-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                   <tr><td colSpan={4} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
                ) : classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{cls.name}</td>
                    <td className="p-4 text-gray-600">{cls.level?.name || '-'}</td>
                    <td className="p-4 text-gray-600">{cls.student_count}</td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-primary p-1 rounded-md hover:bg-gray-100 transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Levels List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Tingkatan (Levels)</h3>
            <button className="text-primary hover:text-emerald-700 text-sm font-medium">Tambah</button>
          </div>
          <ul className="divide-y divide-gray-100">
            {loading ? (
               <li className="p-4 text-center text-gray-500">Memuat data...</li>
            ) : levels.map((level) => (
              <li key={level.id} className="p-4 hover:bg-gray-50 flex justify-between items-center group cursor-pointer transition-colors">
                <span className="font-medium text-gray-700">{level.name}</span>
                <span className="text-gray-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
