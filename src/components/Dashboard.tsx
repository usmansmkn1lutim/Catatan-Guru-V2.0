import React, { useState, useMemo } from 'react';
import { Siswa, Kelas, Mapel, PresensiRecord, ActiveTab } from '../types';
import { Users, GraduationCap, BookOpen, TrendingUp, ClipboardCheck, Award, BookMarked, ArrowUpRight, Sparkles } from 'lucide-react';
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
        { hari: 'Sen', Hadir: 80, Terlambat: 10, Sakit: 5 },
        { hari: 'Sel', Hadir: 85, Terlambat: 8, Sakit: 4 },
        { hari: 'Rab', Hadir: 90, Terlambat: 5, Sakit: 3 },
        { hari: 'Kam', Hadir: 95, Terlambat: 3, Sakit: 1 },
        { hari: 'Jum', Hadir: 70, Terlambat: 12, Sakit: 8 },
        { hari: 'Sab', Hadir: 15, Terlambat: 2, Sakit: 1 },
      ];
    }

    return filtered.map((p) => {
      const tot = p.summary?.totalSiswa || 1;
      return {
        hari: p.tanggal ? p.tanggal.slice(8) : 'Hari',
        Hadir: Math.round(((p.summary?.hadir || 0) / tot) * 100),
        Terlambat: Math.round(((p.summary?.terlambat || 0) / tot) * 100),
        Sakit: Math.round(((p.summary?.sakit || 0) / tot) * 100),
      };
    });
  }, [presensiList, selectedKelasFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Siswa */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-violet-300 dark:hover:border-violet-800 transition-all">
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
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Jumlah Kelas
            </span>
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <GraduationCap className="w-5 h-5" />
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
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
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
                {totalMapel < 10 ? `0${totalMapel}` : totalMapel}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Mata pelajaran diajar</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
              Terdaftar
            </span>
          </div>
        </div>

        {/* Card 4: Rata-rata Kehadiran */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-800 transition-all">
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
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col p-6">
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
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                <XAxis dataKey="hari" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Hadir" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Terlambat" stroke="#c084fc" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Sakit" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Aksi Cepat</h4>
            <div className="space-y-3">
              <button
                onClick={() => goToTab('presensi')}
                className="w-full flex items-center justify-between p-4 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/40 rounded-xl transition-all border border-violet-100 dark:border-violet-900/50 group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm shrink-0">
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
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm shrink-0">
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
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm shrink-0">
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

