
import React, { useState } from 'react';
import { Icons } from '../constants';

interface LoginProps {
  onLogin: (email: string, pass: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const success = onLogin(email, password);
      if (!success) {
        setError('Email atau Password salah. Silakan coba lagi.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream relative overflow-hidden px-4">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-olive/5 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue/10 border border-brand-blue/20 rounded-2xl mb-6">
            <div className="text-brand-blue">
              <Icons.Wallet />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Laporan Keuangan <span className="text-brand-blue">Iqbal</span></h1>
          <p className="text-slate-500">Kelola finansial Anda dengan lebih elegan.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-brand-brown/20 p-8 rounded-3xl shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm mb-6 flex items-center gap-3">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-brand-brown/20 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all placeholder:text-slate-300"
                placeholder="iqbalassada17@gmail.com"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-slate-600">Password</label>
                <a href="#" className="text-xs text-brand-blue hover:text-brand-blue/80">Lupa Password?</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-brand-brown/20 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue hover:bg-brand-blue/90 disabled:bg-brand-blue/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-blue/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Masuk...
                </>
              ) : "Masuk ke Dashboard"}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Belum punya akun? <a href="#" className="text-brand-blue hover:text-brand-blue/80 font-semibold">Daftar Sekarang</a>
            </p>
          </div>
        </form>

        <div className="mt-12 flex items-center justify-center gap-6 text-slate-500 text-xs">
          <span className="hover:text-slate-300 cursor-pointer">Syarat & Ketentuan</span>
          <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
          <span className="hover:text-slate-300 cursor-pointer">Kebijakan Privasi</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
