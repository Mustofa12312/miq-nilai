import { Plus, MoreHorizontal } from 'lucide-react';

// MOCK DATA
const MOCK_CLASSES = [
  { id: 1, name: 'A1', level: "Al-Qur'an I", total_students: 34, active: true },
  { id: 2, name: 'A2', level: "Al-Qur'an I", total_students: 31, active: true },
  { id: 3, name: 'B1', level: "Al-Qur'an II", total_students: 29, active: true },
  { id: 4, name: 'B2', level: "Al-Qur'an II", total_students: 30, active: true },
  { id: 5, name: 'C1', level: "Al-Qur'an III", total_students: 35, active: true },
];

export default function ClassManagement() {
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
            <span className="text-sm text-gray-500">{MOCK_CLASSES.length} Kelas Aktif</span>
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
                {MOCK_CLASSES.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{cls.name}</td>
                    <td className="p-4 text-gray-600">{cls.level}</td>
                    <td className="p-4 text-gray-600">{cls.total_students}</td>
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
            {["Al-Qur'an I", "Al-Qur'an II", "Al-Qur'an III", "Tahfidz"].map((level, idx) => (
              <li key={idx} className="p-4 hover:bg-gray-50 flex justify-between items-center group cursor-pointer transition-colors">
                <span className="font-medium text-gray-700">{level}</span>
                <span className="text-gray-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
