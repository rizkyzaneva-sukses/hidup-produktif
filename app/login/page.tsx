'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        setError('Username atau password salah.');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🕌</span>
          <h1 className="mt-4 text-xl font-bold text-white">Hidup Produktif Berkah</h1>
          <p className="text-slate-400 text-sm mt-1">Masuk untuk melanjutkan</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                className="w-full bg-slate-800 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-slate-800 border border-slate-600/50 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Password"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-slate-500 text-xs">
              Belum punya akun?{' '}
              <button
                onClick={() => {
                  const u = prompt('Username (min. 3 karakter):');
                  if (!u || u.length < 3) return;
                  const p = prompt('Password (min. 6 karakter):');
                  if (!p || p.length < 6) return;
                  const n = prompt('Nama lengkap (opsional, Enter untuk skip):');
                  fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u.toLowerCase().trim(), password: p, nama: n || undefined }),
                  }).then(r => r.json()).then(d => {
                    if (d.ok) { window.location.href = '/'; }
                    else { alert(d.error || 'Gagal register'); }
                  });
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >Daftar sekarang</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
