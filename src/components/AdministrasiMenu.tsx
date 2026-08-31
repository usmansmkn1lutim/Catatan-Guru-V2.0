import React from 'react';
import { ActiveTab } from '../types';
import { School, UserCheck, BookOpen, GraduationCap, Users, Sparkles, ArrowRight } from 'lucide-react';

interface AdministrasiMenuProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const AdministrasiMenu: React.FC<AdministrasiMenuProps> = ({ onNavigate }) => {
  const menus = [
    {
      id: 'sekolah' as ActiveTab,
      label: 'Identitas Sekolah',
      desc: 'Data pokok sekolah, NPSN, alamat, kepala sekolah & logo instansi',
      icon: <School className="w-7 h-7 text-violet-600 dark:text-violet-400" />,
      accentBg: 'bg-violet-500/10 dark:bg-violet-500/20 border-violet-500/20 dark:border-violet-400/30',
      badge: 'Sekolah',
    },
    {
      id: 'profil' as ActiveTab,
      label: 'Profil Guru',
      desc: 'Informasi guru pengampu, NIP, kontak & foto profil pendidik',
      icon: <UserCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
      accentBg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20 dark:border-blue-400/30',
      badge: 'Pendidik',
    },
    {
      id: 'mapel' as ActiveTab,
      label: 'Mata Pelajaran',
      desc: 'Daftar mata pelajaran yang diampu beserta kode dan jam per minggu',
      icon: <BookOpen className="w-7 h-7 text-sky-600 dark:text-sky-400" />,
      accentBg: 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/20 dark:border-sky-400/30',
      badge: 'Kurikulum',
    },
    {
      id: 'kelas' as ActiveTab,
      label: 'Kelas / Rombel',
      desc: 'Manajemen rombongan belajar, wali kelas & tingkatan tahun ajaran',
      icon: <GraduationCap className="w-7 h-7 text-fuchsia-600 dark:text-fuchsia-400" />,
      accentBg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20 border-fuchsia-500/20 dark:border-fuchsia-400/30',
      badge: 'Rombel',
    },
    {
      id: 'siswa' as ActiveTab,
      label: 'Data Siswa',
      desc: 'Daftar siswa terdaftar per rombel lengkap dengan NIS/NISN',
      icon: <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />,
      accentBg: 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20 dark:border-indigo-400/30',
      badge: 'Peserta Didik',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title with Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/40 dark:border-white/10">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20 dark:border-violet-400/30 text-violet-600 dark:text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Data Pendidikan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
            Menu Administrasi
          </h2>
          <p className="text-xs sm:text-sm text-black dark:text-slate-400 font-medium">
            Kelola data pokok sekolah, profil pengampu, mata pelajaran, rombongan belajar, dan data siswa.
          </p>
        </div>
      </div>

      {/* Light & Dark Glassmorphism Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onNavigate(menu.id)}
            className="group relative bg-white/40 hover:bg-white/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 backdrop-blur-xl border border-white/20 hover:border-violet-400/50 rounded-2xl p-6 shadow-lg transition-all duration-300 flex flex-col justify-between items-stretch text-left overflow-hidden h-full active:scale-[0.98]"
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
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {menu.label}
              </h3>
              <p className="text-xs text-black dark:text-slate-400 font-medium mt-2 leading-relaxed">
                {menu.desc}
              </p>
            </div>

            <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-200/50 dark:border-white/10 text-xs font-bold text-violet-600 dark:text-violet-400">
              <span>Buka Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

