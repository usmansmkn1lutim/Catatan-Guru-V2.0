import React from 'react';
import { ActiveTab } from '../types';
import { Sliders, FileSpreadsheet, Code2 } from 'lucide-react';

interface SettingMenuProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const SettingMenu: React.FC<SettingMenuProps> = ({ onNavigate }) => {
  const menus = [
    {
      id: 'konfigurasi' as ActiveTab,
      label: 'Konfigurasi Aplikasi',
      icon: <Sliders className="w-8 h-8 text-violet-500 mb-2" />,
      color: 'bg-violet-50 hover:bg-violet-100 border-violet-100',
    },
    {
      id: 'google_sheets' as ActiveTab,
      label: 'Google Sheets API',
      icon: <FileSpreadsheet className="w-8 h-8 text-emerald-500 mb-2" />,
      color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center space-x-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Setting</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onNavigate(menu.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${menu.color} dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-750 shadow-sm hover:shadow-md`}
          >
            {menu.icon}
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center">
              {menu.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
