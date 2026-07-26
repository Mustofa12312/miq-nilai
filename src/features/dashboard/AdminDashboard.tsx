export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Admin</h2>
        <p className="text-gray-500">Ringkasan ujian periode ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Santri Dinilai</p>
          <p className="text-3xl font-bold text-gray-900">124</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Kelas Selesai</p>
          <p className="text-3xl font-bold text-gray-900">8 / 15</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Penguji Aktif</p>
          <p className="text-3xl font-bold text-gray-900">5</p>
        </div>
      </div>
    </div>
  );
}
