import { Outlet, Link } from 'react-router-dom';
import { Home, UserCircle, LogOut } from 'lucide-react';

export default function ExaminerLayout() {
  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-gray-50 text-left relative shadow-xl overflow-hidden border-x border-gray-200">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-sm z-10 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">Penilaian MIQ</h1>
        <button className="p-1 rounded hover:bg-white/10 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center p-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <Link to="/examiner" className="flex flex-col items-center gap-1 text-primary">
          <Home size={24} />
          <span className="text-[10px] font-medium">Beranda</span>
        </Link>
        <Link to="/examiner/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
          <UserCircle size={24} />
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
