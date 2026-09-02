import React from 'react';
import { ActiveTab } from '../types';
import { CalendarDays, ClipboardCheck, Award, BookMarked, Sparkles, ArrowRight } from 'lucide-react';

interface AkademikMenuProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const AkademikMenu: React.FC<AkademikMenuProps> = ({ onNavigate }) => {
  const menus = [
    {
      id: 'jadwal' as ActiveTab,
      label: 'Jadwal Mengajar',
      desc: 'Pengaturan jadwal presisi dengan dual-sistem Reguler & Blok 2-Mingguan (Minggu A & B)',
      icon: <CalendarDays className="w-7 h-7 text-violet-600 dark:text-violet-400" />,
      accentBg: 'bg-violet-500/10 dark:bg-violet-500/20 border-violet-500/20 dark:border-violet-400/30',
      badge: 'Penjadwalan',
    },
    {
      id: 'presensi' as ActiveTab,
      label: 'Presensi Siswa',
      desc: 'Pencatatan absensi harian (Hadir, Sakit, Izin, Alpa) dan statistik kehadiran',
      icon: <ClipboardCheck className="w-7 h-7 text-rose-600 dark:text-rose-400" />,
      accentBg: 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20 dark:border-rose-400/30',
      badge: 'Presensi',
    },
    {
      id: 'nilai' as ActiveTab,
      label: 'Penilaian Siswa',
      desc: 'Input nilai tugas harian, Tujuan Pembelajaran (TP), ulangan & rekap nilai akhir',
      icon: <Award className="w-7 h-7 text-amber-600 dark:text-amber-400" />,
      accentBg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 dark:border-amber-400/30',
      badge: 'Asesmen',
    },
    {
      id: 'jurnal' as ActiveTab,
      label: 'Jurnal Mengajar Guru',
      desc: 'Catatan agenda kelas, materi ajar, kendala pembelajaran & catatan evaluasi guru',
      icon: <BookMarked className="w-7 h-7 text-teal-600 dark:text-teal-400" />,
      accentBg: 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20 dark:border-teal-400/30',
      badge: 'Jurnal',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title with Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/40 dark:border-white/10">
        <div className="space-y-1">
          <div className="hidden lg:inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-400/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kegiatan Belajar Mengajar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
            Menu Akademik
          </h2>
          <p className="text-xs sm:text-sm text-black dark:text-slate-400 font-medium">
            Akses cepat fitur penjadwalan KBM, pencatatan presensi kehadiran, penginputan asesmen nilai, dan agenda jurnal kelas.
          </p>
        </div>
      </div>

      {/* Light & Dark Glassmorphism Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => onNavigate(menu.id)}
            className="group relative bg-white/40 hover:bg-white/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/60 backdrop-blur-xl border border-white/20 hover:border-emerald-400/50 rounded-2xl p-6 shadow-lg transition-all duration-300 flex flex-col justify-between items-stretch text-left overflow-hidden h-full active:scale-[0.98]"
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
              <h3 className="text-base sm:text-lg font-bold text-black dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {menu.label}
              </h3>
              <p className="text-xs text-black dark:text-slate-400 font-medium mt-2 leading-relaxed">
                {menu.desc}
              </p>
            </div>

            <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-200/50 dark:border-white/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Buka Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

