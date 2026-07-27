import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Settings, LogOut,
  FileText, UserCog, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/students', icon: Users, label: 'Santri' },
  { to: '/admin/classes', icon: BookOpen, label: 'Kelas' },
  { to: '/admin/exams', icon: Settings, label: 'Ujian' },
  { to: '/admin/reports', icon: FileText, label: 'Laporan' },
  { to: '/admin/users', icon: UserCog, label: 'Pengguna' },
];

export default function AdminLayout() {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Bottom nav: show max 5 items on mobile
  const bottomNavItems = navItems.slice(0, 5);

  return (
    <div className="flex h-screen w-full bg-gray-50 text-left">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">MIQ Admin</h1>
              <p className="text-xs text-gray-400">Smart Assessment</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={20} className={active ? 'text-emerald-600' : ''} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto text-emerald-400" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          {profile && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{profile.email}</p>
            </div>
          )}
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">MIQ Admin</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Panel */}
            <div className="relative ml-auto w-72 bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{profile?.full_name || 'Admin'}</p>
                  <p className="text-xs text-gray-400">{profile?.email || ''}</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const active = isActive(item.to, item.exact);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all ${
                        active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon size={20} className={active ? 'text-emerald-600' : ''} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-gray-100">
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
                >
                  <LogOut size={20} />
                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 pb-20 md:pb-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30 safe-area-bottom">
          {bottomNavItems.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 transition-colors ${
                  active ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                <item.icon size={20} className={active ? 'text-emerald-600' : 'text-gray-400'} />
                <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
                {active && <div className="w-5 h-0.5 bg-emerald-500 rounded-full mt-0.5" />}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
