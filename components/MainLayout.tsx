
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
    <div className="flex min-h-screen bg-brand-cream relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 border-r border-slate-200 flex flex-col bg-white z-50 
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-xl tracking-tighter uppercase">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white">
              <Icons.Wallet />
            </div>
            <span>Finansial</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        <nav className="flex-grow px-4 space-y-1 mt-4 overflow-y-auto">
          <button
            onClick={() => navigateTo('menu')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === 'menu' ? 'bg-brand-blue/10 text-brand-blue' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Menu Utama
          </button>

          <div className="py-2">
            <button
              onClick={() => navigateTo('analytics_hub')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === 'analytics_hub' ? 'bg-brand-olive/10 text-brand-olive shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icons.Analytics />
              Financial Analytics
            </button>
          </div>

          <div className="py-2">
            <button
              onClick={() => navigateTo('investasi')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === 'investasi' ? 'bg-brand-blue/10 text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icons.Growth />
              Investasi
            </button>
          </div>

          <div className="py-2">
            <div className="h-px bg-slate-100 mx-4 my-2"></div>
            <button
              onClick={() => navigateTo('input_center')}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all font-black uppercase tracking-widest text-[11px] ${
                activeTab === 'input_center' ? 'bg-brand-blue text-white shadow-md' : 'text-brand-blue hover:bg-brand-blue/5 border border-brand-blue/20'
              }`}
            >
              <Icons.Sparkles />
              AI Input Center
            </button>
            <div className="h-px bg-slate-100 mx-4 my-2"></div>
          </div>

          <button
            onClick={() => navigateTo('growth')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === 'growth' ? 'bg-brand-blue/10 text-brand-blue' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Icons.Growth />
            Growth Plan
          </button>

          <div>
            <button
              onClick={toggleMasterData}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${
                isActiveMasterSub ? 'text-brand-blue' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <Icons.Masterdata />
                <span>Master Data</span>
              </div>
              {isMasterDataExpanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
            </button>
            
            {isMasterDataExpanded && (
              <div className="mt-1 space-y-1 pl-10 animate-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => navigateTo('raw_data_cost')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                    activeTab === 'raw_data_cost' ? 'text-brand-blue bg-brand-blue/5 font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Raw Data Cost
                </button>
                <button
                  onClick={() => navigateTo('raw_data_revenue')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                    activeTab === 'raw_data_revenue' ? 'text-brand-blue bg-brand-blue/5 font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Raw Data Revenue
                </button>
                <button
                  onClick={() => navigateTo('raw_data_budget')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                    activeTab === 'raw_data_budget' ? 'text-brand-blue bg-brand-blue/5 font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Raw Data Budget
                </button>
                <button
                  onClick={() => navigateTo('raw_data_investasi')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                    activeTab === 'raw_data_investasi' ? 'text-brand-blue bg-brand-blue/5 font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Raw Data Investasi
                </button>
                <button
                  onClick={() => navigateTo('master')}
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                    activeTab === 'master' ? 'text-brand-blue bg-brand-blue/5 font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Daftar Master
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all font-medium"
          >
            <Icons.Logout />
            Logout Akun
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col">
        <nav className="h-16 border-b border-slate-200 flex items-center px-8 justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500 hover:text-brand-blue"
              title="Buka Menu"
            >
              <Icons.Menu />
            </button>
            <span className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">
              {activeTab === 'menu' ? 'Financial Monitoring' : activeTab.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-slate-900 text-xs font-bold">Muhammad Iqbal</span>
                <span className="text-slate-500 text-[10px]">Premium Member</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-brand-olive flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
               IQ
             </div>
          </div>
        </nav>

        <div className="p-8 max-w-7xl mx-auto w-full">
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
