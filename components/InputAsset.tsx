
import React, { useState } from 'react';
import { Icons } from '../constants';
import { parseAssetCommand } from '../services/geminiService';
import { syncAssetToGoogleSheet, syncStockbitTransactionToSheet } from '../services/spreadsheetService';

const InputAsset: React.FC = () => {
  const [selectedBroker, setSelectedBroker] = useState<'stockbit' | 'bibit' | null>(null);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview' | 'syncing' | 'success' | 'error'>('idle');
  const [assets, setAssets] = useState<any[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || loading || !selectedBroker) return;

    setLoading(true);
    setStatus('analyzing');
    
    try {
      const brokerName = selectedBroker === 'stockbit' ? 'Stockbit Sekuritas' : 'Bibit Reksadana';
      const parsed = await parseAssetCommand(command, brokerName);
      
      // Filter out invalid/zero data before showing preview
      const validAssets = parsed.filter(a => a.name && (a.lot > 0 || a.amount > 0 || a.buyValue > 0 || a.sellValue > 0));
      
      if (validAssets.length === 0) {
        alert("AI tidak mendeteksi data transaksi yang valid. Silakan coba salin ulang teks dari aplikasi broker.");
        setStatus('idle');
      } else {
        setAssets(validAssets);
        setStatus('preview');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSync = async () => {
    setLoading(true);
    setStatus('syncing');
    
    try {
      for (const asset of assets) {
        if (asset.isTransaction && selectedBroker === 'stockbit') {
          await syncStockbitTransactionToSheet({
            transDate: asset.transDate || '',
            stock: asset.name || '',
            side: asset.side || '',
            lot: asset.lot || 0,
            price: asset.price || 0,
            buyValue: asset.buyValue || 0,
            sellValue: asset.sellValue || 0,
            salesTax: asset.salesTax || 0
          });
        } else {
          await syncAssetToGoogleSheet({
            name: asset.name || '',
            type: asset.isTransaction ? 'STOCK_TRADE' : (asset.type || 'SAHAM'),
            amount: asset.isTransaction ? ((asset.lot || 0) * 100) : (asset.amount || 0),
            unit: asset.unit || 'LEMBAR',
            invest: asset.isTransaction ? (asset.buyValue || 0) : (asset.invest || 0),
            equity: asset.isTransaction ? (asset.sellValue || 0) : (asset.equity || 0),
            currentPrice: asset.isTransaction ? (asset.price || 0) : (asset.currentPrice || 0)
          });
        }
      }
      setStatus('success');
      setCommand('');
      setSelectedBroker(null);
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const isTransactionData = assets.length > 0 && assets[0].isTransaction;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-20 h-20 bg-slate-900/60 rounded-[2rem] flex items-center justify-center text-brand-olive mb-6 border border-slate-800 shadow-2xl backdrop-blur-md">
          <Icons.Growth size={32} />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
          Asset <span className="text-brand-olive">Synchronizer</span>
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">
          Multi-Broker Portfolio Node • IQBAL CORE
        </p>
      </div>

      {status === 'idle' || status === 'analyzing' || status === 'error' ? (
        <div className="bg-slate-900/40 border border-slate-800 p-10 rounded-[3.5rem] backdrop-blur-xl shadow-2xl space-y-10">
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-center italic">Initialize Protocol Source :</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setSelectedBroker('stockbit')}
                className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group relative overflow-hidden ${
                  selectedBroker === 'stockbit' 
                    ? 'bg-brand-olive/10 border-brand-olive shadow-[0_0_50px_rgba(16,185,129,0.15)]' 
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all ${
                  selectedBroker === 'stockbit' ? 'bg-brand-olive text-white' : 'bg-slate-900 text-slate-600 group-hover:text-slate-400'
                }`}>
                  S
                </div>
                <div className="text-center">
                  <p className={`font-black uppercase tracking-widest text-sm italic ${selectedBroker === 'stockbit' ? 'text-white' : 'text-slate-500'}`}>Stockbit Sekuritas</p>
                  <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1 italic">Portfolio & Execution Logs</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedBroker('bibit')}
                className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group relative overflow-hidden ${
                  selectedBroker === 'bibit' 
                    ? 'bg-brand-blue/10 border-brand-blue shadow-[0_0_50px_rgba(59,130,246,0.15)]' 
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all ${
                  selectedBroker === 'bibit' ? 'bg-brand-blue text-white' : 'bg-slate-900 text-slate-600 group-hover:text-slate-400'
                }`}>
                  B
                </div>
                <div className="text-center">
                  <p className={`font-black uppercase tracking-widest text-sm italic ${selectedBroker === 'bibit' ? 'text-white' : 'text-slate-500'}`}>Bibit Reksadana</p>
                  <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1 italic">Asset Allocation Hub</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className={`space-y-8 transition-all duration-700 ${selectedBroker ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-20 pointer-events-none'}`}>
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={selectedBroker === 'stockbit' ? "Decrypt Stockbit portfolio or trade log here..." : "Decrypt Bibit asset rincian here..."}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-[2.5rem] px-8 py-8 text-white focus:outline-none focus:ring-4 focus:ring-brand-blue/50 transition-all min-h-[300px] resize-none text-lg font-bold placeholder:text-slate-700 shadow-inner italic"
            />
            
            <button 
              type="submit"
              disabled={loading || !command.trim() || !selectedBroker}
              className={`w-full font-black py-6 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-4 text-xl italic uppercase tracking-widest border border-white/10 ${
                selectedBroker === 'bibit' ? 'bg-brand-blue hover:bg-brand-blue/90' : 'bg-brand-olive hover:bg-brand-olive/90'
              } disabled:bg-slate-800 disabled:text-slate-600 text-white active:scale-95`}
            >
              {status === 'analyzing' ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  DECRYPTING PARAMETERS...
                </>
              ) : (
                <>
                  <Icons.Sparkles />
                  INITIALIZE SYNC
                </>
              )}
            </button>
          </form>
        </div>
      ) : status === 'preview' || status === 'syncing' ? (
        <div className="space-y-8 animate-in zoom-in-95 duration-700">
          <div className="bg-slate-900/60 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-10 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
               <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs italic">
                 Protocol Preview: {selectedBroker?.toUpperCase()} TRANSACTION STREAM
               </h3>
               <span className="text-[10px] font-black px-5 py-2 rounded-xl border border-brand-olive/30 text-brand-olive bg-brand-olive/10 tracking-widest italic">
                 {assets.length} VALID NODES DETECTED
               </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/60 text-slate-500">
                  {isTransactionData ? (
                    <tr>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800">Trans Date</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800">Entity</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800">Protocol</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800 text-right">Volume</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800 text-right">Node Price</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800 text-right">Aggregate Value</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800 text-right">System Tax</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800">Identifier</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800 text-right">Units</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800 text-right">Capital Cost</th>
                      <th className="px-10 py-6 text-[9px] uppercase font-black tracking-widest italic border-b border-slate-800 text-right">Current Equity</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {assets.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-800/20 transition-all">
                      {isTransactionData ? (
                        <>
                          <td className="px-10 py-5 text-[10px] text-slate-500 font-mono font-black italic">{a.transDate}</td>
                          <td className="px-10 py-5 font-black text-white italic tracking-widest uppercase">{a.name}</td>
                          <td className={`px-10 py-5 text-[10px] font-black italic tracking-widest ${a.side === 'BUY' ? 'text-brand-olive' : 'text-brand-peach'}`}>{a.side}</td>
                          <td className="px-10 py-5 text-right font-mono text-[10px] text-slate-400 font-black italic">{(a.lot || 0).toLocaleString()}</td>
                          <td className="px-10 py-5 text-right font-mono text-[10px] text-slate-400 font-black italic">Rp{(a.price || 0).toLocaleString()}</td>
                          <td className={`px-10 py-5 text-right font-mono text-xs font-black italic tracking-tighter ${a.side === 'BUY' ? 'text-brand-olive' : 'text-brand-peach'}`}>
                            Rp{(a.side === 'BUY' ? a.buyValue : a.sellValue).toLocaleString()}
                          </td>
                          <td className="px-10 py-5 text-right font-mono text-[10px] text-slate-700 font-black italic">Rp{(a.salesTax || 0).toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-10 py-6 font-black text-white italic tracking-widest uppercase text-xs">{a.name}</td>
                          <td className="px-10 py-6 text-right font-mono text-[10px] text-slate-500 font-black italic">{(a.amount || 0).toLocaleString()}</td>
                          <td className="px-10 py-6 text-right font-mono text-[10px] text-slate-500 font-black italic">Rp{(a.invest || 0).toLocaleString()}</td>
                          <td className="px-10 py-6 text-right font-mono text-base font-black text-brand-olive tracking-tighter italic">Rp{(a.equity || 0).toLocaleString()}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex gap-6">
            <button 
              onClick={() => setStatus('idle')}
              className="flex-1 py-6 bg-slate-800 text-slate-400 font-black uppercase rounded-[2rem] hover:bg-slate-700 hover:text-white transition-all active:scale-95 italic border border-slate-700 tracking-widest shadow-xl"
            >
              Modify Extraction
            </button>
            <button 
              onClick={handleBulkSync}
              className="flex-[2] py-6 bg-brand-olive text-white font-black uppercase rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 italic tracking-widest border border-white/10"
            >
              {status === 'syncing' ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  UPLOADING TO CLOUD...
                </>
              ) : (
                <>
                  <Icons.Masterdata />
                  COMMIT TO CENTRAL SPREADSHEET
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-brand-olive/30 p-20 rounded-[4rem] text-center shadow-2xl animate-in zoom-in duration-700 backdrop-blur-xl">
           <div className="w-24 h-24 bg-brand-olive/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-brand-olive border border-brand-olive/20 shadow-2xl shadow-brand-olive/20 rotate-12">
              <Icons.Sparkles size={32} />
           </div>
           <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">Synchronization Complete</h3>
           <p className="text-slate-500 text-xs font-black italic mb-12 uppercase tracking-[0.4em] leading-relaxed">
             All transaction nodes from {selectedBroker} have been successfully indexed in IQBAL CENTRAL LEDGER.
           </p>
           <button 
             onClick={() => setStatus('idle')}
             className="px-14 py-6 bg-brand-olive text-white font-black uppercase rounded-[2rem] hover:bg-brand-olive/90 transition-all shadow-2xl shadow-brand-olive/30 italic tracking-widest active:scale-95 border border-white/10"
           >
             Protocol Finished
           </button>
        </div>
      )}
    </div>
  );
};

export default InputAsset;
