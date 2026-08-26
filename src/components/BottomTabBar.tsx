import React from 'react';
import { ActiveTab } from '../types';
import { Home, Building2, GraduationCap, Settings } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelectTab }) => {
  const getTabStyle = (isActive: boolean) => {
    return `flex flex-col items-center justify-center w-full py-2 space-y-1 transition-colors ${
      isActive
        ? 'text-violet-600 dark:text-violet-400 font-semibold'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
    }`;
  };

  return (
    <div className="lg:hidden fixed bottom-5 left-5 right-5 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-white/40 dark:border-slate-700/40 shadow-xl shadow-slate-200/10 dark:shadow-none z-40 rounded-3xl">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={getTabStyle(activeTab === 'dashboard')}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('administrasi_menu')}
          className={getTabStyle(
            ['sekolah', 'profil', 'google_sheets', 'gas_deploy', 'administrasi_menu'].includes(activeTab)
          )}
        >
          <Building2 className="w-6 h-6" />
          <span className="text-[10px]">Administrasi</span>
        </button>

        <button
          onClick={() => onSelectTab('akademik_menu')}
          className={getTabStyle(
            ['mapel', 'kelas', 'siswa', 'presensi', 'nilai', 'jurnal', 'akademik_menu'].includes(activeTab)
          )}
        >
          <GraduationCap className="w-6 h-6" />
          <span className="text-[10px]">Akademik</span>
        </button>

        <button
          onClick={() => onSelectTab('konfigurasi')}
          className={getTabStyle(activeTab === 'konfigurasi')}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px]">Setting</span>
        </button>
      </div>
    </div>
  );
};
