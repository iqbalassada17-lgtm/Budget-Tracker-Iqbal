
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-blue/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-olive/5 rounded-full blur-[150px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl mb-8 shadow-2xl">
            <div className="text-brand-blue">
              <Icons.Wallet size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase italic">Integration <span className="text-brand-blue">Financial</span></h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Secured Fiscal Intelligence Access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-3 italic">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              {error}
            </div>
          )}

          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest italic">Credentials // Identity</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-slate-700 font-bold italic"
                placeholder="USER_ID@SECURE.MAIL"
              />
            </div>

            <div>
              <div className="flex justify-between mb-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Access // Sequence</label>
                <a href="#" className="text-[10px] text-brand-blue hover:text-white transition-colors font-black uppercase italic tracking-widest">Inquiry?</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-slate-700 font-bold"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-black py-5 rounded-xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.4em] text-[10px] italic border border-slate-700"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Icons.Logout className="rotate-180" /> Initialize Protocol
                </>
              )}
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">
              Access restricted to <span className="text-slate-400">authorized personnel</span> only.
            </p>
          </div>
        </form>

        <div className="mt-16 flex items-center justify-center gap-8 text-slate-700 text-[9px] font-black uppercase tracking-widest italic">
          <span className="hover:text-slate-400 cursor-pointer transition-colors">Compliance</span>
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
          <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Protocol</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
