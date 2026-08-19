
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/80 p-6 rounded-[2.5rem] border border-brand-brown/10 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-brand-blue to-brand-olive p-4 rounded-2xl text-white shadow-xl shadow-brand-blue/20">
            <Icons.Sparkles />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">AI Input <span className="text-brand-blue">Center</span></h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Pusat Otomatisasi Data Iqbal</p>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex bg-brand-cream/20 p-1.5 rounded-2xl border border-brand-brown/10 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeSubTab === tab.id 
                  ? `bg-${tab.color} text-white shadow-lg shadow-${tab.color}/20` 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px] relative">
        <div className="absolute inset-0 bg-brand-blue/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
        {activeSubTab === 'cost' && <InputCost />}
        {activeSubTab === 'revenue' && <InputRevenue />}
        {activeSubTab === 'asset' && <InputAsset />}
        {activeSubTab === 'investasi' && <InputInvestasi />}
      </div>
    </div>
  );
};

export default InputCenter;
