
import React, { useState } from 'react';
import { Icons } from '../constants';
import { parseCostCommand } from '../services/geminiService';
import { syncToGoogleSheet } from '../services/spreadsheetService';

const InputCost: React.FC = () => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview' | 'syncing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const templateString = `BULAN : FEBRUARI
TANGGAL : 01/02/2026
HARI : MINGGU
WEEK : 1
COA : UANG MAKAN
COST : 12000
KETERANGAN : MAKAN SIANG`;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading) return;

    setLoading(true);
    setStatus('analyzing');
    setResult(null);

    try {
      const parsed = await parseCostCommand(command);
      setResult(parsed);
      setStatus('preview');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSync = async () => {
    if (!result || loading) return;

    setLoading(true);
    setStatus('syncing');

    try {
      const isSent = await syncToGoogleSheet({
        bulan: result.bulan || '',
        tanggal: result.tanggal || '',
        hari: result.hari || '',
        week: result.week || '',
        coa: result.coa || '',
        cost: result.cost || 0,
        keterangan: result.keterangan || ''
      });

      if (isSent) {
        setStatus('success');
        setCommand('');
        setTimeout(() => {
          setStatus('idle');
          setResult(null);
        }, 8000);
      } else {
        throw new Error("Gagal sinkronisasi ke cloud.");
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic uppercase">
          AI <span className="text-brand-blue">Strategic Logic</span>
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed italic">
          Otomatisasi Ledger • T-0 Synchronized Database
        </p>
      </div>

      <div className="relative">
        {(status === 'idle' || status === 'analyzing' || status === 'error') && (
          <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3rem] backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleAnalyze} className="space-y-8">
              <div className="relative">
                <div className="flex justify-between items-center mb-6">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] italic flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse"></span>
                    Terminal Input Deskripsi
                  </label>
                  <button 
                    type="button"
                    onClick={() => setCommand(templateString)}
                    className="text-[10px] bg-slate-800 text-slate-400 font-black px-6 py-2.5 rounded-xl border border-slate-700 hover:bg-brand-blue hover:text-white transition-all uppercase tracking-widest shadow-lg"
                  >
                    Load Sample Protocol
                  </button>
                </div>
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Ketik rincian pengeluaranmu (misal: Corporate dinner 500k atau Server maintenance 1.2jt)..."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-3xl px-8 py-8 text-white focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue/50 transition-all min-h-[250px] resize-none text-xl font-bold placeholder:text-slate-600 shadow-inner italic"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit"
                disabled={loading || !command.trim()}
                className="w-full bg-brand-blue hover:bg-brand-blue/90 disabled:bg-slate-800 disabled:text-slate-600 font-black py-6 rounded-[2rem] shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-4 text-xl text-white italic border border-white/10"
              >
                {status === 'analyzing' ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    PROCESSING DATA...
                  </>
                ) : (
                  <>
                    <Icons.Sparkles />
                    EXECUTE SMART INPUT
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {(status === 'preview' || status === 'syncing') && result && (
          <div className="animate-in zoom-in-95 fade-in duration-500 bg-slate-900 border-2 border-brand-blue/30 p-12 rounded-[4rem] shadow-[0_0_80px_rgba(59,130,246,0.15)] backdrop-blur-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Icons.Sparkles />
             </div>
             <div className="flex items-center gap-5 mb-12">
                <div className="bg-brand-blue p-4 rounded-2xl text-white shadow-2xl shadow-brand-blue/30">
                   <Icons.Wallet />
                </div>
                <div>
                   <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic">Data Validation</h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Reviewing entry for INPUT COST ledger</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">MONTH_IDX (A)</p>
                   <p className="text-white font-black italic">{result.bulan || '-'}</p>
                </div>
                <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">TIMESTAMP (B)</p>
                   <p className="text-white font-mono font-black italic">{result.tanggal || '-'}</p>
                </div>
                <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">DAY_STR (C)</p>
                   <p className="text-white font-black italic">{result.hari || '-'}</p>
                </div>
                <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">WEEK_NUM (D)</p>
                   <p className="text-brand-blue font-black italic text-lg">{result.week || '-'}</p>
                </div>
                
                <div className="col-span-2 bg-slate-950/80 p-8 rounded-3xl border border-slate-800 border-l-8 border-l-brand-blue shadow-inner">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">CLASSIFICATION (E)</p>
                   <p className="text-white font-black text-3xl tracking-tighter uppercase italic">{result.coa || '-'}</p>
                </div>
                <div className="col-span-2 bg-slate-950/80 p-8 rounded-3xl border border-slate-800 border-l-8 border-l-brand-olive shadow-inner">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">ALLOCATION (F)</p>
                   <p className="text-brand-olive font-mono font-black text-4xl italic">Rp {(result.cost || 0).toLocaleString('id-ID')}</p>
                </div>

                <div className="col-span-full bg-slate-950/60 p-8 rounded-3xl border border-slate-800">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">MANIFEST_DESC (G)</p>
                   <p className="text-slate-300 font-bold italic text-xl leading-relaxed uppercase tracking-tight">{result.keterangan || '-'}</p>
                </div>
             </div>

             <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setStatus('idle')}
                  disabled={status === 'syncing'}
                  className="flex-1 py-5 px-8 rounded-[2rem] border border-slate-800 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all active:scale-95 italic"
                >
                  Abort
                </button>
                <button 
                  onClick={handleFinalSync}
                  disabled={status === 'syncing'}
                  className="flex-[2] py-5 px-8 rounded-[2rem] bg-brand-blue hover:bg-brand-blue/90 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-blue/30 transition-all flex items-center justify-center gap-4 active:scale-95 italic border border-white/10"
                >
                  {status === 'syncing' ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      UPLOADING...
                    </>
                  ) : (
                    <>
                      <Icons.Masterdata />
                      COMMIT TO DATABASE
                    </>
                  )}
                </button>
             </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-slate-900 border border-brand-olive/30 p-16 rounded-[4rem] text-center animate-in zoom-in duration-500 shadow-2xl">
             <div className="w-24 h-24 bg-brand-olive/20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-olive border border-brand-olive/20 shadow-2xl shadow-brand-olive/20 rotate-12">
                <Icons.Sparkles />
             </div>
             <h3 className="text-brand-olive font-black text-4xl mb-4 tracking-tighter uppercase italic">Commit Successful</h3>
             <p className="text-slate-500 text-xs font-black mb-12 italic uppercase tracking-[0.4em] leading-loose">Data packet has been successfully indexed in "INPUT COST" ledger.</p>
             
             <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={() => setStatus('idle')} 
                  className="px-10 py-5 bg-slate-800 text-slate-300 text-xs font-black uppercase rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all italic tracking-widest"
                >
                  New Transaction
                </button>
                <button 
                  onClick={() => window.open('https://docs.google.com/spreadsheets/d/1WiHaDJnXOMVKvLmkhzml0C3xUg69iHc3rsNKuEojJ2k/edit', '_blank')}
                  className="px-10 py-5 bg-brand-blue text-white text-xs font-black uppercase rounded-2xl shadow-2xl shadow-brand-blue/30 inline-flex items-center gap-3 italic border border-white/10 tracking-widest hover:scale-105 transition-all"
                >
                  Inspect Database <Icons.ChevronRight />
                </button>
             </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
             <p className="text-red-400 font-bold uppercase text-xs mb-1 tracking-widest">Koneksi Cloud Gagal</p>
             <p className="text-slate-500 text-[10px] italic">Pastikan Sheet "INPUT COST" tersedia dan Web App GAS sudah aktif.</p>
             <button onClick={() => setStatus('idle')} className="mt-4 text-xs font-black text-white underline uppercase">Coba Lagi</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputCost;
