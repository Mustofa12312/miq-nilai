import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// MOCK DATA
const MOCK_STUDENTS = [
  { id: 1, name: 'Ahmad Fulan', status: 'BELUM' },
  { id: 2, name: 'Budi Santoso', status: 'BELUM' },
  { id: 3, name: 'Mustofa Kamal', status: 'SUDAH' },
  { id: 4, name: 'Zaid Abdullah', status: 'BELUM' },
];

export default function StudentList() {
  const navigate = useNavigate();
  const { classId } = useParams();

  const total = MOCK_STUDENTS.length;
  const scored = MOCK_STUDENTS.filter(s => s.status === 'SUDAH').length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-lg active:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kelas B4</h2>
          <p className="text-sm text-gray-500">Pilih Santri untuk dinilai</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-xs text-gray-500 font-medium">Total: {total} Santri</p>
          <p className="text-sm font-bold text-gray-900">{scored} Sudah • {total - scored} Belum</p>
        </div>
        <div className="text-primary font-bold text-xl">
          {Math.round((scored / total) * 100)}%
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {MOCK_STUDENTS.map((student) => (
          <button
            key={student.id}
            onClick={() => navigate(`/examiner/class/${classId}/student/${student.id}`)}
            className="w-full text-left p-4 active:bg-gray-50 transition-colors flex justify-between items-center group"
          >
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className={`w-3 h-3 rounded-full ${student.status === 'SUDAH' ? 'bg-primary' : 'bg-warning'}`} />
              <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">{student.name}</p>
            </div>
            {student.status === 'SUDAH' && (
              <span className="text-xs font-medium text-primary bg-accent-bg px-2 py-1 rounded-full">
                Selesai
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
