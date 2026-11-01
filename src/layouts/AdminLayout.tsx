import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Settings, LogOut,
  FileText, UserCog, Menu, X, ChevronRight, CheckSquare, Layers, Building2, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/students', icon: Users, label: 'Santri' },
  { to: '/admin/rantings', icon: Building2, label: 'Ranting' },
  { to: '/admin/levels', icon: Layers, label: 'Tingkatan' },
  { to: '/admin/classes', icon: BookOpen, label: 'Kelas' },
  { to: '/admin/exams', icon: Settings, label: 'Ujian' },
  { to: '/admin/assignments', icon: Users, label: 'Plotting' },
  { to: '/admin/activity', icon: Activity, label: 'Aktivitas Penguji' },
  { to: '/admin/verification', icon: CheckSquare, label: 'Verifikasi' },
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

  // Mobile bottom nav items: 4 primary shortcuts + 1 "Lainnya" button to open drawer
  const bottomPrimaryItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/students', icon: Users, label: 'Santri' },
    { to: '/admin/classes', icon: BookOpen, label: 'Kelas' },
    { to: '/admin/reports', icon: FileText, label: 'Laporan' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] text-left">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-white border-r border-[#EEF0F2] hidden md:flex flex-col justify-between shrink-0">
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="px-6 pt-6 pb-5 flex items-center gap-3.5 border-b border-[#F4F5F7]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[17px] tracking-tight text-slate-900 leading-tight">MIQ Admin</h1>
              <p className="text-[12px] text-slate-400 font-medium">Smart Assessment</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-[14px] transition-all ${
                    active
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={18}
                      className={`transition-colors ${active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {active && (
                    <ChevronRight size={15} className="text-brand-500 opacity-80" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Bottom User Info & Logout */}
          <div className="p-4 border-t border-[#EEF0F2]">
            {profile && (
              <div className="px-3 py-2 mb-2 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="text-[13.5px] font-semibold text-slate-800 leading-snug truncate">
                  {profile.full_name || 'Admin MIQ'}
                </div>
                <div className="text-[11.5px] text-slate-400 truncate font-normal">
                  {profile.email || 'admin@miq.id'}
                </div>
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50/80 transition-colors text-[13.5px] font-medium"
              type="button"
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header (Apple Frosted Glass) */}
        <header className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-30 safe-top">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-xs">
              <BookOpen size={16} />
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 leading-tight">MIQ Admin</h1>
              <p className="text-[10.5px] text-slate-400 font-medium">Smart Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 active:scale-95 rounded-xl transition-all"
              aria-label="Buka Menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {/* Mobile Slide-out Menu (Drawer) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Panel */}
            <div className="relative ml-auto w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between safe-top">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-xs">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-[15px] text-slate-900">{profile?.full_name || 'Admin MIQ'}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[170px]">{profile?.email || ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  aria-label="Tutup"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Menu Utama
                </div>
                {navItems.map((item) => {
                  const active = isActive(item.to, item.exact);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                        active
                          ? 'bg-brand-50 text-brand-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={active ? 'text-brand-600' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </div>
                      {active && <ChevronRight size={14} className="text-brand-500" />}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 safe-bottom">
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="flex w-full items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-medium text-sm transition-colors"
                >
                  <LogOut size={16} />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 lg:p-9 pb-24 md:pb-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation (iOS Apple TabBar Style) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/70 flex z-30 safe-bottom shadow-lg">
          {bottomPrimaryItems.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
                  active ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <item.icon size={20} className={active ? 'text-brand-600 stroke-[2.2]' : 'text-slate-400'} />
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-600" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${active ? 'text-brand-700 font-semibold' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          {/* 5th slot: Menu Drawer Trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-slate-600 transition-colors"
            type="button"
          >
            <div className="relative">
              <Menu size={20} className="text-slate-400" />
            </div>
            <span className="text-[10px] mt-1 font-medium text-slate-500">
              Lainnya
            </span>
          </button>
        </nav>
      </main>
    </div>
  );
}
