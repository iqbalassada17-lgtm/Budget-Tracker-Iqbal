
import React, { useState, useEffect } from 'react';
import { FinancialSummary } from '../types';
import { Icons } from '../constants';
import { getFinancialAdvice } from '../services/geminiService';
import { fetchFromGoogleSheet } from '../services/spreadsheetService';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onLogout }) => {
  const [summary, setSummary] = useState<FinancialSummary>({
    income: 0,
    expenses: 0,
    balance: 0
  });

  const [aiAdvice, setAiAdvice] = useState<string>("Menganalisis data keuangan Anda...");
  const [showToast, setShowToast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const parseIDRCurrency = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    let clean = value.toString().replace(/Rp|IDR|\s/g, "");
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, "").replace(/,/g, ".");
    } else if (clean.includes(',')) {
      clean = clean.replace(/,/g, ".");
    } else if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts.length > 1 && parts[parts.length - 1].length === 3) {
        clean = clean.replace(/\./g, "");
      }
    }
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const [costData, revenueData] = await Promise.all([
        fetchFromGoogleSheet('INPUT COST'),
        fetchFromGoogleSheet('REVENUE')
      ]);

      let costTotal = 0;
      if (costData && costData.length > 1) {
        costTotal = costData.slice(1).reduce((acc, row) => acc + parseIDRCurrency(row[5]), 0);
      }

      let revTotal = 0;
      if (revenueData && revenueData.length > 1) {
        revTotal = revenueData.slice(1).reduce((acc, row) => acc + parseIDRCurrency(row[5]), 0);
      }

      const newSummary = {
        income: revTotal,
        expenses: costTotal,
        balance: revTotal - costTotal
      };
      
      setSummary(newSummary);
      const advice = await getFinancialAdvice(newSummary, costData ? costData.slice(1) : []);
      setAiAdvice(advice);
    } catch (err: any) {
      console.error("Dashboard Sync Error:", err);
      setErrorStatus(err.message || "Gagal sinkronisasi.");
      setAiAdvice("Sinkronisasi gagal. Periksa struktur sheet Anda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning Mr. Iqbal";
    if (hour < 18) return "Good Afternoon Mr. Iqbal";
    return "Good Evening Mr. Iqbal";
  };

  const formatAdvice = (text: string) => {
    // Replace markdown bold **text** or bullet * text with bold spans
    const lines = text.split('\n').filter(l => l.trim() !== '');
    return (
      <div className="space-y-3">
        {lines.map((line, i) => {
          const cleanLine = line.replace(/^\s*\*\s*/, '').replace(/\*\*/g, '');
          return (
            <p key={i} className="flex gap-3">
              <span className="text-brand-blue font-black">•</span>
              <span className="flex-1">
                {line.includes('**') ? (
                  line.split('**').map((part, idx) => 
                    idx % 2 === 0 ? part : <span key={idx} className="font-black text-white">{part}</span>
                  )
                ) : (
                  <span className="font-bold text-white">{cleanLine}</span>
                )}
              </span>
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      {showToast && (
        <div className="fixed top-4 right-4 bg-brand-blue text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-bounce flex items-center gap-3">
          <span className="font-black italic">Welcome back, Mr. Iqbal</span>
          <button onClick={() => setShowToast(false)} className="text-white/80 hover:text-white">&times;</button>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h4 className="text-brand-blue text-[8px] font-black uppercase tracking-[0.4em] mb-2 italic">SYSTEM INTEGRATION TO HELP IQBAL STUFF (SITHIS AI)</h4>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic">
            {getGreeting()}
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium max-w-md italic leading-relaxed">
            System is Unlock. Here is your financial executive summary.
          </p>
        </div>
        <div className="flex gap-3">
            <div className="bg-brand-olive/5 border border-brand-olive/20 px-6 py-3 rounded-2xl flex flex-col items-end backdrop-blur-md">
               <span className="text-[8px] text-brand-olive font-black uppercase tracking-widest leading-none mb-1">Total Revenue</span>
               <span className="text-brand-olive font-black font-mono text-lg leading-none">Rp {summary.income.toLocaleString()}</span>
            </div>
            <button 
              onClick={fetchData} 
              disabled={loading}
              className={`p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-slate-400 shadow-xl ${loading ? 'opacity-50' : ''}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin text-brand-blue' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>
      </header>

      {errorStatus && (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] space-y-4 animate-in zoom-in-95 duration-500">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              </div>
              <div>
                 <p className="text-red-500 text-sm font-black uppercase tracking-widest text-white">System Error</p>
                 <p className="text-slate-400 text-xs italic">Trace: <span className="text-red-400 font-bold">{errorStatus}</span></p>
              </div>
           </div>
           
           <button 
             onClick={fetchData}
             className="w-full py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg active:scale-95"
           >
             Retry Synchronization
           </button>
        </div>
      )}

      {/* Gemini Intelligence Section */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start gap-6 shadow-2xl relative overflow-hidden group max-w-4xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue/5 rounded-full blur-3xl group-hover:bg-brand-blue/10 transition-colors"></div>
        <div className="flex flex-row md:flex-col items-center md:items-start gap-4 shrink-0">
          <div className="bg-brand-blue p-3 rounded-2xl text-white shadow-2xl shadow-brand-blue/40 border border-white/10">
            <Icons.Robot />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">SITHIS AI</h3>
            <p className="text-[7px] text-slate-500 italic uppercase leading-none mt-1">Intelligence Node</p>
          </div>
        </div>
        <div className="flex-grow bg-slate-950/60 p-6 rounded-2xl border-l-4 border-brand-blue shadow-inner min-h-[100px] flex items-center">
          <div className="text-slate-300 italic leading-relaxed text-xs font-medium tracking-tight w-full">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin"></div>
                <span className="animate-pulse">Decrypting financial nodes...</span>
              </div>
            ) : formatAdvice(aiAdvice)}
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <h3 className="text-white font-black text-lg uppercase tracking-widest flex items-center gap-3 italic">
          <span className="w-1.5 h-6 bg-brand-blue rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
          Quick Access Terminal
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <button onClick={() => onNavigate('analytics_hub')} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col items-center gap-5 group hover:bg-slate-800/60 hover:border-brand-olive/40 transition-all shadow-xl hover:-translate-y-1">
                <div className="bg-brand-olive/10 p-5 rounded-2xl text-brand-olive group-hover:scale-110 group-hover:bg-brand-olive/20 transition-all shadow-inner"><Icons.Analytics /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center group-hover:text-white transition-colors">Integration Dashboard Financial</span>
            </button>
            <button onClick={() => onNavigate('investasi')} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col items-center gap-5 group hover:bg-slate-800/60 hover:border-brand-blue/40 transition-all shadow-xl hover:-translate-y-1">
                <div className="bg-brand-blue/10 p-5 rounded-2xl text-brand-blue group-hover:scale-110 group-hover:bg-brand-blue/20 transition-all shadow-inner"><Icons.Growth /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center group-hover:text-white transition-colors">Integration Dashboard Asset</span>
            </button>
            <button onClick={() => onNavigate('input_center')} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col items-center gap-5 group hover:bg-slate-800/60 hover:border-brand-blue/40 transition-all shadow-xl hover:-translate-y-1">
                <div className="bg-brand-blue/10 p-5 rounded-2xl text-brand-blue group-hover:scale-110 group-hover:bg-brand-blue/20 transition-all shadow-inner"><Icons.Sparkles /></div>
                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest text-center group-hover:text-white transition-colors font-bold">AI Input Hub</span>
            </button>
            <button onClick={() => onNavigate('growth')} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col items-center gap-5 group hover:bg-slate-800/60 hover:border-brand-olive/40 transition-all shadow-xl hover:-translate-y-1">
                <div className="bg-brand-olive/10 p-5 rounded-2xl text-brand-olive group-hover:scale-110 group-hover:bg-brand-olive/20 transition-all shadow-inner"><Icons.Growth /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center group-hover:text-white transition-colors">Growth Plan</span>
            </button>
            <button onClick={onLogout} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col items-center gap-5 group hover:bg-red-500/10 hover:border-red-500/40 transition-all shadow-xl hover:-translate-y-1">
                <div className="bg-slate-800 p-5 rounded-2xl text-slate-500 group-hover:text-red-500 group-hover:scale-110 group-hover:bg-red-500/20 transition-all shadow-inner"><Icons.Logout /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center group-hover:text-red-400 transition-colors">Logoff</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
