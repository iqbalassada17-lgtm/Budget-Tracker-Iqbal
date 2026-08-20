
import React from 'react';

const MasterList: React.FC = () => {
  const masterData = [
    { id: 1, code: 'ACC-001', name: 'Cash on Hand', type: 'Asset' },
    { id: 2, code: 'ACC-002', name: 'Bank BCA Utama', type: 'Asset' },
    { id: 3, code: 'EXP-001', name: 'Gaji Karyawan', type: 'Expense' },
    { id: 4, code: 'REV-001', name: 'Service Income', type: 'Revenue' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Master <span className="text-brand-blue">Registry</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">System Reference & COA Mapping</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="bg-slate-950/40 border-b border-slate-800">
            <tr>
              <th className="px-8 py-6 text-slate-500 uppercase font-black tracking-[0.2em] italic">Access Code</th>
              <th className="px-8 py-6 text-slate-500 uppercase font-black tracking-[0.2em] italic">Entity Name</th>
              <th className="px-8 py-6 text-slate-500 uppercase font-black tracking-[0.2em] italic">Classification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {masterData.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/40 transition-all group">
                <td className="px-8 py-6 text-brand-blue font-mono font-black italic tracking-widest">{d.code}</td>
                <td className="px-8 py-6 text-slate-300 font-black uppercase italic tracking-widest">{d.name}</td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1.5 bg-slate-950 text-slate-500 text-[9px] rounded-lg uppercase font-black tracking-[0.2em] italic border border-slate-800 shadow-inner">
                    {d.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterList;
