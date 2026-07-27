import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Shield, LogOut } from 'lucide-react';

export default function ExaminerProfile() {
  const { profile, user, signOut } = useAuth();

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={48} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Penguji'}</h2>
        <p className="text-sm text-gray-500 capitalize">{profile?.role || 'Examiner'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
            <User size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-gray-500 font-medium">Nama Lengkap</p>
            <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name || '-'}</p>
          </div>
        </div>

        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
            <Mail size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-gray-500 font-medium">Email Terdaftar</p>
            <p className="text-sm font-bold text-gray-900 truncate">{user?.email || '-'}</p>
          </div>
        </div>

        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Hak Akses</p>
            <p className="text-sm font-bold text-gray-900 uppercase">{profile?.role || '-'}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => signOut()}
        className="w-full bg-error/10 text-error hover:bg-error hover:text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2"
      >
        <LogOut size={20} />
        Keluar dari Aplikasi (Logout)
      </button>
    </div>
  );
}
