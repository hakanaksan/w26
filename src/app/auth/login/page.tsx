'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-blue-200">🏆</div>
          <h1 className="text-2xl font-black text-gray-900">Giriş Yap</h1>
          <p className="text-gray-500 mt-2">Dünya Kupası 2026 tahminlerine devam et</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-field w-full" placeholder="ornek@email.com" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şifre</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field w-full" placeholder="••••••" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Hesabın yok mu? <a href="/auth/register" className="text-blue-600 font-semibold hover:underline">Kayıt ol</a>
          </p>
        </form>
      </div>
    </div>
  );
}