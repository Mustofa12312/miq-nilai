import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (profile) {
        if (['super_admin', 'admin'].includes(profile.role)) {
          navigate('/admin', { replace: true });
        } else if (profile.role === 'examiner') {
          navigate('/examiner', { replace: true });
        }
      } else {
        setError('Login berhasil, namun profil Admin/Penguji tidak ditemukan. Pastikan Anda telah memasukkan User UID ke tabel "profiles" di Supabase.');
        setIsLoading(false);
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
      // Success - AuthContext will detect the session change and trigger the useEffect above
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-10">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5 transform transition-transform hover:scale-105">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">MIQ Smart Assessment</h1>
        <p className="text-gray-500 font-medium">Selamat datang! Silakan masuk ke akun Anda.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-error text-sm rounded-xl border border-red-100 flex items-start gap-3">
          <div className="mt-0.5">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </div>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Alamat Email</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="email"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all"
              placeholder="admin@miq.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-emerald-500 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-emerald-500/20 transform transition-all active:scale-[0.98] flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Masuk Sekarang</span>
            </>
          )}
        </button>
      </form>
      
      {!import.meta.env.VITE_SUPABASE_URL && (
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-amber-600/80 mb-4 text-center tracking-wide uppercase">Mode Testing (Tanpa DB)</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="flex-1 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm"
            >
              Mode Admin
            </button>
            <button
              onClick={() => navigate('/examiner')}
              className="flex-1 bg-teal-50 border border-teal-100 hover:bg-teal-100 text-teal-700 text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm"
            >
              Mode Penguji
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
