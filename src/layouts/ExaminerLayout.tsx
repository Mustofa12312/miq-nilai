import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ExaminerLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="w-full max-w-[420px] min-h-screen mx-auto bg-[#F6F8F9] text-slate-800 font-sans flex flex-col relative shadow-2xl md:my-4 md:rounded-[40px] md:overflow-hidden md:border md:border-slate-200/80 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header - iOS Blur Header */}
      <header className="sticky top-0 z-30 ios-blur-header border-b border-slate-200/60 safe-top">
        <div className="px-5 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <h1 className="text-[17px] font-semibold tracking-tight text-slate-900">Penilaian MIQ</h1>
          </div>
          <button 
            onClick={() => signOut()}
            aria-label="Keluar dari akun"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 active:scale-95 transition duration-150 ease-out"
            title="Keluar dari akun"
            type="button"
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation - Sleek iOS Style */}
      <nav className="sticky bottom-0 w-full ios-blur-header border-t border-slate-200/60 flex justify-around items-center py-2 px-6 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] z-30">
        <Link 
          to="/examiner" 
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all ${
            location.pathname === '/examiner' 
              ? 'text-emerald-700 font-semibold' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={22} strokeWidth={location.pathname === '/examiner' ? 2.3 : 1.8} />
          <span className="text-[11px] tracking-tight">Beranda</span>
        </Link>
        <Link 
          to="/examiner/profile" 
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all ${
            location.pathname.startsWith('/examiner/profile') 
              ? 'text-emerald-700 font-semibold' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCircle size={22} strokeWidth={location.pathname.startsWith('/examiner/profile') ? 2.3 : 1.8} />
          <span className="text-[11px] tracking-tight">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
