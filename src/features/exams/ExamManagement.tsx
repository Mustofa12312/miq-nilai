import { Plus, Settings } from 'lucide-react';

export default function ExamManagement() {
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
            <button className="flex items-center gap-1 text-primary hover:text-emerald-700 text-sm font-medium">
              <Plus size={16} /> Tambah
            </button>
          </div>
          <ul className="divide-y divide-gray-100">
            <li className="p-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Semester Genap 2027</p>
                <p className="text-xs text-gray-500">01 Apr 2027 - 15 Apr 2027</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span>
            </li>
            <li className="p-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">Semester Ganjil 2026</p>
                <p className="text-xs text-gray-500">01 Okt 2026 - 15 Okt 2026</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Selesai</span>
            </li>
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
              <div>
                <h4 className="text-sm font-bold text-gray-500 mb-2">TAJWID</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <span className="font-medium text-gray-700">Makhroj</span>
                    <span className="text-sm text-gray-500">Maks: 30 (Potong -2)</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <span className="font-medium text-gray-700">Sifatul Huruf</span>
                    <span className="text-sm text-gray-500">Maks: 20 (Potong -1)</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-500 mb-2">FASOHAH</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <span className="font-medium text-gray-700">Waqof Ibtida</span>
                    <span className="text-sm text-gray-500">Maks: 10 (Potong -1)</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-primary hover:text-primary transition-colors">
              + Tambah Kriteria Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
