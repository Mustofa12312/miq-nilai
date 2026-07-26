import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (['super_admin', 'admin'].includes(profile.role)) {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'examiner') {
        navigate('/examiner', { replace: true });
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
    <div className="p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MIQ Smart Assessment</h1>
        <p className="text-gray-500">Silakan login untuk melanjutkan</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-error text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="admin@miq.com atau penguji@miq.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Masuk'
          )}
        </button>
      </form>
      
      {!import.meta.env.VITE_SUPABASE_URL && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3 text-center">MODE TESTING (Supabase belum di-setup)</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Coba UI Admin
            </button>
            <button
              onClick={() => navigate('/examiner')}
              className="flex-1 bg-accent-bg hover:bg-accent/20 text-accent text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Coba UI Penguji
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
