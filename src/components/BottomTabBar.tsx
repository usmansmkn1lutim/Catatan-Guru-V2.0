import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActiveTab } from '../types';
import { Home, Building2, GraduationCap, Settings } from 'lucide-react';

interface BottomTabBarProps {
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelectTab }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabStyle = (isActive: boolean) => {
    return `flex flex-col items-center justify-center w-full py-2 space-y-1 transition-colors ${
      isActive
        ? 'text-violet-600 dark:text-violet-400 font-semibold'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
    }`;
  };

  const isHomeActive = location.pathname === '/dashboard' || location.pathname === '/';
  const isAdministrasiActive = [
    '/administrasi',
    '/data-sekolah',
    '/profil-guru',
    '/data-mapel',
    '/data-kelas',
    '/data-siswa',
  ].includes(location.pathname);

  const isAkademikActive = [
    '/akademik',
    '/jadwal',
    '/presensi',
    '/nilai',
    '/jurnal',
  ].includes(location.pathname);

  const isSettingActive = location.pathname.startsWith('/setting');

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-none z-40 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => {
            navigate('/dashboard');
            if (onSelectTab) onSelectTab('dashboard');
          }}
          className={getTabStyle(isHomeActive)}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => {
            navigate('/administrasi');
            if (onSelectTab) onSelectTab('administrasi_menu');
          }}
          className={getTabStyle(isAdministrasiActive)}
        >
          <Building2 className="w-6 h-6" />
          <span className="text-[10px]">Administrasi</span>
        </button>

        <button
          onClick={() => {
            navigate('/akademik');
            if (onSelectTab) onSelectTab('akademik_menu');
          }}
          className={getTabStyle(isAkademikActive)}
        >
          <GraduationCap className="w-6 h-6" />
          <span className="text-[10px]">Akademik</span>
        </button>

        <button
          onClick={() => {
            navigate('/setting');
            if (onSelectTab) onSelectTab('setting_menu');
          }}
          className={getTabStyle(isSettingActive)}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px]">Setting</span>
        </button>
      </div>
    </div>
  );
};
