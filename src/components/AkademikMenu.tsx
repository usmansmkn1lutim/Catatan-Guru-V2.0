import React from 'react';
import { ActiveTab } from '../types';
import { BookOpen, GraduationCap, Users, ClipboardCheck, Award, BookMarked } from 'lucide-react';

interface AkademikMenuProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const AkademikMenu: React.FC<AkademikMenuProps> = ({ onNavigate }) => {
  const menus = [
    {
      id: 'mapel' as ActiveTab,
      label: 'Mata Pelajaran',
      icon: <BookOpen className="w-8 h-8 text-sky-500 mb-2" />,
      color: 'bg-sky-50 hover:bg-sky-100 border-sky-100',
    },
    {
      id: 'kelas' as ActiveTab,
      label: 'Data Kelas',
      icon: <GraduationCap className="w-8 h-8 text-fuchsia-500 mb-2" />,
      color: 'bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-100',
    },
    {
      id: 'siswa' as ActiveTab,
      label: 'Data Siswa',
      icon: <Users className="w-8 h-8 text-indigo-500 mb-2" />,
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100',
    },
    {
      id: 'presensi' as ActiveTab,
      label: 'Presensi',
      icon: <ClipboardCheck className="w-8 h-8 text-rose-500 mb-2" />,
      color: 'bg-rose-50 hover:bg-rose-100 border-rose-100',
    },
    {
      id: 'nilai' as ActiveTab,
      label: 'Nilai',
      icon: <Award className="w-8 h-8 text-amber-500 mb-2" />,
      color: 'bg-amber-50 hover:bg-amber-100 border-amber-100',
    },
    {
      id: 'jurnal' as ActiveTab,
      label: 'Jurnal Guru',
      icon: <BookMarked className="w-8 h-8 text-teal-500 mb-2" />,
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-100',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center space-x-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Akademik</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onNavigate(menu.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all ${menu.color} dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-750`}
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
