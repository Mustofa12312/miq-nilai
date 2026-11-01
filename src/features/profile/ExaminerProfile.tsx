import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Shield, LogOut } from 'lucide-react';

export default function ExaminerProfile() {
  const { profile, user, signOut } = useAuth();

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_14px_-2px_rgba(0,0,0,0.03),0_1px_3px_0_rgba(0,0,0,0.02)] text-center">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100/40 via-teal-50/20 to-transparent pointer-events-none blur-lg"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <User size={38} />
          </div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">{profile?.full_name || 'Penguji'}</h2>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 text-xs font-semibold uppercase tracking-wider">
            {profile?.role || 'Examiner'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_14px_-2px_rgba(0,0,0,0.03),0_1px_3px_0_rgba(0,0,0,0.02)] overflow-hidden divide-y divide-slate-100">
        <div className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
            <User size={19} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] text-slate-400 font-medium">Nama Lengkap</p>
            <p className="text-[14px] font-semibold text-slate-800 truncate">{profile?.full_name || '-'}</p>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
            <Mail size={19} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] text-slate-400 font-medium">Email Terdaftar</p>
            <p className="text-[14px] font-semibold text-slate-800 truncate">{user?.email || '-'}</p>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
            <Shield size={19} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Hak Akses</p>
            <p className="text-[14px] font-semibold text-slate-800 uppercase">{profile?.role || '-'}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => signOut()}
        className="w-full bg-rose-50 border border-rose-200/60 text-rose-600 hover:bg-rose-600 hover:text-white font-semibold py-3.5 rounded-2xl transition-all flex justify-center items-center gap-2 active:scale-98 shadow-sm"
      >
        <LogOut size={18} />
        Keluar dari Akun
      </button>
    </div>
  );
}
