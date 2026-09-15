import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Layers, Plus, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Level } from '../../types';

export default function LevelManagement() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    prefix: '',
    sort_order: 0,
    active: true
  });

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLevels(data || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
      toast.error('Gagal memuat data tingkatan');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (level?: Level) => {
    if (level) {
      setEditingId(level.id);
      setFormData({
        name: level.name,
        prefix: level.prefix || '',
        sort_order: level.sort_order,
        active: level.active
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        prefix: '',
        sort_order: levels.length > 0 ? Math.max(...levels.map(l => l.sort_order)) + 1 : 1,
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('levels')
          .update(formData)
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('levels')
          .insert([formData]);
          
        if (error) throw error;
      }
      
      toast.success('Data tingkatan berhasil disimpan');
      await fetchLevels();
      closeModal();
    } catch (error) {
      console.error('Error saving level:', error);
      toast.error('Gagal menyimpan data tingkatan');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('levels')
        .update({ active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      setLevels(levels.map(l => l.id === id ? { ...l, active: !currentStatus } : l));
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Gagal mengubah status aktif');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="text-primary" />
            Manajemen Tingkatan
          </h1>
          <p className="text-gray-500 mt-1">Kelola data tingkatan kelas (misal: Al Quran I, II, III).</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Tambah Tingkatan</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Memuat data tingkatan...
          </div>
        ) : levels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Belum ada data tingkatan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-20 text-center">Urutan</th>
                  <th className="px-6 py-4">Nama Tingkatan</th>
                  <th className="px-6 py-4">Prefix</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {levels.map((level) => (
                  <tr key={level.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-center text-gray-500">{level.sort_order}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{level.name}</td>
                    <td className="px-6 py-4 text-gray-500">{level.prefix || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(level.id, level.active)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          level.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {level.active ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                            Aktif
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            Nonaktif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openModal(level)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Tingkatan' : 'Tambah Tingkatan'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Tingkatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="misal: Al Quran I"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prefix <span className="text-gray-400 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.prefix}
                      onChange={(e) => setFormData({...formData, prefix: e.target.value})}
                      placeholder="misal: AQ1"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
                    Tingkatan Aktif
                  </label>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formData.name}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-emerald-600 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
