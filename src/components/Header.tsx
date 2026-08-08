import React from 'react';
import { DataSekolah, ProfilGuru, ActiveTab } from '../types';
import { Moon, Sun, User, RefreshCw, School, CloudCheck, CloudOff, AlertCircle, Zap, Menu } from 'lucide-react';

interface HeaderProps {
  sekolah?: DataSekolah;
  dataSekolah?: DataSekolah;
  guru?: ProfilGuru;
  profilGuru?: ProfilGuru;
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  isDarkMode?: boolean;
  darkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
  onToggleDarkMode?: () => void;
  onSyncData?: () => void;
  isSyncing?: boolean;
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error' | 'disabled' | 'unconfigured';
  autoSyncEnabled?: boolean;
  lastSyncedTime?: string | null;
  onToggleAutoSync?: () => void;
  onFetchRemoteData?: () => void;
  isFetchingRemote?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sekolah,
  dataSekolah,
  guru,
  profilGuru,
  setActiveTab,
  isDarkMode,
  darkMode,
  setIsDarkMode,
  onToggleDarkMode,
  onSyncData,
  isSyncing,
  autoSyncStatus = 'idle',
  autoSyncEnabled = true,
  lastSyncedTime,
  onToggleAutoSync,
  onFetchRemoteData,
  isFetchingRemote = false,
  onToggleMobileMenu,
}) => {
  const currentSekolah = sekolah || dataSekolah;
  const currentGuru = guru || profilGuru;
  const activeDark = isDarkMode ?? darkMode ?? false;

  const handleToggleDark = () => {
    if (onToggleDarkMode) onToggleDarkMode();
    if (setIsDarkMode) setIsDarkMode(!activeDark);
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between shrink-0 z-30 transition-colors shadow-xs">
      {/* School Branding & Mobile Menu Hamburger Button */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Buka Menu Sidebar"
          aria-label="Buka Menu Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        {currentSekolah?.logoSekolahUrl ? (
          <div className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden bg-transparent">
            <img
              src={currentSekolah.logoSekolahUrl}
              alt={currentSekolah.namaSekolah || 'Logo'}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            <School className="w-5 h-5 text-slate-500" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
            {currentSekolah?.namaSekolah || 'SMA Negeri 1 Permata Bangsa'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px] xs:max-w-[200px] sm:max-w-md">
            {currentSekolah?.alamatLengkap || 'Jl. Merdeka No. 123, Kota Pendidikan'}
          </p>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Auto Sync Badge & Trigger */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs">
          {autoSyncStatus === 'syncing' && (
            <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-bold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Otomatis Menyimpan ke Sheet...</span>
            </span>
          )}

          {autoSyncStatus === 'synced' && (
            <span
              onClick={() => setActiveTab && setActiveTab('google_sheets')}
              className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline"
              title="Data otomatis disinkronkan ke Google Sheets setiap kali ada perubahan"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Auto-Sync Google Sheets</span>
              {lastSyncedTime && <span className="text-[10px] text-slate-400 font-normal">({lastSyncedTime})</span>}
            </span>
          )}

          {autoSyncStatus === 'error' && (
            <span
              onClick={() => setActiveTab && setActiveTab('google_sheets')}
              className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold cursor-pointer hover:underline"
              title="Terjadi kendala saat auto-sync ke Google Sheets. Klik untuk periksa konfigurasi URL GAS."
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Kendala Auto-Sync</span>
            </span>
          )}

          {autoSyncStatus === 'unconfigured' && (
            <button
              onClick={() => setActiveTab && setActiveTab('google_sheets')}
              className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold hover:underline"
              title="Klik untuk menghubungkan URL Web App Google Apps Script"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Atur Sync Google Sheets</span>
            </button>
          )}

          {autoSyncStatus === 'disabled' && (
            <span className="flex items-center gap-1 text-slate-400 font-semibold">
              <CloudOff className="w-3.5 h-3.5" />
              <span>Auto-Sync Off</span>
            </span>
          )}

          {/* Quick Auto-Sync Toggle */}
          {onToggleAutoSync && (
            <button
              onClick={onToggleAutoSync}
              className={`ml-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-colors ${
                autoSyncEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title={autoSyncEnabled ? 'Matikan Auto-Sync' : 'Aktifkan Auto-Sync Google Sheets'}
            >
              {autoSyncEnabled ? 'ON' : 'OFF'}
            </button>
          )}
        </div>

        <button
          onClick={handleToggleDark}
          title={activeDark ? 'Mode Terang' : 'Mode Gelap'}
          className="p-2 text-slate-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {activeDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        <button
          onClick={() => setActiveTab && setActiveTab('profil')}
          className="flex items-center gap-3 text-right hover:opacity-90 transition-opacity"
        >
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {currentGuru?.namaGuru || 'Drs. Bambang Haryanto'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
              {currentGuru?.nip ? `NIP. ${currentGuru.nip}` : 'Guru Mata Pelajaran'}
            </p>
          </div>
          <div className="w-10 h-10 bg-violet-100 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
            {currentGuru?.fotoProfilUrl ? (
              <img
                src={currentGuru.fotoProfilUrl}
                alt={currentGuru.namaGuru}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-violet-600" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

