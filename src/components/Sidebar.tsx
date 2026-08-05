import React from 'react';
import { ActiveTab, DataSekolah, AppConfig } from '../types';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardCheck,
  Award,
  BookMarked,
  FileSpreadsheet,
  Code2,
  X,
  Menu,
  School,
  Sliders,
} from 'lucide-react';

interface SidebarProps {
  sekolah?: DataSekolah;
  appConfig?: AppConfig;
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  isOpenMobile?: boolean;
  setIsOpenMobile?: (open: boolean) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  sekolah,
  appConfig,
  activeTab,
  setActiveTab,
  onSelectTab,
  isOpenMobile = false,
  setIsOpenMobile,
  collapsed = false,
  onToggleCollapse,
}) => {

  const menuGroups: MenuGroup[] = [
    {
      title: 'UTAMA',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'ADMINISTRASI',
      items: [
        { id: 'sekolah', label: 'Data Sekolah', icon: Building2 },
        { id: 'profil', label: 'Profil Guru', icon: UserCheck },
        { id: 'mapel', label: 'Data Mapel', icon: BookOpen },
        { id: 'kelas', label: 'Data Kelas', icon: GraduationCap },
        { id: 'siswa', label: 'Data Siswa', icon: Users },
      ],
    },
    {
      title: 'AKADEMIK',
      items: [
        { id: 'presensi', label: 'Presensi Siswa', icon: ClipboardCheck },
        { id: 'nilai', label: 'Nilai Siswa', icon: Award },
        { id: 'jurnal', label: 'Jurnal Guru', icon: BookMarked },
      ],
    },
    {
      title: 'KUSTOMISASI',
      items: [
        { id: 'konfigurasi', label: 'Konfigurasi App', icon: Sliders },
      ],
    },
    {
      title: 'OLAH DATA',
      items: [
        { id: 'google_sheets', label: 'Google Sheets API', icon: FileSpreadsheet },
      ],
    },
  ];

  const handleSelect = (id: ActiveTab) => {
    if (setActiveTab) setActiveTab(id);
    if (onSelectTab) onSelectTab(id);
    if (setIsOpenMobile) setIsOpenMobile(false);
  };

  const appLogo = appConfig?.logoAplikasiUrl || sekolah?.logoSekolahUrl;
  const appName = appConfig?.namaAplikasi || 'Catatan Guru';
  const appDesc = appConfig?.deskripsiAplikasi || 'Administrasi';

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors w-64 select-none">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          {appLogo ? (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <img
                src={appLogo}
                alt="Logo"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-violet-500/20 shrink-0 overflow-hidden">
              S
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
              {appName}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider truncate">
              {appDesc}
            </p>
          </div>
        </div>
        {setIsOpenMobile && (
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 shrink-0 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>


      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-violet-600 text-white rounded-full shadow-md shadow-violet-500/20 translate-x-1'
                        : 'text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-full'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Google Sheets Synchronized</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 transform transition-transform duration-300 lg:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>
    </>
  );
};
