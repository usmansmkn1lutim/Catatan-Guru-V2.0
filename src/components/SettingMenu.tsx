import React from 'react';
import { ActiveTab } from '../types';
import { Sliders, FileSpreadsheet, Palette, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface SettingMenuProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const SettingMenu: React.FC<SettingMenuProps> = ({ onNavigate }) => {
  const menus = [
    {
      id: 'tampilan' as ActiveTab,
      label: 'Appearance & Layout',
      desc: 'Atur tema Light / Dark Glassmorphism, ukuran tipografi & foto background kustom',
      icon: <Palette className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
      accentBg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20 dark:border-blue-400/30',
      badge: 'Glassmorphism',
    },
    {
      id: 'google_sheets' as ActiveTab,
      label: 'Google Sheets API',
      desc: 'Integrasi cloud database dua arah dan live auto-sync dengan Google Spreadsheet',
      icon: <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
      accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-400/30',
      badge: 'Cloud Sync',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title with Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/40 dark:border-white/10">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-400/30 text-blue-600 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pengaturan & Personalisasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
            Menu Pengaturan (Setting)
          </h2>
          <p className="text-xs sm:text-sm text-black dark:text-slate-400 font-medium">
            Kelola tampilan tema visual, konfigurasi logo aplikasi, dan konektivitas cloud data.
          </p>
        </div>
      </div>

      {/* Light & Dark Glassmorphism Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onNavigate(menu.id)}
            className="group relative bg-white/40 hover:bg-white/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 backdrop-blur-xl border border-white/20 hover:border-blue-400/50 rounded-2xl p-6 shadow-lg transition-all duration-300 flex flex-col justify-between items-stretch text-left overflow-hidden h-full active:scale-[0.98]"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className={`p-3.5 rounded-2xl border ${menu.accentBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  {menu.icon}
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {menu.badge}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {menu.label}
              </h3>
              <p className="text-xs text-black dark:text-slate-400 font-medium mt-2 leading-relaxed">
                {menu.desc}
              </p>
            </div>

            <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-200/50 dark:border-white/10 text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Buka Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

