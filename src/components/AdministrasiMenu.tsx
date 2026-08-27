import React from 'react';
import { ActiveTab } from '../types';
import { School, UserCheck, BookOpen, GraduationCap, Users } from 'lucide-react';

interface AdministrasiMenuProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const AdministrasiMenu: React.FC<AdministrasiMenuProps> = ({ onNavigate }) => {
  const menus = [
    {
      id: 'sekolah' as ActiveTab,
      label: 'Identitas Sekolah',
      icon: <School className="w-8 h-8 text-violet-500 mb-2" />,
      color: 'bg-violet-50 hover:bg-violet-100 border-violet-100',
    },
    {
      id: 'profil' as ActiveTab,
      label: 'Profil Guru',
      icon: <UserCheck className="w-8 h-8 text-blue-500 mb-2" />,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-100',
    },
    {
      id: 'mapel' as ActiveTab,
      label: 'Mata Pelajaran',
      icon: <BookOpen className="w-8 h-8 text-sky-500 mb-2" />,
      color: 'bg-sky-50 hover:bg-sky-100 border-sky-100',
    },
    {
      id: 'kelas' as ActiveTab,
      label: 'Kelas',
      icon: <GraduationCap className="w-8 h-8 text-fuchsia-500 mb-2" />,
      color: 'bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-100',
    },
    {
      id: 'siswa' as ActiveTab,
      label: 'Siswa',
      icon: <Users className="w-8 h-8 text-indigo-500 mb-2" />,
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center space-x-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Menu Administrasi</h2>
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
