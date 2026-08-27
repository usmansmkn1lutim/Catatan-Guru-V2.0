import React, { useState, useMemo } from 'react';
import { Siswa, Kelas, Mapel, PresensiRecord, ActiveTab } from '../types';
import { formatDateString } from '../lib/dateUtils';
import { Users, GraduationCap, BookOpen, TrendingUp, ClipboardCheck, Award, BookMarked, ArrowUpRight, Sparkles, DoorClosed, School, User, Building, Settings, FileSpreadsheet, MapPin } from 'lucide-react';
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
}

export const Dashboard: React.FC<DashboardProps> = ({
  siswaList,
  kelasList,
  mapelList,
  presensiList,
  setActiveTab,
  onNavigate,
  dataSekolah,
  profilGuru,
  autoSyncStatus = 'idle',
  lastSyncedTime,
  autoSyncEnabled = true,
  onFetchRemoteData,
}) => {
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('Semua');
  const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);

  const goToTab = (tab: ActiveTab) => {
    if (setActiveTab) setActiveTab(tab);
    if (onNavigate) onNavigate(tab);
  };

  const namaGuru = profilGuru?.namaGuru || 'Guru';
  const namaSekolah = dataSekolah?.namaSekolah || '';

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

  return (
    <div className="space-y-6 pb-28">
      {/* Mobile & Tablet Purple Header */}
      <div className="block lg:hidden bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-800 dark:to-indigo-900 rounded-[2rem] mx-1 sm:mx-2 mt-2 px-5 pt-6 pb-6 shrink-0 shadow-md text-white relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-6 top-2 w-16 h-16 bg-white/5 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between space-y-4">
          {/* Greeting */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-0.5">
              Hello,{" "}
              {profilGuru?.namaGuru
                ? profilGuru.namaGuru.split(",")[0].split(" ")[0]
                : "Guru"}{" "}
              👋
            </h1>
            <p className="text-violet-200 text-xs sm:text-sm">
              Semoga harimu menyenangkan
            </p>
          </div>

          {/* School Information (Bottom Left) */}
          <div className="pt-2 border-t border-white/20">
            {/* Baris 1: Nama Sekolah */}
            <p className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
              {dataSekolah?.namaSekolah || "SMA NEGERI 1 BANGSA YANG BESAR"}
            </p>
            {/* Baris 2: Icon lokasi + Alamat sekolah */}
            <div className="flex items-center gap-1.5 mt-0.5 text-violet-200 text-xs sm:text-sm">
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

      {/* Mobile Horizontal Categories Menu (visible only on mobile) */}
      <div className="block lg:hidden pt-2">
        <div className="flex items-center justify-between px-2 mb-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Menu Utama</h3>
          <button 
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
          >
            {isMenuExpanded ? 'Tutup' : 'See All'}
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-y-4 gap-x-2 px-1">
          {[
            { id: 'presensi', label: 'Presensi', icon: ClipboardCheck, bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-500 dark:text-rose-400' },
            { id: 'nilai', label: 'Nilai', icon: Award, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-500 dark:text-amber-400' },
            { id: 'jurnal', label: 'Jurnal', icon: BookMarked, bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-500 dark:text-teal-400' },
            { id: 'profil', label: 'Profil Guru', icon: User, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-500 dark:text-blue-400' },
          ].map((menu) => (
            <button
              key={menu.id}
              onClick={() => goToTab(menu.id as ActiveTab)}
              className="flex flex-col items-center gap-2 w-full"
            >
              <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${menu.bg} ${menu.text} shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/50 dark:border-slate-800/50`}>
                <menu.icon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
                {menu.label}
              </span>
            </button>
          ))}
        </div>

        {isMenuExpanded && (
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 px-1 mt-4">
            {[
              { id: 'sekolah', label: 'Data Sekolah', icon: Building, bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-500 dark:text-indigo-400' },
              { id: 'mapel', label: 'Data Mapel', icon: BookOpen, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-500 dark:text-emerald-400' },
              { id: 'kelas', label: 'Data Kelas', icon: DoorClosed, bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', text: 'text-fuchsia-500 dark:text-fuchsia-400' },
              { id: 'siswa', label: 'Data Siswa', icon: Users, bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-500 dark:text-cyan-400' },
            ].map((menu) => (
              <button
                key={menu.id}
                onClick={() => goToTab(menu.id as ActiveTab)}
                className="flex flex-col items-center gap-2 w-full"
              >
                <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${menu.bg} ${menu.text} shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/50 dark:border-slate-800/50`}>
                  <menu.icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
                  {menu.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4 Stat Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Card 1: Total Siswa */}
        <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-white/60 dark:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col justify-between hover:border-violet-300 dark:hover:border-violet-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Total Siswa
            </span>
            <div className="p-2.5 bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalSiswa}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Siswa terdaftar</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
              Aktif
            </span>
          </div>
        </div>

        {/* Card 2: Jumlah Kelas */}
        <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-white/60 dark:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Jumlah Kelas
            </span>
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <DoorClosed className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalKelas}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Rombongan belajar</p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
              {totalKelas > 0 ? 'Tersedia' : 'Belum ada'}
            </span>
          </div>
        </div>

        {/* Card 3: Mata Pelajaran */}
        <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-white/60 dark:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Mata Pelajaran
            </span>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalMapel}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Mata pelajaran diampu</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
              Terdaftar
            </span>
          </div>
        </div>

        {/* Card 4: Rata-rata Kehadiran */}
        <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-white/60 dark:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Rata-rata Kehadiran
            </span>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 rounded-xl">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {avgKehadiran}%
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Persentase hadir</p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-200/50 dark:border-amber-800/50 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Baik</span>
            </span>
          </div>
        </div>
      </section>

        
        

        

      {/* Main Content Grid (Chart + Quick Action Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg rounded-2xl border border-white/60 dark:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Statistik Kehadiran Harian
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grafik kehadiran siswa dalam pertemuan pembelajaran
              </p>
            </div>
            <select
              value={selectedKelasFilter}
              onChange={(e) => setSelectedKelasFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-white/60 dark:border-slate-700/50 dark:border-slate-700 rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="Semua">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.namaKelas}>
                  {k.namaKelas}
                </option>
              ))}
            </select>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
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
                        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
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
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Hadir</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-0.5 rounded-full bg-[#f59e0b] inline-block"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Terlambat</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-0.5 rounded-full bg-[#3b82f6] inline-block"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Sakit</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-0.5 rounded-full bg-[#a855f7] inline-block"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Izin</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-0.5 rounded-full bg-[#f43f5e] inline-block"></span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Alpha</span>
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

        {/* Action Panel */}
        <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-lg rounded-2xl border border-white/60 dark:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Aksi Cepat</h4>
            <div className="space-y-3">
              <button
                onClick={() => goToTab('presensi')}
                className="w-full flex items-center justify-between p-4 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 rounded-xl transition-all border border-violet-100 dark:border-violet-900/50 group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] shrink-0">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-violet-900 dark:text-violet-200">Input Presensi</p>
                    <p className="text-[10px] text-violet-500 uppercase font-bold tracking-tight">Pilih Kelas & Mapel</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-violet-400 group-hover:text-violet-600 transition-colors" />
              </button>

              <button
                onClick={() => goToTab('nilai')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-800 group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Input Nilai</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">TP, Tugas, & Ulangan</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>

              <button
                onClick={() => goToTab('jurnal')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-800 group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] shrink-0">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Jurnal Guru</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Catatan Pembelajaran</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            </div>
          </div>

          <div
            onClick={() => goToTab('google_sheets')}
            className="mt-6 p-4 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-slate-800 transition-colors border border-slate-800"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">Sinkron Otomatis Google Sheets</p>
              {autoSyncStatus === 'synced' && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  LIVE SYNC
                </span>
              )}
              {autoSyncStatus === 'syncing' && (
                <span className="text-[10px] font-bold text-violet-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                  MENYIMPAN...
                </span>
              )}
              {autoSyncStatus === 'unconfigured' && (
                <span className="text-[10px] font-bold text-amber-400">
                  SETUP URL SHEET
                </span>
              )}
              {autoSyncStatus === 'error' && (
                <span className="text-[10px] font-bold text-rose-400">
                  KENDALA SYNC
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {autoSyncStatus === 'synced'
                ? `Terakhir disinkronkan otomatis ${lastSyncedTime ? `pukul ${lastSyncedTime}` : 'baru saja'}. Data dapat diakses real-time dari perangkat mana saja.`
                : autoSyncStatus === 'syncing'
                ? 'Sedang mengirim perubahan data ke Google Spreadsheet...'
                : autoSyncStatus === 'unconfigured'
                ? 'Klik untuk memasukkan URL Web App Google Apps Script agar data otomatis tersimpan di Cloud.'
                : 'Klik untuk memeriksa pengaturan koneksi Google Apps Script.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

