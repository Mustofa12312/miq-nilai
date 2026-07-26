import { useState, useEffect } from 'react';
import { Plus, Settings, X, Loader2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ExamPeriod } from '../../types';

interface Criteria {
  id: number;
  category: string;
  name: string;
  default_score: number;
  deduction: number;
  sort_order: number;
  active: boolean;
}

export default function ExamManagement() {
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [periodForm, setPeriodForm] = useState({ name: '', start_date: '', end_date: '', active: true });
  const [criteriaForm, setCriteriaForm] = useState({ category: 'TAJWID', name: '', default_score: 100, deduction: 1, sort_order: 1 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [periodsRes, criteriaRes] = await Promise.all([
        supabase.from('exam_periods').select('*').order('start_date', { ascending: false }),
        supabase.from('criteria').select('*').order('sort_order')
      ]);

      if (periodsRes.data) setPeriods(periodsRes.data);
      if (criteriaRes.data) setCriteria(criteriaRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await supabase.from('exam_periods').insert([periodForm]);
      setShowPeriodModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await supabase.from('criteria').insert([criteriaForm]);
      setShowCriteriaModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Group criteria by category
  const groupedCriteria = criteria.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, Criteria[]>);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Ujian</h2>
          <p className="text-gray-500">Kelola periode ujian, jenis ujian, dan kriteria penilaian.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Periods */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Periode Ujian</h3>
            <button 
              onClick={() => setShowPeriodModal(true)}
              className="flex items-center gap-1 text-primary hover:text-emerald-700 text-sm font-medium"
            >
              <Plus size={16} /> Tambah
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            {periods.map(period => (
              <li key={period.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{period.name}</p>
                  <p className="text-xs text-gray-500">{period.start_date} s/d {period.end_date}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${period.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {period.active ? 'Aktif' : 'Selesai'}
                </span>
              </li>
            ))}
            {periods.length === 0 && (
              <li className="p-4 text-center text-gray-500">Belum ada periode ujian.</li>
            )}
          </ul>
        </div>

        {/* Criteria */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Kriteria Penilaian (Al-Qur'an)</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <Settings size={18} />
            </button>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {Object.keys(groupedCriteria).map(category => (
                <div key={category}>
                  <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase">{category}</h4>
                  <div className="space-y-2">
                    {groupedCriteria[category].map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="text-sm text-gray-500">Maks: {item.default_score} (Potong -{item.deduction})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {criteria.length === 0 && (
                <p className="text-center text-gray-500 py-4">Belum ada kriteria penilaian.</p>
              )}
            </div>
            <button 
              onClick={() => setShowCriteriaModal(true)}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors"
            >
              + Tambah Kriteria Baru
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah Periode */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSavePeriod} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Tambah Periode Ujian</h3>
              <button type="button" onClick={() => setShowPeriodModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Periode</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Contoh: Semester Ganjil 2026" 
                  value={periodForm.name} onChange={e => setPeriodForm({...periodForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tgl Mulai</label>
                  <input required type="date" className="w-full px-3 py-2 border rounded-lg" 
                    value={periodForm.start_date} onChange={e => setPeriodForm({...periodForm, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tgl Selesai</label>
                  <input required type="date" className="w-full px-3 py-2 border rounded-lg" 
                    value={periodForm.end_date} onChange={e => setPeriodForm({...periodForm, end_date: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activePeriod" checked={periodForm.active} onChange={e => setPeriodForm({...periodForm, active: e.target.checked})} className="rounded text-primary" />
                <label htmlFor="activePeriod" className="text-sm font-medium text-gray-700">Periode Aktif</label>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button type="button" onClick={() => setShowPeriodModal(false)} className="px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex gap-2 items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Tambah Kriteria */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveCriteria} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Tambah Kriteria Penilaian</h3>
              <button type="button" onClick={() => setShowCriteriaModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori (TAJWID / FASOHAH, dll)</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Contoh: TAJWID" 
                  value={criteriaForm.category} onChange={e => setCriteriaForm({...criteriaForm, category: e.target.value.toUpperCase()})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kriteria</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Contoh: Makhroj" 
                  value={criteriaForm.name} onChange={e => setCriteriaForm({...criteriaForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Maksimal</label>
                  <input required type="number" className="w-full px-3 py-2 border rounded-lg" 
                    value={criteriaForm.default_score} onChange={e => setCriteriaForm({...criteriaForm, default_score: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pengurangan / Kesalahan</label>
                  <input required type="number" className="w-full px-3 py-2 border rounded-lg" 
                    value={criteriaForm.deduction} onChange={e => setCriteriaForm({...criteriaForm, deduction: Number(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button type="button" onClick={() => setShowCriteriaModal(false)} className="px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex gap-2 items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
