
import React, { useState } from 'react';
import InputCost from './InputCost';
import InputRevenue from './InputRevenue';
import InputAsset from './InputAsset';
import InputInvestasi from './InputInvestasi';
import { Icons } from '../constants';

const InputCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'cost' | 'revenue' | 'asset' | 'investasi'>('cost');

  const tabs = [
    { id: 'cost', label: 'Cost', icon: <Icons.Analytics />, color: 'brand-blue' },
    { id: 'revenue', label: 'Revenue', icon: <Icons.TrendingUp />, color: 'brand-olive' },
    { id: 'asset', label: 'Stock/Asset', icon: <Icons.Growth />, color: 'brand-peach' },
    { id: 'investasi', label: 'Investasi', icon: <Icons.Growth />, color: 'brand-brown' },
  ];

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      {/* Header Hub */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-brand-blue to-brand-olive p-5 rounded-2xl text-white shadow-2xl shadow-brand-blue/30 border border-white/10">
            <Icons.Sparkles />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Control <span className="text-brand-blue">Center</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">System Input Terminal • AI Assisted</p>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex bg-slate-950/60 p-2 rounded-[1.5rem] border border-slate-800 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                activeSubTab === tab.id 
                  ? `bg-slate-800 text-white border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]` 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`transition-colors ${activeSubTab === tab.id ? 'text-brand-blue' : 'text-slate-600'}`}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px] relative">
        <div className="absolute inset-0 bg-brand-blue/10 blur-[160px] rounded-full -z-10 pointer-events-none"></div>
        {activeSubTab === 'cost' && <InputCost />}
        {activeSubTab === 'revenue' && <InputRevenue />}
        {activeSubTab === 'asset' && <InputAsset />}
        {activeSubTab === 'investasi' && <InputInvestasi />}
      </div>
    </div>
  );
};

export default InputCenter;
