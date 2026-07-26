import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <div className="flex h-screen w-full bg-gray-50 text-left">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary tracking-tight">MIQ Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent-bg text-accent font-medium">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/admin/students" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
            <Users size={20} />
            Santri
          </Link>
          <Link to="/admin/exams" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
            <BookOpen size={20} />
            Ujian
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
            <Settings size={20} />
            Pengaturan
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-error hover:bg-red-50 font-medium transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">MIQ Admin</h1>
          <button onClick={() => signOut()} className="text-error p-2">
            <LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
