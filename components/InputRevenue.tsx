
import React, { useState } from 'react';
import { Icons } from '../constants';
import { parseRevenueCommand } from '../services/geminiService';
import { syncRevenueToGoogleSheet } from '../services/spreadsheetService';

const InputRevenue: React.FC = () => {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview' | 'syncing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const templateString = `BULAN : January
TANGGAL : 01/01/2026
HARI : KAMIS
WEEK : WEEK1
PARAMETER : GAJI POKOK
REVENUE : 12000000`;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading) return;

    setLoading(true);
    setStatus('analyzing');
    setResult(null);

    try {
      const parsed = await parseRevenueCommand(command);
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
      const isSent = await syncRevenueToGoogleSheet({
        bulan: result.bulan || '',
        tanggal: result.tanggal || '',
        hari: result.hari || '',
        week: result.week || '',
        parameter: result.parameter || '',
        revenue: result.revenue || 0
      });

      if (isSent) {
        setStatus('success');
        setCommand('');
        setTimeout(() => {
          setStatus('idle');
          setResult(null);
        }, 15000); // Pesan sukses lebih lama agar user bisa klik link
      } else {
        throw new Error("Gagal kirim revenue ke cloud.");
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStatus('idle');
    setResult(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight italic uppercase">
          AI <span className="text-brand-olive">Revenue Input</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium italic uppercase tracking-widest">
          {status === 'preview' ? 'Tinjau Pendapatan Sebelum Sinkronisasi' : 'Otomatisasi Laporan Pendapatan Iqbal'}
        </p>
      </div>

      <div className="relative">
        {(status === 'idle' || status === 'analyzing' || status === 'error') && (
          <div className="bg-white/80 border border-brand-brown/10 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl animate-in fade-in duration-500">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="relative">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">Input Revenue Area</label>
                  <button 
                    type="button"
                    onClick={() => setCommand(templateString)}
                    className="text-[10px] bg-brand-olive/10 text-brand-olive font-black px-4 py-2 rounded-xl border border-brand-olive/20 hover:bg-brand-olive hover:text-white transition-all uppercase tracking-widest"
                  >
                    Pakai Template
                  </button>
                </div>
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Contoh: 'Tadi dapet bonus proyek 5 juta dari klien A'..."
                  className="w-full bg-brand-cream/20 border border-brand-brown/10 rounded-2xl px-6 py-5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-olive/10 focus:border-brand-olive/50 transition-all min-h-[220px] resize-none text-lg font-mono placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit"
                disabled={loading || !command.trim()}
                className="w-full bg-brand-olive hover:bg-brand-olive/90 disabled:bg-slate-200 disabled:text-slate-400 font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg text-white"
              >
                {status === 'analyzing' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    AI MENGANALISIS PENDAPATAN...
                  </>
                ) : "PROSES PENDAPATAN DENGAN AI"}
              </button>
            </form>
          </div>
        )}

        {(status === 'preview' || status === 'syncing') && result && (
          <div className="animate-in zoom-in-95 fade-in duration-500 bg-white border-2 border-brand-olive/30 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(141,135,65,0.1)] backdrop-blur-3xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-olive to-brand-blue"></div>
             
             <div className="flex items-center gap-4 mb-10">
                <div className="bg-brand-olive p-3 rounded-2xl text-white">
                   <Icons.Sparkles />
                </div>
                <div>
                   <h3 className="text-slate-900 font-black text-xl uppercase tracking-tighter">Konfirmasi Pendapatan</h3>
                   <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Silakan periksa detail hasil ekstraksi pendapatan</p>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">BULAN (A)</p>
                   <p className="text-slate-900 font-bold">{result.bulan || '-'}</p>
                </div>
                <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">TANGGAL (B)</p>
                   <p className="text-slate-900 font-mono font-bold">{result.tanggal || '-'}</p>
                </div>
                <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">HARI (C)</p>
                   <p className="text-slate-900 font-bold">{result.hari || '-'}</p>
                </div>
                <div className="bg-brand-cream/20 p-4 rounded-2xl border border-brand-brown/10">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">WEEK (D)</p>
                   <p className="text-brand-olive font-black italic">{result.week || '-'}</p>
                </div>
                
                <div className="col-span-2 bg-brand-cream/20 p-6 rounded-2xl border border-brand-brown/10 border-l-4 border-l-brand-olive">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">PARAMETER / SUMBER (E)</p>
                   <p className="text-slate-900 font-black text-2xl tracking-tighter">{result.parameter || '-'}</p>
                </div>
                <div className="col-span-2 bg-brand-cream/20 p-6 rounded-2xl border border-brand-brown/10 border-l-4 border-l-brand-olive">
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">REVENUE / NOMINAL (F)</p>
                   <p className="text-brand-olive font-mono font-black text-3xl">Rp {(result.revenue || 0).toLocaleString('id-ID')}</p>
                </div>
             </div>

             <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleCancel}
                  disabled={status === 'syncing'}
                  className="flex-1 py-4 px-6 rounded-2xl border border-brand-brown/20 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Batal / Edit Teks
                </button>
                <button 
                  onClick={handleFinalSync}
                  disabled={status === 'syncing'}
                  className="flex-[2] py-4 px-6 rounded-2xl bg-brand-olive hover:bg-brand-olive/90 text-white font-black uppercase tracking-widest shadow-xl shadow-brand-olive/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {status === 'syncing' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      MENYIMPAN REVENUE...
                    </>
                  ) : (
                    <>
                      <Icons.Wallet />
                      Konfirmasi & Simpan Pendapatan
                    </>
                  )}
                </button>
             </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white border border-brand-olive/30 p-12 rounded-[3rem] text-center animate-in zoom-in duration-500 shadow-2xl">
             <div className="w-20 h-20 bg-brand-olive/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-olive border border-brand-olive/20">
                <Icons.Sparkles />
             </div>
             <h3 className="text-brand-olive font-black text-3xl mb-2 tracking-tighter uppercase">Revenue Berhasil Dicatat!</h3>
             <p className="text-slate-500 text-sm font-medium mb-10 italic uppercase tracking-widest">Data pendapatan sudah tersimpan di baris terbaru.</p>
             
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => {setStatus('idle'); setResult(null);}} 
                  className="px-8 py-4 bg-slate-100 text-slate-700 text-xs font-black uppercase rounded-2xl border border-brand-brown/10 hover:bg-slate-200 transition-all"
                >
                  Input Revenue Lagi
                </button>
                <a 
                  href="https://docs.google.com/spreadsheets/d/1WiHaDJnXOMVKvLmkhzml0C3xUg69iHc3rsNKuEojJ2k/edit?gid=479119470" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-brand-olive text-white text-xs font-black uppercase rounded-2xl shadow-lg shadow-brand-olive/20 inline-flex items-center gap-2 hover:bg-brand-olive/90 transition-all"
                >
                  Buka Sheet Revenue <Icons.ChevronRight />
                </a>
             </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
             <p className="text-red-400 font-bold uppercase text-xs mb-1 tracking-widest">Sinkronisasi Gagal</p>
             <p className="text-slate-500 text-[10px] italic">Gagal mengirim data pendapatan ke Spreadsheet.</p>
             <button onClick={() => setStatus('idle')} className="mt-4 text-xs font-black text-white underline uppercase">Coba Lagi</button>
          </div>
        )}
      </div>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-olive/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
    </div>
  );
};

export default InputRevenue;
