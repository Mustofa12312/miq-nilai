import { useState } from 'react';
import { Search, Plus, Upload, MoreHorizontal } from 'lucide-react';

// MOCK DATA
const MOCK_STUDENTS = [
  { id: 1, name: 'Ahmad Fulan', className: 'A1', level: "Al-Qur'an I", status: 'Aktif' },
  { id: 2, name: 'Budi Santoso', className: 'A1', level: "Al-Qur'an I", status: 'Aktif' },
  { id: 3, name: 'Mustofa Kamal', className: 'B1', level: "Al-Qur'an II", status: 'Aktif' },
  { id: 4, name: 'Fatimah Az-Zahra', className: 'C1', level: "Al-Qur'an III", status: 'Aktif' },
];

export default function StudentManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = MOCK_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Santri</h2>
          <p className="text-gray-500">Kelola data santri, kelas, dan status keaktifan.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            <Upload size={18} />
            Import Excel
          </button>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 font-medium transition-colors">
            <Plus size={18} />
            Tambah Santri
          </button>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama santri atau kelas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary">
            <option>Semua Tingkatan</option>
            <option>Al-Qur'an I</option>
            <option>Al-Qur'an II</option>
            <option>Al-Qur'an III</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Nama Santri</th>
                <th className="p-4 font-medium">Kelas</th>
                <th className="p-4 font-medium">Tingkatan</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{student.name}</td>
                    <td className="p-4 text-gray-600">{student.className}</td>
                    <td className="p-4 text-gray-600">{student.level}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {student.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Tidak ada santri yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
