import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Siswa, Kelas, Mapel, PresensiRecord, JadwalRecord, ScheduleConfig, ScheduleDay, ScheduleCycle, ActiveTab, VisualStyle } from '../types';
import { formatDateString, formatTimeString } from '../lib/dateUtils';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  ClipboardCheck,
  Award,
  BookMarked,
  ArrowUpRight,
  Sparkles,
  DoorClosed,
  School,
  User,
  Building,
  Settings,
  FileSpreadsheet,
  MapPin,
  CalendarDays,
  Clock,
  CheckCircle2,
  Calendar,
  RotateCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function formatChartDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const clean = formatDateString(dateStr);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const day = parts[2];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${monthNames[monthIdx]}`;
    }
  }
  return dateStr;
}

interface DashboardProps {
  siswaList: Siswa[];
  kelasList: Kelas[];
  mapelList: Mapel[];
  presensiList: PresensiRecord[];
  scheduleList?: JadwalRecord[];
  scheduleConfig?: ScheduleConfig;
  setActiveTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: ActiveTab) => void;
  dataSekolah?: any;
  profilGuru?: any;
  nilaiList?: any;
  jurnalList?: any;
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error' | 'disabled' | 'unconfigured';
  lastSyncedTime?: string | null;
  autoSyncEnabled?: boolean;
  onFetchRemoteData?: () => void;
  isDarkMode?: boolean;
  darkMode?: boolean;
  visualStyle?: VisualStyle;
}

export const Dashboard: React.FC<DashboardProps> = ({
  siswaList,
  kelasList,
  mapelList,
  presensiList,
  scheduleList = [],
  scheduleConfig,
  setActiveTab,
  onNavigate,
  dataSekolah,
  profilGuru,
  autoSyncStatus = 'idle',
  lastSyncedTime,
  autoSyncEnabled = true,
  onFetchRemoteData,
  isDarkMode,
  darkMode,
  visualStyle = 'solid',
}) => {
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('Semua');
  const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isAdjustingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isDark = isDarkMode ?? darkMode ?? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const isSolid = visualStyle === 'solid';

  const goToTab = (tab: ActiveTab) => {
    if (setActiveTab) setActiveTab(tab);
    if (onNavigate) onNavigate(tab);
  };

  // Set initial scroll position to virtual index 1 (Slide 0)
  useEffect(() => {
    const el = sliderRef.current;
    if (el) {
      const initScroll = () => {
        if (el.offsetWidth > 0) {
          el.scrollLeft = el.offsetWidth;
        }
      };
      initScroll();
      // Handle potential layout shifts
      const timer = setTimeout(initScroll, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSliderScroll = () => {
    if (!sliderRef.current || isAdjustingRef.current) return;
    const { scrollLeft, offsetWidth } = sliderRef.current;
    if (offsetWidth <= 0) return;

    const currentVirtualIdx = Math.round(scrollLeft / offsetWidth);
    // Real index mapping: virtual index 1 -> 0, 2 -> 1, ..., 5 -> 4, 0 -> 4, 6 -> 0
    const realIdx = (currentVirtualIdx - 1 + 5) % 5;
    setActiveSlide(realIdx);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!sliderRef.current) return;
      const currentPos = sliderRef.current.scrollLeft;
      const width = sliderRef.current.offsetWidth;
      if (width <= 0) return;
      const approxVirtual = Math.round(currentPos / width);

      if (approxVirtual === 0) {
        // Reached left clone (Slide 4) -> Jump instantly to real Slide 4 (index 5)
        isAdjustingRef.current = true;
        sliderRef.current.scrollTo({ left: 5 * width, behavior: 'auto' });
        setTimeout(() => {
          isAdjustingRef.current = false;
        }, 60);
      } else if (approxVirtual === 6) {
        // Reached right clone (Slide 0) -> Jump instantly to real Slide 0 (index 1)
        isAdjustingRef.current = true;
        sliderRef.current.scrollTo({ left: 1 * width, behavior: 'auto' });
        setTimeout(() => {
          isAdjustingRef.current = false;
        }, 60);
      }
    }, 130);
  };

  const nextSlide = () => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.offsetWidth;
    if (width <= 0) return;
    const currentVirtual = Math.round(sliderRef.current.scrollLeft / width);
    sliderRef.current.scrollTo({
      left: (currentVirtual + 1) * width,
      behavior: 'smooth',
    });
  };

  const prevSlide = () => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.offsetWidth;
    if (width <= 0) return;
    const currentVirtual = Math.round(sliderRef.current.scrollLeft / width);
    sliderRef.current.scrollTo({
      left: (currentVirtual - 1) * width,
      behavior: 'smooth',
    });
  };

  const scrollToSlide = (idx: number) => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.offsetWidth;
    if (width <= 0) return;
    sliderRef.current.scrollTo({
      left: (idx + 1) * width,
      behavior: 'smooth',
    });
    setActiveSlide(idx);
  };

  const namaGuru = profilGuru?.namaGuru || 'Guru';
  const namaSekolah = dataSekolah?.namaSekolah || '';

  // Today Date & Cycle Calculation for Jadwal Hari Ini
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todayDayName = useMemo(() => {
    const days: ScheduleDay[] = ['Minggu' as any, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date();
    return days[d.getDay()] || 'Senin';
  }, []);

  const formattedTodayDate = useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${todayDayName}, ${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }, [todayDayName]);

  const todayCycleDetails = useMemo(() => {
    if (!scheduleConfig || scheduleConfig.systemType === 'REGULER') {
      return { cycle: 'Reguler' as ScheduleCycle, label: 'Reguler' };
    }
    const anchor = new Date(scheduleConfig.anchorDate || '2026-07-13');
    const target = new Date(todayDateStr);
    const diffMs = target.getTime() - anchor.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let weekNumber = Math.floor(diffDays / 7) + 1;
    if (isNaN(weekNumber) || weekNumber < 1) weekNumber = 1;
    const isOddWeek = weekNumber % 2 !== 0;
    let cycle: 'A' | 'B' = 'A';
    if (scheduleConfig.cyclePattern === 'A_FIRST') {
      cycle = isOddWeek ? 'A' : 'B';
    } else {
      cycle = isOddWeek ? 'B' : 'A';
    }
    return {
      cycle,
      label: `Minggu ${cycle}`,
    };
  }, [scheduleConfig, todayDateStr]);

  // Schedules active for today
  const todaySchedules = useMemo(() => {
    if (!scheduleList || scheduleList.length === 0) return [];
    return scheduleList
      .filter((s) => {
        if (s.day !== todayDayName) return false;
        if (!scheduleConfig || scheduleConfig.systemType === 'REGULER') return true;
        return s.cycle === 'Reguler' || s.cycle === todayCycleDetails.cycle;
      })
      .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  }, [scheduleList, todayDayName, scheduleConfig, todayCycleDetails.cycle]);

  // Compute stats
  const totalSiswa = siswaList.length;
  const totalKelas = kelasList.length;
  const totalMapel = mapelList.length;

  const avgKehadiran = useMemo(() => {
    if (presensiList.length === 0) return 94.2;
    let totalHadirPct = 0;
    presensiList.forEach((p) => {
      const tot = p.summary?.totalSiswa || 1;
      const pct = (((p.summary?.hadir || 0) + (p.summary?.terlambat || 0)) / tot) * 100;
      totalHadirPct += pct;
    });
    return Math.round((totalHadirPct / presensiList.length) * 10) / 10;
  }, [presensiList]);

  // Chart data preparation
  const chartData = useMemo(() => {
    const filtered =
      selectedKelasFilter === 'Semua'
        ? presensiList
        : presensiList.filter((p) => p.kelas === selectedKelasFilter);

    if (filtered.length === 0) {
      return [
        { rawDate: '2026-08-01', label: '01 Ags', Hadir: 85, Terlambat: 8, Sakit: 4, Izin: 2, Alpha: 1 },
        { rawDate: '2026-08-02', label: '02 Ags', Hadir: 88, Terlambat: 6, Sakit: 3, Izin: 2, Alpha: 1 },
        { rawDate: '2026-08-03', label: '03 Ags', Hadir: 90, Terlambat: 5, Sakit: 3, Izin: 1, Alpha: 1 },
        { rawDate: '2026-08-04', label: '04 Ags', Hadir: 92, Terlambat: 4, Sakit: 2, Izin: 1, Alpha: 1 },
        { rawDate: '2026-08-05', label: '05 Ags', Hadir: 95, Terlambat: 2, Sakit: 1, Izin: 1, Alpha: 0 },
      ];
    }

    // Grouping by sanitized YYYY-MM-DD date string
    const groups: Record<
      string,
      { hadir: number; terlambat: number; sakit: number; izin: number; alpha: number; totalSiswa: number }
    > = {};

    filtered.forEach((p) => {
      const cleanDate = formatDateString(p.tanggal);
      if (!cleanDate) return;

      if (!groups[cleanDate]) {
        groups[cleanDate] = { hadir: 0, terlambat: 0, sakit: 0, izin: 0, alpha: 0, totalSiswa: 0 };
      }

      const totalSiswaInRecord = p.summary?.totalSiswa || (p.items?.length) || 0;
      groups[cleanDate].hadir += p.summary?.hadir || 0;
      groups[cleanDate].terlambat += p.summary?.terlambat || 0;
      groups[cleanDate].sakit += p.summary?.sakit || 0;
      groups[cleanDate].izin += p.summary?.izin || 0;
      groups[cleanDate].alpha += p.summary?.alpha || 0;
      groups[cleanDate].totalSiswa += totalSiswaInRecord;
    });

    // Sort dates chronologically ascending (oldest on left, newest on right)
    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return sortedDates.map((dateKey) => {
      const g = groups[dateKey];
      const tot = g.totalSiswa || 1;

      return {
        rawDate: dateKey,
        label: formatChartDateLabel(dateKey),
        Hadir: Math.round((g.hadir / tot) * 100),
        Terlambat: Math.round((g.terlambat / tot) * 100),
        Sakit: Math.round((g.sakit / tot) * 100),
        Izin: Math.round((g.izin / tot) * 100),
        Alpha: Math.round((g.alpha / tot) * 100),
      };
    });
  }, [presensiList, selectedKelasFilter]);

  // Helper to render Jadwal Hari Ini panel
  const renderJadwalHariIniContent = (isMobileView: boolean = false) => (
    <div className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden h-full ${
      isSolid
        ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm'
        : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 shadow-lg'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-black dark:text-white leading-tight">Jadwal Hari Ini</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{formattedTodayDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {scheduleConfig?.systemType === 'BLOK' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-mono">
                Minggu {todayCycleDetails.cycle}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Reguler
              </span>
            )}
          </div>
        </div>

        {/* Vertical Schedule Cards */}
        <div className={`space-y-3 custom-scrollbar pr-0.5 ${isMobileView ? 'max-h-[380px] overflow-y-auto' : 'flex-1 overflow-y-auto max-h-[360px]'}`}>
          {todaySchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2 my-auto">
              <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Tidak ada jadwal hari ini</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tidak ada jam tatap muka untuk hari {todayDayName}.
                </p>
              </div>
            </div>
          ) : (
            todaySchedules.map((s) => {
              const isDone = presensiList.some(
                (p) =>
                  p.tanggal === todayDateStr &&
                  p.kelas === s.class &&
                  (p.namaMapel === s.subject || p.kodeMapel === s.kodeMapel)
              );

              if (isMobileView) {
                // Layout 2 Kolom untuk Mobile & Tablet
                // Kolom 1 (Kiri): Info Kelas dengan font proporsional (misal: "XC2" lalu "TKR")
                // Kolom 2 (Kanan):
                //   - Baris 1: Jam mulai - Jam selesai
                //   - Baris 2: Mata Pelajaran
                //   - Baris 3: Info Ruangan (icon lokasi) - Info JP, dan tombol presensi di kanan bawah sejajar
                const classParts = s.class.trim().split(/\s+/);
                return (
                  <div
                    key={s.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-stretch gap-3 ${
                      isSolid
                        ? 'bg-[#F9FAFC] dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 shadow-sm'
                        : 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-white/40 dark:border-slate-800 hover:border-violet-300'
                    }`}
                  >
                    {/* Kolom 1 - Kiri: Info Kelas Proporsional */}
                    <div className="w-16 sm:w-20 shrink-0 bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-900/50 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
                      {classParts.length > 1 ? (
                        <>
                          <span className="font-extrabold text-base sm:text-lg text-violet-700 dark:text-violet-300 tracking-tight leading-tight">
                            {classParts[0]}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-violet-600 dark:text-violet-400 tracking-wide leading-tight uppercase">
                            {classParts.slice(1).join(' ')}
                          </span>
                        </>
                      ) : (
                        <span className="font-extrabold text-sm sm:text-base text-violet-700 dark:text-violet-300 tracking-tight leading-tight">
                          {s.class}
                        </span>
                      )}
                    </div>

                    {/* Kolom 2 - Kanan */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                      {/* Baris 1: Jam mulai dan Jam selesai */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
                        <span>{formatTimeString(s.start)} - {formatTimeString(s.end)}</span>
                      </div>

                      {/* Baris 2: Mata Pelajaran */}
                      <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug truncate">
                        {s.subject}
                      </div>

                      {/* Baris 3: Info Ruangan - Info JP & Tombol Presensi di kanan bawah sejajar */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 truncate">
                          <span className="flex items-center gap-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                            <span className="truncate">{s.room || 'Ruang Kelas'}</span>
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold border border-violet-200/60 dark:border-violet-800/60 shrink-0">
                            {s.jpm} JP
                          </span>
                        </div>

                        <div className="shrink-0">
                          {isDone ? (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shadow-sm">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Presensi OK</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => goToTab('presensi')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition flex items-center gap-1 active:scale-95"
                              title="Buka presensi kelas ini"
                            >
                              <ClipboardCheck className="w-3 h-3" />
                              <span>Presensi</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Desktop view layout (unaltered)
              return (
                <div
                  key={s.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col gap-2.5 ${
                    isSolid
                      ? 'bg-[#F9FAFC] dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 shadow-sm'
                      : 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-white/40 dark:border-slate-800 hover:border-violet-300'
                  }`}
                >
                  {/* Top Section: 3 Baris Info */}
                  <div className="w-full space-y-1">
                    {/* Baris 1: Waktu (icon jam 07:30 - 09:15) & Jumlah JP */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
                        <span>{formatTimeString(s.start)} - {formatTimeString(s.end)}</span>
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold border border-violet-200/60 dark:border-violet-800/60">
                        {s.jpm} JP
                      </span>
                    </div>

                    {/* Baris 2: (Mapel) */}
                    <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug truncate">
                      {s.subject}
                    </div>

                    {/* Baris 3: (Kelas diperbesar) & Ruangan */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-sm sm:text-base text-violet-600 dark:text-violet-400 tracking-tight">
                        {s.class}
                      </span>
                      {s.room && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate text-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{s.room}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom-left Section: Tombol Presensi */}
                  <div className="flex items-center justify-start pt-1">
                    {isDone ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Presensi OK</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => goToTab('presensi')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition flex items-center gap-1.5 active:scale-95"
                        title="Buka presensi kelas ini"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Presensi</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer action */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => goToTab('jadwal')}
            className="w-full py-2 px-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lihat Jadwal Selengkapnya</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Helper to render Attendance Chart
  const renderChartContent = () => (
    <div className={`rounded-2xl flex flex-col justify-between p-5 sm:p-6 overflow-hidden h-full ${
      isSolid
        ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm'
        : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 shadow-lg'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <h4 className="text-sm font-bold text-black dark:text-white">
            Statistik Kehadiran Harian
          </h4>
          <p className="text-xs text-black dark:text-white/70">
            Grafik kehadiran siswa dalam pertemuan pembelajaran
          </p>
        </div>
        <select
          value={selectedKelasFilter}
          onChange={(e) => setSelectedKelasFilter(e.target.value)}
          className="bg-white/80 dark:bg-slate-900/60 border border-slate-300 dark:border-white/30 rounded-lg px-3 py-1.5 text-xs font-semibold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm self-start sm:self-auto"
        >
          <option value="Semua" className="text-black bg-white">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k.id} value={k.namaKelas} className="text-black bg-white">
              {k.namaKelas}
            </option>
          ))}
        </select>
      </div>

      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"} />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 11, fill: isDark ? '#ffffff' : '#000000', fontWeight: 600 }} 
              stroke={isDark ? "#ffffff" : "#000000"}
              tickLine={{ stroke: isDark ? "#ffffff" : "#000000" }}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 11, fill: isDark ? '#ffffff' : '#000000', fontWeight: 600 }} 
              unit="%" 
              stroke={isDark ? "#ffffff" : "#000000"}
              tickLine={{ stroke: isDark ? "#ffffff" : "#000000" }}
            />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (!active || !payload || !payload.length) return null;
                const rawDate = payload[0]?.payload?.rawDate;
                const displayLabel = payload[0]?.payload?.label || label;
                const orderMap: Record<string, number> = {
                  Hadir: 1,
                  Terlambat: 2,
                  Sakit: 3,
                  Izin: 4,
                  Alpha: 5,
                };
                const sortedPayload = [...payload].sort((a, b) => {
                  const nameA = a.name || a.dataKey;
                  const nameB = b.name || b.dataKey;
                  return (orderMap[nameA] || 99) - (orderMap[nameB] || 99);
                });

                return (
                  <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-2">
                    <p className="font-semibold text-white border-b border-slate-800 pb-1">
                      Tanggal: {displayLabel} {rawDate ? `(${rawDate})` : ''}
                    </p>
                    <div className="space-y-1">
                      {sortedPayload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex items-center justify-between space-x-4">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-300">{entry.name}:</span>
                          </span>
                          <span className="font-bold" style={{ color: entry.color }}>
                            {entry.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              content={() => (
                <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 rounded-full bg-[#10b981] inline-block"></span>
                    <span className="text-black dark:text-white/80 font-bold">Hadir</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 rounded-full bg-[#f59e0b] inline-block"></span>
                    <span className="text-black dark:text-white/80 font-bold">Terlambat</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 rounded-full bg-[#3b82f6] inline-block"></span>
                    <span className="text-black dark:text-white/80 font-bold">Sakit</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 rounded-full bg-[#a855f7] inline-block"></span>
                    <span className="text-black dark:text-white/80 font-bold">Izin</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-0.5 rounded-full bg-[#f43f5e] inline-block"></span>
                    <span className="text-black dark:text-white/80 font-bold">Alpha</span>
                  </div>
                </div>
              )}
            />
            <Line type="monotone" dataKey="Hadir" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Terlambat" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Sakit" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Izin" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Alpha" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Helper to render individual slide items for infinite slider
  const renderSlideItem = (index: number, isClone: boolean = false) => {
    switch (index) {
      case 0:
        // Slide 0: Card / Bidang Ungu
        return (
          <div key={`slide-0-${isClone ? 'clone' : 'real'}`} className="w-full min-w-full shrink-0 snap-center">
            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-800 dark:via-purple-800 dark:to-indigo-950 rounded-2xl w-full p-5 sm:p-6 shrink-0 shadow-lg text-white relative overflow-hidden border border-white/20 min-h-[175px] sm:min-h-[190px] flex flex-col justify-between">
              {/* Subtle decorative circles */}
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute right-6 top-2 w-16 h-16 bg-white/5 rounded-full blur-lg pointer-events-none" />

              <div className="relative z-10">
                <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                  Hello, {profilGuru?.namaGuru ? profilGuru.namaGuru.split(",")[0].split(" ")[0] : "Guru"} 👋
                </h1>
                <p className="text-violet-200 text-xs sm:text-sm mt-0.5">
                  Semoga harimu menyenangkan & berkah
                </p>
              </div>

              {/* School Information */}
              <div className="relative z-10 pt-2.5 border-t border-white/20 mt-3 flex items-center gap-2.5 sm:gap-3">
                {dataSekolah?.logoSekolahUrl ? (
                  <img
                    src={dataSekolah.logoSekolahUrl}
                    alt="Logo Sekolah"
                    className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0"
                  />
                ) : (
                  <School className="w-8 h-8 sm:w-9 sm:h-9 text-white/90 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                    {dataSekolah?.namaSekolah || "SMA NEGERI 1 BANGSA YANG BESAR"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-violet-200 text-xs">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-violet-300" />
                    <span className="truncate">
                      {dataSekolah?.alamatLengkap ||
                        [dataSekolah?.kelurahan, dataSekolah?.kecamatan, dataSekolah?.kabupatenKota, dataSekolah?.provinsi]
                          .filter(Boolean)
                          .join(", ") ||
                        "Alamat sekolah belum diatur"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        // Slide 1: Total Siswa
        return (
          <div key={`slide-1-${isClone ? 'clone' : 'real'}`} className="w-full min-w-full shrink-0 snap-center">
            <div className={`p-5 sm:p-6 rounded-2xl w-full min-h-[175px] sm:min-h-[190px] flex flex-col justify-between overflow-hidden transition-all shadow-md ${
              isSolid
                ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800'
                : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 sm:p-2.5 bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 rounded-xl shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-black dark:text-white leading-tight">Total Siswa</h4>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-bold rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                  Aktif
                </span>
              </div>

              <div className="my-auto py-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl sm:text-4xl font-black text-black dark:text-white">
                    {totalSiswa}
                  </h3>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Siswa terdaftar
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Data siswa aktif di seluruh rombongan belajar
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Lihat detail siswa</span>
                <button onClick={() => goToTab('siswa')} className="font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 hover:underline active:scale-95 transition">
                  Buka Data Siswa <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        // Slide 2: Jumlah Kelas
        return (
          <div key={`slide-2-${isClone ? 'clone' : 'real'}`} className="w-full min-w-full shrink-0 snap-center">
            <div className={`p-5 sm:p-6 rounded-2xl w-full min-h-[175px] sm:min-h-[190px] flex flex-col justify-between overflow-hidden transition-all shadow-md ${
              isSolid
                ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800'
                : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 sm:p-2.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                    <DoorClosed className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-black dark:text-white leading-tight">Jumlah Kelas</h4>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] sm:text-xs font-bold rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                  {totalKelas > 0 ? 'Tersedia' : 'Belum ada'}
                </span>
              </div>

              <div className="my-auto py-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl sm:text-4xl font-black text-black dark:text-white">
                    {totalKelas}
                  </h3>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Rombongan belajar
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Kelas aktif yang terdaftar dalam tahun ajaran ini
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Lihat rombongan belajar</span>
                <button onClick={() => goToTab('kelas')} className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline active:scale-95 transition">
                  Buka Data Kelas <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        // Slide 3: Mata Pelajaran
        return (
          <div key={`slide-3-${isClone ? 'clone' : 'real'}`} className="w-full min-w-full shrink-0 snap-center">
            <div className={`p-5 sm:p-6 rounded-2xl w-full min-h-[175px] sm:min-h-[190px] flex flex-col justify-between overflow-hidden transition-all shadow-md ${
              isSolid
                ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800'
                : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 sm:p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-black dark:text-white leading-tight">Mata Pelajaran</h4>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-bold rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                  Terdaftar
                </span>
              </div>

              <div className="my-auto py-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl sm:text-4xl font-black text-black dark:text-white">
                    {totalMapel}
                  </h3>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Mata pelajaran diampu
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mata pelajaran yang aktif diajarkan semester ini
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Kelola mata pelajaran</span>
                <button onClick={() => goToTab('mapel')} className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline active:scale-95 transition">
                  Buka Data Mapel <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        // Slide 4: Rata-rata Kehadiran
        return (
          <div key={`slide-4-${isClone ? 'clone' : 'real'}`} className="w-full min-w-full shrink-0 snap-center">
            <div className={`p-5 sm:p-6 rounded-2xl w-full min-h-[175px] sm:min-h-[190px] flex flex-col justify-between overflow-hidden transition-all shadow-md ${
              isSolid
                ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800'
                : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 sm:p-2.5 bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-black dark:text-white leading-tight">Rata-rata Kehadiran</h4>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs font-bold rounded-lg border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Baik</span>
                </span>
              </div>

              <div className="my-auto py-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl sm:text-4xl font-black text-black dark:text-white">
                    {avgKehadiran}%
                  </h3>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Persentase hadir
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tingkat kehadiran siswa dalam seluruh sesi tatap muka
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Buka buku presensi</span>
                <button onClick={() => goToTab('presensi')} className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline active:scale-95 transition">
                  Buka Presensi <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* ========================================================================= */}
      {/* MOBILE & TABLET VIEW (Top Swipeable Card Slider + Menu + Jadwal + Chart) */}
      {/* ========================================================================= */}
      <div className="block lg:hidden space-y-5">
        {/* INFINITE SWIPEABLE CARD SLIDER */}
        <div className="space-y-2.5">
          <div
            ref={sliderRef}
            onScroll={handleSliderScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar select-none gap-3.5 pb-1 -mx-1 px-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Clone of Slide 4 for infinite backward swipe */}
            {renderSlideItem(4, true)}
            
            {/* Real Slides (0 to 4) */}
            {renderSlideItem(0)}
            {renderSlideItem(1)}
            {renderSlideItem(2)}
            {renderSlideItem(3)}
            {renderSlideItem(4)}

            {/* Clone of Slide 0 for infinite forward swipe */}
            {renderSlideItem(0, true)}
          </div>

          {/* Slider Pagination Dots */}
          <div className="flex items-center justify-start px-1.5 pt-1">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeSlide === idx
                      ? 'w-6 bg-violet-600 dark:bg-violet-400'
                      : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* MENU UTAMA SHORTCUTS */}
        <div className={`w-full p-5 overflow-hidden ${
          isSolid
            ? 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm'
            : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-black dark:text-slate-100 text-sm">Menu Utama</h3>
            <button 
              onClick={() => setIsMenuExpanded(!isMenuExpanded)}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
            >
              {isMenuExpanded ? 'Tutup' : 'See All'}
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-3 w-full">
            {[
              { id: 'presensi', label: 'Presensi', icon: ClipboardCheck, bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-500 dark:text-rose-400' },
              { id: 'nilai', label: 'Nilai', icon: Award, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-500 dark:text-amber-400' },
              { id: 'jurnal', label: 'Jurnal', icon: BookMarked, bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-500 dark:text-teal-400' },
              { id: 'jadwal', label: 'Jadwal', icon: Calendar, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-500 dark:text-blue-400' },
            ].map((menu) => (
              <button
                key={menu.id}
                onClick={() => goToTab(menu.id as ActiveTab)}
                className="flex flex-col items-center gap-2 w-full active:scale-95 transition"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${menu.bg} ${menu.text} shadow-sm ${
                  isSolid ? 'border border-gray-200 dark:border-slate-700' : 'border border-white/20'
                }`}>
                  <menu.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-bold text-black dark:text-slate-300 text-center leading-tight truncate w-full">
                  {menu.label}
                </span>
              </button>
            ))}
          </div>

          {isMenuExpanded && (
            <div className="grid grid-cols-4 gap-3 w-full mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              {[
                { id: 'sekolah', label: 'Data Sekolah', icon: Building, bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-500 dark:text-indigo-400' },
                { id: 'mapel', label: 'Data Mapel', icon: BookOpen, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-500 dark:text-emerald-400' },
                { id: 'kelas', label: 'Data Kelas', icon: DoorClosed, bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', text: 'text-fuchsia-500 dark:text-fuchsia-400' },
                { id: 'siswa', label: 'Data Siswa', icon: Users, bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-500 dark:text-cyan-400' },
              ].map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => goToTab(menu.id as ActiveTab)}
                  className="flex flex-col items-center gap-2 w-full active:scale-95 transition"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${menu.bg} ${menu.text} shadow-sm ${
                    isSolid ? 'border border-gray-200 dark:border-slate-700' : 'border border-white/20'
                  }`}>
                    <menu.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-bold text-black dark:text-slate-300 text-center leading-tight truncate w-full">
                    {menu.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* JADWAL HARI INI CONTAINER (Moved Up Below Menu Utama) */}
        <div>
          {renderJadwalHariIniContent(true)}
        </div>

        {/* GRAFIK STATISTIK KEHADIRAN */}
        <div>
          {renderChartContent()}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Top 4 Stat Cards + Main Grid: Chart & Jadwal Hari Ini)     */}
      {/* ========================================================================= */}
      <div className="hidden lg:block space-y-6">
        {/* 4 Stat Cards Grid */}
        <section className="grid grid-cols-4 gap-6 items-stretch w-full">
          {/* Card 1: Total Siswa */}
          <div className={`p-6 rounded-2xl flex flex-col justify-between items-stretch overflow-hidden transition-all h-full ${
            isSolid
              ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm hover:border-violet-400'
              : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 shadow-lg hover:border-violet-300/50 dark:hover:border-violet-700/50'
          }`}>
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="text-xs font-bold text-black dark:text-white/70 uppercase tracking-widest truncate">
                Total Siswa
              </span>
              <div className="p-2.5 bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 rounded-xl shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-0 mt-auto">
              <div className="min-w-0">
                <h3 className="text-3xl font-extrabold text-black dark:text-white truncate">
                  {totalSiswa}
                </h3>
                <p className="text-xs text-black dark:text-white/70 mt-0.5 truncate">Siswa terdaftar</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 shrink-0">
                Aktif
              </span>
            </div>
          </div>

          {/* Card 2: Jumlah Kelas */}
          <div className={`p-6 rounded-2xl flex flex-col justify-between items-stretch overflow-hidden transition-all h-full ${
            isSolid
              ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm hover:border-indigo-400'
              : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 shadow-lg hover:border-indigo-300/50 dark:hover:border-indigo-800/50'
          }`}>
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="text-xs font-bold text-black dark:text-white/70 uppercase tracking-widest truncate">
                Jumlah Kelas
              </span>
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                <DoorClosed className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-0 mt-auto">
              <div className="min-w-0">
                <h3 className="text-3xl font-extrabold text-black dark:text-white truncate">
                  {totalKelas}
                </h3>
                <p className="text-xs text-black dark:text-white/70 mt-0.5 truncate">Rombongan belajar</p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-200/50 dark:border-indigo-800/50 shrink-0">
                {totalKelas > 0 ? 'Tersedia' : 'Belum ada'}
              </span>
            </div>
          </div>

          {/* Card 3: Mata Pelajaran */}
          <div className={`p-6 rounded-2xl flex flex-col justify-between items-stretch overflow-hidden transition-all h-full ${
            isSolid
              ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm hover:border-emerald-400'
              : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 shadow-lg hover:border-emerald-300/50 dark:hover:border-emerald-800/50'
          }`}>
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="text-xs font-bold text-black dark:text-white/70 uppercase tracking-widest truncate">
                Mata Pelajaran
              </span>
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-0 mt-auto">
              <div className="min-w-0">
                <h3 className="text-3xl font-extrabold text-black dark:text-white truncate">
                  {totalMapel}
                </h3>
                <p className="text-xs text-black dark:text-white/70 mt-0.5 truncate">Mata pelajaran diampu</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 shrink-0">
                Terdaftar
              </span>
            </div>
          </div>

          {/* Card 4: Rata-rata Kehadiran */}
          <div className={`p-6 rounded-2xl flex flex-col justify-between items-stretch overflow-hidden transition-all h-full ${
            isSolid
              ? 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm hover:border-amber-400'
              : 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 shadow-lg hover:border-amber-300/50 dark:hover:border-amber-800/50'
          }`}>
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="text-xs font-bold text-black dark:text-white/70 uppercase tracking-widest truncate">
                Rata-rata Kehadiran
              </span>
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-0 mt-auto">
              <div className="min-w-0">
                <h3 className="text-3xl font-extrabold text-black dark:text-white truncate">
                  {avgKehadiran}%
                </h3>
                <p className="text-xs text-black dark:text-white/70 mt-0.5 truncate">Persentase hadir</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-md sm:rounded-lg border border-amber-200/50 dark:border-amber-800/50 flex items-center space-x-1 shrink-0">
                <TrendingUp className="w-3 h-3" />
                <span>Baik</span>
              </span>
            </div>
          </div>
        </section>

        {/* Main Content Grid (Chart + Jadwal Hari Ini Panel) */}
        <div className="grid grid-cols-3 gap-6 items-stretch w-full">
          {/* Chart Section */}
          <div className="col-span-2">
            {renderChartContent()}
          </div>

          {/* Jadwal Hari Ini Panel */}
          <div className="col-span-1">
            {renderJadwalHariIniContent(false)}
          </div>
        </div>
      </div>
    </div>
  );
};

