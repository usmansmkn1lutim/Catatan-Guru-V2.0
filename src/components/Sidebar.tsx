import React from 'react';
import { ActiveTab, DataSekolah, AppConfig, VisualStyle } from '../types';
import { DEFAULT_APP_LOGO } from '../data/initialData';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  ClipboardCheck,
  Award,
  BookMarked,
  FileSpreadsheet,
  Code2,
  X,
  Menu,
  School,
  Sliders,
  Palette,
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
  visualStyle?: VisualStyle;
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
  visualStyle = 'solid',
}) => {
  const isSolid = visualStyle === 'solid';

  const menuGroups: MenuGroup[] = [
    {
      title: 'UTAMA',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'ADMINISTRASI',
      items: [
        { id: 'sekolah', label: 'Data Sekolah', icon: Building2 },
        { id: 'mapel', label: 'Data Mapel', icon: BookOpen },
        { id: 'kelas', label: 'Data Kelas', icon: GraduationCap },
        { id: 'siswa', label: 'Data Siswa', icon: Users },
      ],
    },
    {
      title: 'AKADEMIK',
      items: [
        { id: 'jadwal', label: 'Jadwal', icon: CalendarDays },
        { id: 'presensi', label: 'Presensi', icon: ClipboardCheck },
        { id: 'nilai', label: 'Nilai', icon: Award },
        { id: 'jurnal', label: 'Jurnal', icon: BookMarked },
      ],
    },
    {
      title: 'SETTING',
      items: [
        { id: 'tampilan', label: 'Appearance & Layout', icon: Palette },
        { id: 'google_sheets', label: 'Google Sheets API', icon: FileSpreadsheet },
      ],
    },
  ];

  const handleSelect = (id: ActiveTab) => {
    if (setActiveTab) setActiveTab(id);
    if (onSelectTab) onSelectTab(id);
    if (setIsOpenMobile) setIsOpenMobile(false);
  };

  const appLogo = appConfig?.logoAplikasiUrl || DEFAULT_APP_LOGO;
  const appName = appConfig?.namaAplikasi || 'Catatan Seorang Guru';
  const appDesc = appConfig?.deskripsiAplikasi || 'Merawat Jejak Pengabdian';

  const sidebarContent = (
    <div className={`flex flex-col justify-between transition-colors w-64 select-none h-full overflow-hidden ${
      isSolid
        ? 'bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 lg:h-[calc(100vh-2rem)] lg:bg-white lg:dark:bg-slate-900 lg:rounded-2xl lg:border lg:border-gray-200 lg:dark:border-slate-800 lg:my-4 lg:ml-4 lg:shadow-sm'
        : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/60 dark:border-slate-700/50 dark:border-slate-800 lg:h-[calc(100vh-2rem)] lg:bg-white/10 lg:dark:bg-slate-900/10 lg:backdrop-blur-lg lg:rounded-3xl lg:border lg:border-white/30 lg:dark:border-slate-700/40 lg:my-4 lg:ml-4 lg:shadow-[0_12px_40px_rgba(0,0,0,0.12)] lg:dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className={`p-5 flex items-center justify-between ${
          isSolid
            ? 'border-b border-gray-200 dark:border-slate-800'
            : 'border-b border-white/20 dark:border-slate-700/40'
        }`}>
        <div className="flex items-center justify-center w-full min-w-0">
          {appLogo && (
            <div className="flex items-center justify-center shrink-0 bg-transparent w-full">
              <img
                src={appLogo}
                alt="Logo"
                className="max-w-full max-h-20 object-contain"
              />
            </div>
          )}
        </div>
        {setIsOpenMobile && (
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-black hover:text-slate-700 dark:text-white/80 dark:hover:text-white p-1 shrink-0 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className={`px-4 text-[11px] font-bold uppercase tracking-wider ${
              isSolid ? 'text-slate-500 dark:text-slate-400' : 'text-black dark:text-white/70'
            }`}>
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
                        ? isSolid
                          ? 'bg-violet-600 text-white rounded-xl shadow-sm font-semibold'
                          : 'bg-violet-600 text-white rounded-full shadow-md shadow-violet-500/20 translate-x-1'
                        : isSolid
                          ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl'
                          : 'text-black hover:text-black hover:bg-black/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 rounded-full'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : isSolid
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'text-black dark:text-white/70'
                    }`} />
                    <span className={`truncate font-medium ${
                      isActive
                        ? 'text-white'
                        : isSolid
                          ? 'text-slate-700 dark:text-slate-200'
                          : 'text-black dark:text-white/80'
                    }`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* Sidebar Footer info */}
      <div className={`shrink-0 p-4 ${
        isSolid
          ? 'border-t border-gray-200 dark:border-slate-800 bg-[#F9FAFC] dark:bg-slate-800/40'
          : 'border-t border-white/20 dark:border-slate-700/40 bg-slate-50/30 lg:bg-transparent dark:bg-slate-800/20'
      }`}>
        <div className={`flex items-center space-x-2 text-xs ${
          isSolid ? 'text-slate-600 dark:text-slate-400' : 'text-black dark:text-white/70'
        }`}>
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
