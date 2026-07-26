export default function ExaminerDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Assalamu'alaikum, Ust. Ahmad</h2>
        <p className="text-sm text-gray-500">Periode: Semester Genap 2027</p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">Kelas Tugas Anda</h3>
        <div className="space-y-3">
          {/* Class Card */}
          <button className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:scale-95 transition-transform flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900 text-lg">Kelas B4</p>
              <p className="text-sm text-gray-500">Al-Qur'an II • 34 Santri</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-primary bg-accent-bg px-2 py-1 rounded-full">18 Dinilai</p>
            </div>
          </button>
          
          <button className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:scale-95 transition-transform flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900 text-lg">Kelas B5</p>
              <p className="text-sm text-gray-500">Al-Qur'an II • 30 Santri</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">0 Dinilai</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
