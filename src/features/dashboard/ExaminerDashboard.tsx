import { useNavigate } from 'react-router-dom';

// MOCK DATA
const MOCK_ASSIGNMENTS = [
  { id: 1, class_id: 4, name: 'Kelas B4', level: "Al-Qur'an II", total_students: 34, scored: 18 },
  { id: 2, class_id: 5, name: 'Kelas B5', level: "Al-Qur'an II", total_students: 30, scored: 0 },
];

export default function ExaminerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Assalamu'alaikum, Penguji</h2>
        <p className="text-sm text-gray-500">Periode: Semester Genap 2027</p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">Kelas Tugas Anda</h3>
        <div className="space-y-3">
          {MOCK_ASSIGNMENTS.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => navigate(`/examiner/class/${assignment.class_id}`)}
              className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:scale-95 transition-transform flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-gray-900 text-lg">{assignment.name}</p>
                <p className="text-sm text-gray-500">{assignment.level} • {assignment.total_students} Santri</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium px-2 py-1 rounded-full ${
                  assignment.scored > 0 ? 'text-primary bg-accent-bg' : 'text-gray-500 bg-gray-100'
                }`}>
                  {assignment.scored} Dinilai
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
