
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
      const advice = await getFinancialAdvice(newSummary);
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

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      {showToast && (
        <div className="fixed top-4 right-4 bg-brand-blue text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-bounce flex items-center gap-3">
          <span className="font-bold">Selamat Datang, Iqbal!</span>
          <button onClick={() => setShowToast(false)} className="text-white/80 hover:text-white">&times;</button>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h4 className="text-brand-blue text-[10px] font-black uppercase tracking-[0.4em] mb-2 italic">Financial Monitoring</h4>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
            Heeiii <span className="text-brand-blue">Muhammad Iqbal</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium max-w-md italic leading-relaxed">
            Ini adalah ringkasan finansialmu.
          </p>
        </div>
        <div className="flex gap-3">
            <div className="bg-brand-olive/10 border border-brand-olive/20 px-6 py-2 rounded-2xl flex flex-col items-end">
               <span className="text-[8px] text-brand-olive font-black uppercase tracking-widest leading-none mb-1">Total Revenue</span>
               <span className="text-brand-olive font-bold font-mono text-sm leading-none">Rp {summary.income.toLocaleString()}</span>
            </div>
            <button 
              onClick={fetchData} 
              disabled={loading}
              className={`p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-400 ${loading ? 'opacity-50' : ''}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin text-brand-blue' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>
      </header>

      {errorStatus && (
        <div className="bg-red-50 border border-red-200 p-8 rounded-[2rem] space-y-4 animate-in zoom-in-95 duration-500">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              </div>
              <div>
                 <p className="text-red-600 text-sm font-black uppercase tracking-widest">Koneksi Database Gagal</p>
                 <p className="text-slate-500 text-xs italic">Detail: <span className="text-slate-900 font-bold">{errorStatus}</span></p>
              </div>
           </div>
           
           <button 
             onClick={fetchData}
             className="w-full py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-sm active:scale-95"
           >
             Coba Hubungkan Kembali
           </button>
        </div>
      )}

      {/* Gemini Intelligence Section */}
      <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-sm relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue/5 rounded-full blur-3xl group-hover:bg-brand-blue/10 transition-colors"></div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-brand-blue p-4 rounded-[1.5rem] text-white shadow-xl shadow-brand-blue/20">
            <Icons.Robot />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Gemini Intelligence</h3>
            <p className="text-xs text-slate-400 italic">Assistant</p>
          </div>
        </div>
        <div className="flex-grow bg-brand-cream/20 p-6 rounded-2xl border-l-4 border-brand-blue">
          <p className="text-slate-700 italic leading-relaxed text-xl font-medium">
            {loading ? "Menghitung data..." : `"${aiAdvice}"`}
          </p>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <h3 className="text-slate-900 font-black text-lg uppercase tracking-widest flex items-center gap-3">
          <span className="w-1 h-6 bg-brand-blue rounded-full"></span>
          Navigasi Cepat
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button onClick={() => onNavigate('analytics_hub')} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-4 group hover:bg-brand-olive/5 hover:border-brand-olive/20 transition-all shadow-sm">
                <div className="bg-brand-olive/10 p-4 rounded-xl text-brand-olive group-hover:scale-110 transition-transform"><Icons.Analytics /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Analytics Hub</span>
            </button>
            <button onClick={() => onNavigate('investasi')} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-4 group hover:bg-brand-blue/5 hover:border-brand-blue/20 transition-all shadow-sm">
                <div className="bg-brand-blue/10 p-4 rounded-xl text-brand-blue group-hover:scale-110 transition-transform"><Icons.Growth /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Investasi</span>
            </button>
            <button onClick={() => onNavigate('input_center')} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-4 group hover:bg-brand-blue/5 hover:border-brand-blue/20 transition-all shadow-sm">
                <div className="bg-brand-blue/10 p-4 rounded-xl text-brand-blue group-hover:scale-110 transition-transform"><Icons.Sparkles /></div>
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest text-center">AI Input Hub</span>
            </button>
            <button onClick={() => onNavigate('growth')} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-4 group hover:bg-brand-olive/5 hover:border-brand-olive/20 transition-all shadow-sm">
                <div className="bg-brand-olive/10 p-4 rounded-xl text-brand-olive group-hover:scale-110 transition-transform"><Icons.Growth /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Growth</span>
            </button>
            <button onClick={onLogout} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-4 group hover:bg-red-50 hover:border-red-200 transition-all shadow-sm">
                <div className="bg-slate-50 p-4 rounded-xl text-slate-400 group-hover:text-red-600 group-hover:scale-110 transition-transform"><Icons.Logout /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Logout</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
