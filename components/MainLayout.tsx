
import React, { useState } from 'react';
import Dashboard from './Dashboard';
import AnalyticsHub from './AnalyticsHub';
import Masterdata from './Masterdata';
import RawDataCost from './RawDataCost';
import RawDataRevenue from './RawDataRevenue';
import RawDataBudget from './RawDataBudget';
import RawDataInvestasi from './RawDataInvestasi';
import MasterList from './MasterList';
import GrowthPlan from './GrowthPlan';
import InputCenter from './InputCenter';
import StockbitDashboard from './StockbitDashboard';
import InvestasiHub from './InvestasiHub';
import { Icons, COLORS } from '../constants';

interface MainLayoutProps {
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'analytics_hub' | 'investasi' | 'input_center' | 'raw_data_cost' | 'raw_data_revenue' | 'raw_data_budget' | 'raw_data_investasi' | 'master' | 'growth'>('menu');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMasterDataExpanded, setIsMasterDataExpanded] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMasterData = () => setIsMasterDataExpanded(!isMasterDataExpanded);

  const isActiveMasterSub = ['raw_data_cost', 'raw_data_revenue', 'raw_data_budget', 'raw_data_investasi', 'master'].includes(activeTab);

  const navigateTo = (tab: any) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 relative selection:bg-brand-blue/30 selection:text-white">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 transition-all duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-72 border-r border-slate-900 flex flex-col bg-slate-950 z-50 
        transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isSidebarOpen ? 'translate-x-0 shadow-[0_0_100px_rgba(0,0,0,1)]' : '-translate-x-full'}
      `}>
        <div className="p-10 flex items-center justify-between">
          <div className="flex items-center gap-4 text-white font-black text-2xl tracking-tighter uppercase italic">
            <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-brand-blue shadow-2xl">
              <Icons.Wallet />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl">System</span>
              <span className="text-[10px] tracking-[0.2em] text-brand-olive not-italic uppercase">Mr. iqbal</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 bg-slate-900 rounded-xl text-slate-600 hover:text-white transition-colors border border-slate-800"
          >
            <Icons.Close />
          </button>
        </div>

        <nav className="flex-grow px-6 space-y-2 mt-6 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => navigateTo('menu')}
            className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] italic ${
              activeTab === 'menu' ? 'bg-slate-900 text-white border border-slate-800 shadow-2xl shadow-black' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Command Center
          </button>

          <div className="py-2">
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] px-6 mb-4 italic">Analytics</p>
            <button
              onClick={() => navigateTo('analytics_hub')}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] italic ${
                activeTab === 'analytics_hub' ? 'bg-slate-900 text-brand-olive border border-brand-olive/20 shadow-2xl' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <Icons.Analytics className="w-5 h-5" />
              Integration Dashboard Financial
            </button>
          </div>

          <div className="py-2">
            <button
              onClick={() => navigateTo('investasi')}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] italic ${
                activeTab === 'investasi' ? 'bg-slate-900 text-brand-blue border border-brand-blue/20 shadow-2xl' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <Icons.Growth className="w-5 h-5" />
              Integration Dashboard Asset
            </button>
          </div>

          <div className="py-4">
            <button
              onClick={() => navigateTo('input_center')}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px] italic relative overflow-hidden group ${
                activeTab === 'input_center' ? 'bg-brand-blue text-white shadow-2xl shadow-brand-blue/20' : 'text-brand-blue border border-brand-blue/20 hover:bg-brand-blue/5'
              }`}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
              <Icons.Sparkles className="w-5 h-5" />
              AI Input Node
            </button>
          </div>

          <div className="py-2">
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] px-6 mb-4 italic">Protocols</p>
            <button
              onClick={() => navigateTo('growth')}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] italic ${
                activeTab === 'growth' ? 'bg-slate-900 text-brand-peach border border-brand-peach/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <Icons.Growth className="w-5 h-5" />
              Growth Plan
            </button>
          </div>

          <div>
            <button
              onClick={toggleMasterData}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] italic ${
                isActiveMasterSub ? 'text-brand-blue bg-slate-900/40' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center gap-5">
                <Icons.Masterdata className="w-5 h-5" />
                <span>Datastream</span>
              </div>
              {isMasterDataExpanded ? <Icons.ChevronDown className="w-4 h-4" /> : <Icons.ChevronRight className="w-4 h-4" />}
            </button>
            
            {isMasterDataExpanded && (
              <div className="mt-2 space-y-1 pl-12 animate-in slide-in-from-top-4 duration-300">
                <button onClick={() => navigateTo('raw_data_cost')} className={`w-full text-left py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${activeTab === 'raw_data_cost' ? 'text-brand-blue bg-brand-blue/5' : 'text-slate-600 hover:text-slate-400'}`}>Raw Data Cost</button>
                <button onClick={() => navigateTo('raw_data_revenue')} className={`w-full text-left py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${activeTab === 'raw_data_revenue' ? 'text-brand-blue bg-brand-blue/5' : 'text-slate-600 hover:text-slate-400'}`}>Raw Data Revenue</button>
                <button onClick={() => navigateTo('raw_data_budget')} className={`w-full text-left py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${activeTab === 'raw_data_budget' ? 'text-brand-blue bg-brand-blue/5' : 'text-slate-600 hover:text-slate-400'}`}>Raw Data Budget</button>
                <button onClick={() => navigateTo('raw_data_investasi')} className={`w-full text-left py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${activeTab === 'raw_data_investasi' ? 'text-brand-blue bg-brand-blue/5' : 'text-slate-600 hover:text-slate-400'}`}>Raw Data Investasi</button>
                <button onClick={() => navigateTo('master')} className={`w-full text-left py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${activeTab === 'master' ? 'text-brand-blue bg-brand-blue/5' : 'text-slate-600 hover:text-slate-400'}`}>Daftar Master</button>
              </div>
            )}
          </div>
        </nav>

        <div className="p-8 border-t border-slate-900">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-5 px-6 py-4 rounded-2xl text-slate-700 hover:text-red-500 hover:bg-red-500/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] italic border border-transparent hover:border-red-500/20"
          >
            <Icons.Logout className="w-5 h-5" />
            Deauthorize
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative">
        <nav className="h-24 border-b border-slate-900 flex items-center px-10 justify-between bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleSidebar}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl transition-all text-slate-500 hover:text-white hover:shadow-2xl shadow-black active:scale-95"
              title="Toggle Menu"
            >
              <Icons.Menu size={20} />
            </button>
            <div className="h-8 w-px bg-slate-900 mx-2 hidden md:block"></div>
            <span className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase italic hidden md:block">
              {activeTab === 'menu' ? 'WELCOME TO STARTED PAGE' : 
               activeTab === 'analytics_hub' ? 'SYSTEM : FISCAL FLOW ANALYSIS' :
               `Module: ${activeTab.replace(/_/g, ' ')}`}
            </span>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-white text-[11px] font-black italic uppercase tracking-widest">M. Iqbal Assada</span>
                <span className="text-brand-olive text-[8px] uppercase tracking-[0.4em] font-black italic opacity-80">Portfolio Executive</span>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-blue text-xs font-black shadow-2xl relative group cursor-pointer overflow-hidden">
               <div className="absolute inset-0 bg-brand-blue opacity-0 group-hover:opacity-10 transition-opacity"></div>
               IQ
             </div>
          </div>
        </nav>

        <div className="p-10 max-w-7xl mx-auto w-full relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-olive/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
          
          {activeTab === 'menu' && <Dashboard onNavigate={navigateTo} onLogout={onLogout} />}
          {activeTab === 'analytics_hub' && <AnalyticsHub />}
          {activeTab === 'investasi' && <InvestasiHub />}
          {activeTab === 'input_center' && <InputCenter />}
          {activeTab === 'raw_data_cost' && <RawDataCost />}
          {activeTab === 'raw_data_revenue' && <RawDataRevenue />}
          {activeTab === 'raw_data_budget' && <RawDataBudget />}
          {activeTab === 'raw_data_investasi' && <RawDataInvestasi />}
          {activeTab === 'master' && <MasterList />}
          {activeTab === 'growth' && <GrowthPlan />}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
