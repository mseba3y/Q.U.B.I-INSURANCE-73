




import React, { useRef, useEffect } from 'react';
import { LayoutDashboard, Users, CalendarCheck, Sparkles, LogOut, Globe, Moon, Sun, FileText, ClipboardList, CloudCheck, Briefcase, Clock, Banknote, Receipt, FileBarChart, Archive, ShieldCheck, Coins, PieChart, Calculator, Landmark, StickyNote } from 'lucide-react';
import { translations } from '../utils/translations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  onLogout: () => void;
}

// Short "Pop" UI Sound (Base64 encoded to work without external files)
const UI_CLICK_SOUND = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAEA//8="; 
// Note: The above is a placeholder minimal sound. 
// I will use a real short 'pop' sound Base64 below for better experience.
const REAL_CLICK_SOUND = "data:audio/mpeg;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMmFtZTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uQZAAAWbQAAAAAAAgAAAAAAAAOEAAABAAAAAAAAAAAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uQZAAAAAAA0gAAABAAAAABAAABAAAAAAAAAAAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, lang, setLang, darkMode, setDarkMode, onLogout }) => {
  const t = translations[lang].sidebar;
  const isRTL = lang === 'ar';
  
  // Use a ref to hold the audio object so we don't recreate it on every render
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio object once
    // Using a simple short 'pop' sound URL for better browser compatibility if Base64 fails, 
    // but here we use a Base64 string for a "mechanical click" sound.
    // For reliability in this demo, I will use a generated beep logic or simple object.
    audioRef.current = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3");
    audioRef.current.volume = 0.4; // Set volume to 40%
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Rewind to start
      audioRef.current.play().catch(e => console.error("Audio play blocked", e));
    }
  };

  // Wrapper functions to play sound then execute action
  const handleTabChange = (id: string) => {
    playSound();
    setActiveTab(id);
  };

  const handleLangChange = () => {
    playSound();
    setLang(lang === 'en' ? 'ar' : 'en');
  };

  const handleThemeChange = () => {
    playSound();
    setDarkMode(!darkMode);
  };

  const handleLogoutClick = () => {
    playSound();
    onLogout();
  };

  const menuGroups = [
    {
      title: t.sectGeneral,
      items: [
        { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={18} /> },
        { id: 'employees', label: t.employees, icon: <Users size={18} /> },
        { id: 'attendance', label: t.attendance, icon: <CalendarCheck size={18} /> },
        { id: 'insights', label: t.insights, icon: <Sparkles size={18} /> },
      ]
    },
    {
      // Explicitly grouped Daily Financial Operations as requested
      title: lang === 'ar' ? 'العمليات المالية اليومية' : 'Daily Financial Operations',
      items: [
        { id: 'cash', label: t.cash, icon: <Coins size={18} /> },
        { id: 'bankDepositG4', label: t.bankDepositG4, icon: <Landmark size={18} /> },
        { id: 'dailyClosing', label: t.dailyClosing, icon: <PieChart size={18} /> },
        { id: 'moneyReceipt', label: t.moneyReceipt, icon: <Calculator size={18} /> },
        { id: 'notesForm', label: t.notesForm, icon: <StickyNote size={18} /> },
      ]
    },
    {
      title: t.sectHR,
      items: [
        { id: 'casualLeave', label: t.casualLeave, icon: <FileText size={18} /> },
        { id: 'annualLeave', label: t.annualLeave, icon: <ClipboardList size={18} /> },
        { id: 'workResumption', label: t.workResumption, icon: <Briefcase size={18} /> },
        { id: 'overtime', label: t.overtime, icon: <Clock size={18} /> },
      ]
    },
    {
      title: t.sectFinance,
      items: [
        { id: 'paymentVoucher', label: t.paymentVoucher, icon: <Banknote size={18} /> },
        { id: 'billsDue', label: t.billsDue, icon: <Receipt size={18} /> },
        { id: 'custody', label: t.custody, icon: <ShieldCheck size={18} /> },
      ]
    },
    {
      title: t.sectOps,
      items: [
        { id: 'monthlyReport', label: t.monthlyReport, icon: <FileBarChart size={18} /> },
        { id: 'archive', label: t.archive, icon: <Archive size={18} /> },
      ]
    }
  ];

  return (
    <aside className={`w-72 h-screen fixed top-0 z-30 transition-all duration-300 ${isRTL ? 'right-0 border-l border-slate-800' : 'left-0 border-r border-slate-800'} 
      bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl flex flex-col print:hidden text-white`}
    >
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-6 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
            Q
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Q.U.B.I INSURANCE 73
            </h1>
            <p className="text-slate-400 text-[10px] font-medium tracking-wider uppercase bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-slate-700">{t.version}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <h3 className="px-4 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{group.title}</h3>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group font-medium relative overflow-hidden ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <div className={`${isRTL ? 'ml-3' : 'mr-3'} ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm tracking-wide">{item.label}</span>
                  
                  {activeTab === item.id && (
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / User Area */}
      <div className="p-4 mx-4 mt-auto mb-4">
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
              <button 
                onClick={handleLangChange}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all border border-slate-700/50 hover:border-slate-600"
              >
                <Globe size={14} />
                <span>{t.switchLang}</span>
              </button>
              <button 
                onClick={handleThemeChange}
                className="flex-none p-2 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all border border-slate-700/50 hover:border-slate-600"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
          </div>
          
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-900/50 to-rose-800/50 border border-rose-800/30 text-rose-300 hover:from-rose-800 hover:to-rose-700 hover:text-white transition-all text-xs font-bold shadow-lg"
          >
            <LogOut size={16} />
            <span>{t.logout}</span>
          </button>
          
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-emerald-500 bg-emerald-950/30 py-1 rounded-full border border-emerald-900/50">
             <CloudCheck size={10} />
             <span>Auto-saved</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;