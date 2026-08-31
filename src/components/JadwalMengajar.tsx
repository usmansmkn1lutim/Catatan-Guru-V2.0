import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  JadwalRecord,
  ScheduleConfig,
  ScheduleCycle,
  ScheduleDay,
  Siswa,
  Kelas,
  Mapel,
  PresensiRecord,
  JurnalRecord,
  StatusPresensi,
  ItemPresensiSiswa,
  VisualStyle,
} from '../types';
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Sliders,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  RotateCw,
  Sparkles,
  MapPin,
  CheckCheck,
  FileSpreadsheet,
  BookOpen,
  GraduationCap,
  Layers,
  ArrowRight,
  Check,
} from 'lucide-react';
import { formatDateString } from '../lib/dateUtils';

interface JadwalMengajarProps {
  scheduleList: JadwalRecord[];
  scheduleConfig: ScheduleConfig;
  siswaList: Siswa[];
  kelasList: Kelas[];
  mapelList: Mapel[];
  presensiList: PresensiRecord[];
  jurnalList: JurnalRecord[];
  onSaveScheduleList: (list: JadwalRecord[]) => void;
  onSaveScheduleConfig: (config: ScheduleConfig) => void;
  onSavePresensiList: (list: PresensiRecord[]) => void;
  onSaveJurnalList: (list: JurnalRecord[]) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  visualStyle?: VisualStyle;
  namaGuru?: string;
  nipGuru?: string;
  namaSekolah?: string;
}

export const JadwalMengajarView: React.FC<JadwalMengajarProps> = ({
  scheduleList,
  scheduleConfig,
  siswaList,
  kelasList,
  mapelList,
  presensiList,
  jurnalList,
  onSaveScheduleList,
  onSaveScheduleConfig,
  onSavePresensiList,
  onSaveJurnalList,
  showToast,
  visualStyle = 'glass',
  namaGuru = 'Guru Mata Pelajaran',
  nipGuru = '-',
  namaSekolah = 'SMK / SMA Negeri 1',
}) => {
  const isSolid = visualStyle === 'solid';

  // View state: 'today' | 'weekly' | 'list'
  const [activeViewMode, setActiveViewMode] = useState<'today' | 'weekly' | 'list'>('today');
  const [activeWeeklyBlockTab, setActiveWeeklyBlockTab] = useState<'A' | 'B'>('A');

  // Selected date state (defaults to today's date formatted as YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [tempConfig, setTempConfig] = useState<ScheduleConfig>({ ...scheduleConfig });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<JadwalRecord | null>(null);
  const [scheduleForm, setScheduleForm] = useState<{
    id?: string;
    day: ScheduleDay;
    cycle: ScheduleCycle;
    subject: string;
    kodeMapel: string;
    class: string;
    period: string;
    start: string;
    end: string;
    room: string;
    jpm: number;
    catatan: string;
  }>({
    day: 'Senin',
    cycle: 'A',
    subject: '',
    kodeMapel: '',
    class: '',
    period: '1 - 2',
    start: '07:15',
    end: '08:45',
    room: '',
    jpm: 2,
    catatan: '',
  });

  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [copyFromDay, setCopyFromDay] = useState<ScheduleDay>('Senin');
  const [copyToDay, setCopyToDay] = useState<ScheduleDay>('Selasa');

  const [deletingSchedule, setDeletingSchedule] = useState<JadwalRecord | null>(null);

  // Quick Presensi Modal
  const [presensiModalData, setPresensiModalData] = useState<{
    schedule: JadwalRecord;
    date: string;
  } | null>(null);
  const [quickStudentStatuses, setQuickStudentStatuses] = useState<
    { siswaId: string; nisn: string; namaSiswa: string; status: StatusPresensi; catatan?: string }[]
  >([]);
  const [quickJournalTopic, setQuickJournalTopic] = useState<string>('');

  // Helper: Cycle calculation for date
  const getCycleDetailsForDate = (dateStr: string) => {
    const anchor = new Date(scheduleConfig.anchorDate || '2026-07-13');
    const target = new Date(dateStr);

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
      weekNumber,
      cycle,
      label: `Minggu ${cycle} (${cycle === 'A' ? 'Ganjil' : 'Genap'})`,
    };
  };

  const currentDayName = useMemo(() => {
    const days: ScheduleDay[] = ['Minggu' as any, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date(selectedDate);
    return days[d.getDay()] || 'Senin';
  }, [selectedDate]);

  const currentCycleDetails = useMemo(() => {
    return getCycleDetailsForDate(selectedDate);
  }, [selectedDate, scheduleConfig]);

  // Schedules active for selected day
  const todaySchedules = useMemo(() => {
    return scheduleList
      .filter((s) => {
        if (s.day !== currentDayName) return false;
        if (scheduleConfig.systemType === 'REGULER') return true;
        return s.cycle === 'Reguler' || s.cycle === currentCycleDetails.cycle;
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [scheduleList, currentDayName, scheduleConfig.systemType, currentCycleDetails.cycle]);

  // Conflict Detection Validator
  const conflicts = useMemo(() => {
    const result: { s1: JadwalRecord; s2: JadwalRecord; reason: string }[] = [];
    for (let i = 0; i < scheduleList.length; i++) {
      for (let j = i + 1; j < scheduleList.length; j++) {
        const s1 = scheduleList[i];
        const s2 = scheduleList[j];

        if (s1.day === s2.day) {
          const cycleOverlap =
            s1.cycle === 'Reguler' || s2.cycle === 'Reguler' || s1.cycle === s2.cycle;
          const timeOverlap = s1.start < s2.end && s1.end > s2.start;

          if (cycleOverlap && timeOverlap) {
            result.push({
              s1,
              s2,
              reason: `Bentrok waktu hari ${s1.day} (${s1.start}-${s1.end}) antara ${s1.subject} (${s1.class}) dan ${s2.subject} (${s2.class})`,
            });
          }
        }
      }
    }
    return result;
  }, [scheduleList]);

  // Filter state for List view
  const [filterDayList, setFilterDayList] = useState<string>('ALL');
  const [filterCycleList, setFilterCycleList] = useState<string>('ALL');

  const filteredScheduleList = useMemo(() => {
    return scheduleList.filter((s) => {
      if (filterDayList !== 'ALL' && s.day !== filterDayList) return false;
      if (filterCycleList !== 'ALL' && s.cycle !== filterCycleList) return false;
      return true;
    });
  }, [scheduleList, filterDayList, filterCycleList]);

  // Check if a schedule has presensi recorded on selected date
  const isSchedulePresensiRecorded = (sched: JadwalRecord, dateStr: string) => {
    return presensiList.some(
      (p) =>
        p.tanggal === dateStr &&
        p.kelas === sched.class &&
        (p.namaMapel === sched.subject || p.kodeMapel === sched.kodeMapel)
    );
  };

  // Handlers for Date Nav
  const navigateDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const resetToToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Open Schedule Form Modal
  const openAddScheduleModal = () => {
    setEditingSchedule(null);
    setScheduleForm({
      day: currentDayName === ('Minggu' as any) ? 'Senin' : currentDayName,
      cycle: scheduleConfig.systemType === 'REGULER' ? 'Reguler' : currentCycleDetails.cycle,
      subject: mapelList[0]?.namaMapel || '',
      kodeMapel: mapelList[0]?.kodeMapel || '',
      class: kelasList[0]?.namaKelas || '',
      period: '1 - 2',
      start: '07:15',
      end: '08:45',
      room: kelasList[0]?.ruangan || 'Ruang Kelas',
      jpm: 2,
      catatan: '',
    });
    setIsScheduleModalOpen(true);
  };

  const openEditScheduleModal = (sched: JadwalRecord) => {
    setEditingSchedule(sched);
    setScheduleForm({
      id: sched.id,
      day: sched.day,
      cycle: sched.cycle,
      subject: sched.subject,
      kodeMapel: sched.kodeMapel || '',
      class: sched.class,
      period: sched.period,
      start: sched.start,
      end: sched.end,
      room: sched.room || '',
      jpm: sched.jpm || 2,
      catatan: sched.catatan || '',
    });
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.subject.trim() || !scheduleForm.class.trim()) {
      showToast('Mohon lengkapi Mata Pelajaran dan Kelas!', 'error');
      return;
    }

    const newRecord: JadwalRecord = {
      id: scheduleForm.id || `sched-${Date.now()}`,
      day: scheduleForm.day,
      cycle: scheduleForm.cycle,
      subject: scheduleForm.subject.trim(),
      kodeMapel: scheduleForm.kodeMapel.trim(),
      class: scheduleForm.class.trim(),
      period: scheduleForm.period.trim(),
      start: scheduleForm.start,
      end: scheduleForm.end,
      room: scheduleForm.room.trim() || 'Ruang Kelas',
      jpm: Number(scheduleForm.jpm) || 2,
      catatan: scheduleForm.catatan.trim(),
    };

    let updated: JadwalRecord[];
    if (editingSchedule) {
      updated = scheduleList.map((s) => (s.id === editingSchedule.id ? newRecord : s));
      showToast('Jadwal mengajar berhasil diperbarui!', 'success');
    } else {
      updated = [...scheduleList, newRecord];
      showToast('Jam mengajar baru berhasil ditambahkan!', 'success');
    }

    onSaveScheduleList(updated);
    setIsScheduleModalOpen(false);
  };

  const handleDeleteSchedule = () => {
    if (!deletingSchedule) return;
    const updated = scheduleList.filter((s) => s.id !== deletingSchedule.id);
    onSaveScheduleList(updated);
    setDeletingSchedule(null);
    showToast('Jadwal mengajar berhasil dihapus!', 'success');
  };

  // Copy schedule actions
  const executeCopyBlockAtoB = () => {
    const blockAScheds = scheduleList.filter((s) => s.cycle === 'A');
    if (blockAScheds.length === 0) {
      showToast('Tidak ada data jadwal Minggu A untuk disalin!', 'error');
      return;
    }

    const newToAdd: JadwalRecord[] = [];
    blockAScheds.forEach((item) => {
      const exists = scheduleList.some(
        (b) => b.cycle === 'B' && b.day === item.day && b.period === item.period
      );
      if (!exists) {
        newToAdd.push({
          ...item,
          id: `sched-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          cycle: 'B',
        });
      }
    });

    if (newToAdd.length === 0) {
      showToast('Seluruh jadwal Minggu A sudah tersedia di Minggu B!', 'error');
      return;
    }

    onSaveScheduleList([...scheduleList, ...newToAdd]);
    setIsCopyModalOpen(false);
    showToast(`Berhasil menduplikasi ${newToAdd.length} jadwal Minggu A ke Minggu B!`, 'success');
  };

  const executeCopyDayToDay = () => {
    if (copyFromDay === copyToDay) {
      showToast('Pilih hari asal dan tujuan yang berbeda!', 'error');
      return;
    }

    const fromScheds = scheduleList.filter((s) => s.day === copyFromDay);
    if (fromScheds.length === 0) {
      showToast(`Tidak ada jadwal pada hari ${copyFromDay}!`, 'error');
      return;
    }

    const newToAdd = fromScheds.map((s) => ({
      ...s,
      id: `sched-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      day: copyToDay,
    }));

    onSaveScheduleList([...scheduleList, ...newToAdd]);
    setIsCopyModalOpen(false);
    showToast(`Berhasil menyalin ${newToAdd.length} jadwal dari ${copyFromDay} ke ${copyToDay}!`, 'success');
  };

  // Wizard handlers
  const openWizard = () => {
    setTempConfig({ ...scheduleConfig });
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const finishWizardSetup = () => {
    onSaveScheduleConfig(tempConfig);
    setIsWizardOpen(false);
    showToast('Konfigurasi sistem jadwal mengajar berhasil diperbarui!', 'success');
  };

  // Quick Presensi Modal
  const openQuickPresensi = (sched: JadwalRecord) => {
    const studentsInClass = siswaList.filter((s) => s.namaKelas === sched.class);
    const initialList =
      studentsInClass.length > 0
        ? studentsInClass.map((st) => ({
            siswaId: st.id,
            nisn: st.nisn || '',
            namaSiswa: st.namaLengkap,
            status: 'Hadir' as StatusPresensi,
            catatan: '',
          }))
        : [
            { siswaId: 's1', nisn: '0012345671', namaSiswa: 'Ahmad Pratama', status: 'Hadir' as StatusPresensi },
            { siswaId: 's2', nisn: '0012345672', namaSiswa: 'Budi Santoso', status: 'Hadir' as StatusPresensi },
            { siswaId: 's3', nisn: '0012345673', namaSiswa: 'Citra Dewi', status: 'Hadir' as StatusPresensi },
            { siswaId: 's4', nisn: '0012345674', namaSiswa: 'Dian Permata', status: 'Hadir' as StatusPresensi },
            { siswaId: 's5', nisn: '0012345675', namaSiswa: 'Eka Saputra', status: 'Hadir' as StatusPresensi },
          ];

    setQuickStudentStatuses(initialList);
    setQuickJournalTopic(`Pembelajaran tatap muka materi ${sched.subject}`);
    setPresensiModalData({ schedule: sched, date: selectedDate });
  };

  const handleSaveQuickPresensi = () => {
    if (!presensiModalData) return;
    const { schedule, date } = presensiModalData;

    const hadirCount = quickStudentStatuses.filter((s) => s.status === 'Hadir').length;
    const terlambatCount = quickStudentStatuses.filter((s) => s.status === 'Terlambat').length;
    const sakitCount = quickStudentStatuses.filter((s) => s.status === 'Sakit').length;
    const izinCount = quickStudentStatuses.filter((s) => s.status === 'Izin').length;
    const alphaCount = quickStudentStatuses.filter((s) => s.status === 'Alpha').length;

    const newPresensiRecord: PresensiRecord = {
      id: `presensi-${Date.now()}`,
      tanggal: date,
      kelas: schedule.class,
      kodeMapel: schedule.kodeMapel || schedule.subject,
      namaMapel: schedule.subject,
      pertemuanKe: 1,
      waktuMulai: schedule.start,
      waktuSelesai: schedule.end,
      catatanGlobal: quickJournalTopic,
      items: quickStudentStatuses.map((s) => ({
        siswaId: s.siswaId,
        nisn: s.nisn,
        namaSiswa: s.namaSiswa,
        status: s.status,
        catatan: s.catatan,
      })),
      summary: {
        hadir: hadirCount,
        terlambat: terlambatCount,
        sakit: sakitCount,
        izin: izinCount,
        alpha: alphaCount,
        totalSiswa: quickStudentStatuses.length,
      },
    };

    // Also auto-record into JurnalGuru
    const newJurnalRecord: JurnalRecord = {
      id: `jurnal-${Date.now()}`,
      tanggal: date,
      kodeMapel: schedule.kodeMapel || schedule.subject,
      namaMapel: schedule.subject,
      kelas: schedule.class,
      jamKe: `Jam ${schedule.period} (${schedule.start} - ${schedule.end})`,
      pertemuanKe: 1,
      materiPembelajaran: quickJournalTopic || `KBM ${schedule.subject}`,
      tujuanPembelajaran: 'Penguasaan materi & capaian kompetensi dasar',
      prosesPembelajaran: 'Penyampaian materi tatap muka, diskusi interaktif, dan latihan.',
      catatanKendala: 'KBM berjalan tertib dan lancar.',
      jumlahHadir: hadirCount + terlambatCount,
      jumlahTidakHadir: sakitCount + izinCount + alphaCount,
    };

    onSavePresensiList([newPresensiRecord, ...presensiList]);
    onSaveJurnalList([newJurnalRecord, ...jurnalList]);
    setPresensiModalData(null);
    showToast('Presensi & Jurnal KBM berhasil disimpan!', 'success');
  };

  return (
    <div className="space-y-6 pb-16 no-print">
      {/* Title Bar & Main Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Jadwal Mengajar</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola waktu KBM secara presisi dengan dukungan sistem Reguler dan Blok 2-Mingguan (Minggu A & B)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openWizard}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5"
            title="Setup Ulang Sistem Jadwal"
          >
            <Sliders className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Setup Sistem</span>
          </button>
          <button
            onClick={() => setIsCopyModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Salin Jadwal</span>
          </button>
          <button
            onClick={openAddScheduleModal}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Active System Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              {scheduleConfig.systemType === 'REGULER' ? 'SISTEM REGULER' : 'SISTEM BLOK 2 MINGGU'}
            </span>
            {scheduleConfig.systemType === 'BLOK' && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Minggu {currentCycleDetails.cycle} Aktif
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {scheduleConfig.systemType === 'REGULER'
              ? 'Jadwal Mengajar — Sistem Reguler Pekanan'
              : `Jadwal Mengajar — MINGGU ${currentCycleDetails.cycle} (${currentCycleDetails.cycle === 'A' ? 'Ganjil' : 'Genap'})`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tahun Ajaran {scheduleConfig.academicYear} • Semester {scheduleConfig.semester}{' '}
            {scheduleConfig.systemType === 'BLOK' && `• Tanggal Acuan: ${scheduleConfig.anchorDate}`}
          </p>
        </div>

        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Total Terjadwal: <span className="font-semibold text-slate-800 dark:text-slate-200">{scheduleList.length} Sesi KBM</span>
        </div>
      </div>

      {/* Conflict Warning Box (Smart Collision Validator) */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 dark:text-amber-200 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900 dark:text-amber-100">
              Peringatan: Potensi Jadwal Bentrok Terdeteksi ({conflicts.length} Konflik)
            </h4>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300/90">{conflicts[0].reason}</p>
          </div>
          <button
            onClick={() => setActiveViewMode('list')}
            className="text-xs font-bold text-amber-900 dark:text-amber-300 underline hover:text-amber-700 dark:hover:text-amber-100"
          >
            Periksa di Daftar
          </button>
        </div>
      )}

      {/* Main View Mode Selector & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Main Display View Mode Selectors */}
        <div
          className={`flex p-1 rounded-2xl max-w-md w-full shadow-inner ${
            isSolid
              ? 'bg-[#F9FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              : 'bg-slate-200/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/40'
          }`}
        >
          <button
            onClick={() => setActiveViewMode('today')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 ${
              activeViewMode === 'today'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Agenda Hari Ini</span>
          </button>
          <button
            onClick={() => setActiveViewMode('weekly')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 ${
              activeViewMode === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Matriks Mingguan</span>
          </button>
          <button
            onClick={() => setActiveViewMode('list')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 ${
              activeViewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Daftar Data</span>
          </button>
        </div>

        {/* Date Selector Navigator for Today View */}
        {activeViewMode === 'today' && (
          <div
            className={`flex items-center space-x-2 p-1.5 rounded-2xl border shadow-sm ${
              isSolid
                ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-white/40 dark:border-slate-800'
            }`}
          >
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-medium text-slate-800 dark:text-white bg-transparent px-2 py-1 outline-none border border-slate-200 dark:border-slate-700 rounded-lg"
            />
            <button
              onClick={() => navigateDate(1)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={resetToToday}
              className="px-3 py-1.5 text-[11px] font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-lg transition border border-violet-200 dark:border-violet-800"
            >
              Hari Ini
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: AGENDA HARI INI */}
      {/* ========================================================================= */}
      {activeViewMode === 'today' && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-5 sm:p-6 shadow-sm space-y-6 ${
              isSolid
                ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  Agenda Pembelajaran Aktif
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatDateString(selectedDate)}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 flex items-center gap-1.5">
                  <RotateCw className="w-3 h-3" />
                  <span>
                    {scheduleConfig.systemType === 'REGULER'
                      ? 'Sistem Reguler'
                      : currentCycleDetails.label}
                  </span>
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {todaySchedules.length} Sesi Hari Ini
                </span>
              </div>
            </div>

            {/* Timeline Cards Container */}
            <div className="space-y-4">
              {currentDayName === ('Minggu' as any) || (currentDayName === 'Sabtu' && !scheduleConfig.activeDays.includes('Sabtu')) ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium space-y-2">
                  <Clock className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Akhir Pekan ({currentDayName})
                  </p>
                  <p>Tidak ada kegiatan KBM tatap muka terjadwal hari ini.</p>
                </div>
              ) : todaySchedules.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium space-y-3">
                  <CalendarDays className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Tidak ada jam mengajar terjadwal untuk hari {currentDayName}.
                  </p>
                  <p>Klik tombol di bawah untuk menambahkan jam pelajaran baru.</p>
                  <button
                    onClick={openAddScheduleModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Jadwal Hari {currentDayName}</span>
                  </button>
                </div>
              ) : (
                todaySchedules.map((sched) => {
                  const hasPresensi = isSchedulePresensiRecorded(sched, selectedDate);
                  return (
                    <div
                      key={sched.id}
                      className={`border rounded-xl p-4 sm:p-5 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isSolid
                          ? 'bg-[#F9FAFC] dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600'
                          : 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-white/40 dark:border-slate-800 hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-900/60 rounded-xl text-center min-w-[95px] shrink-0">
                          <div className="text-[10px] font-semibold uppercase text-violet-600 dark:text-violet-400">
                            Jam {sched.period}
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                            {sched.start} - {sched.end}
                          </div>
                          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            {sched.jpm} JPM
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {sched.subject}
                            </span>
                            <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                              {sched.class}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span>{sched.room || 'Kelas Utama'}</span>
                            </span>
                            {scheduleConfig.systemType === 'BLOK' && (
                              <span className="text-violet-600 dark:text-violet-400 font-medium">
                                • Siklus: Minggu {sched.cycle}
                              </span>
                            )}
                            {sched.catatan && (
                              <span className="text-slate-500 dark:text-slate-400 italic">
                                ({sched.catatan})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 justify-end shrink-0">
                        {hasPresensi ? (
                          <div className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Presensi Selesai</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openQuickPresensi(sched)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition flex items-center space-x-1.5 active:scale-95"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span>Mulai Presensi</span>
                          </button>
                        )}

                        <button
                          onClick={() => openEditScheduleModal(sched)}
                          className="p-2 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Jadwal"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSchedule(sched)}
                          className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MATRIKS MINGGUAN (FLEXIBLE COMPARATIVE GRID) */}
      {/* ========================================================================= */}
      {activeViewMode === 'weekly' && (
        <div className="space-y-4">
          {/* Block Switcher Tabs for Weekly View (Only for Blok System) */}
          {scheduleConfig.systemType === 'BLOK' && (
            <div
              className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm ${
                isSolid
                  ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                  : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-white/40 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lihat Rotasi:
                </span>
                <button
                  onClick={() => setActiveWeeklyBlockTab('A')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    activeWeeklyBlockTab === 'A'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Minggu A (Ganjil)
                </button>
                <button
                  onClick={() => setActiveWeeklyBlockTab('B')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    activeWeeklyBlockTab === 'B'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Minggu B (Genap)
                </button>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(true)}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Minggu A ke B</span>
              </button>
            </div>
          )}

          <div
            className={`rounded-2xl border shadow-sm p-4 sm:p-6 space-y-4 overflow-hidden ${
              isSolid
                ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800'
            }`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {scheduleConfig.systemType === 'REGULER'
                    ? 'Matriks Jam Mengajar Fleksibel (Sistem Reguler)'
                    : `Matriks Jam Mengajar Fleksibel — MINGGU ${activeWeeklyBlockTab}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan alokasi sesi mengajar per hari (Adaptif untuk jenjang SD, SMP, SMA, SMK)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as ScheduleDay[])
                      .filter((d) => d !== 'Sabtu' || scheduleConfig.activeDays.includes('Sabtu'))
                      .map((d) => (
                        <th key={d} className="py-3 px-3 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-700">
                          {d}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <tr className="align-top divide-x divide-slate-200 dark:divide-slate-700">
                    {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as ScheduleDay[])
                      .filter((d) => d !== 'Sabtu' || scheduleConfig.activeDays.includes('Sabtu'))
                      .map((day) => {
                        const targetCycle =
                          scheduleConfig.systemType === 'REGULER' ? 'Reguler' : activeWeeklyBlockTab;
                        const dayScheds = scheduleList
                          .filter((s) => {
                            if (s.day !== day) return false;
                            if (scheduleConfig.systemType === 'REGULER') return true;
                            return s.cycle === 'Reguler' || s.cycle === targetCycle;
                          })
                          .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'));

                        return (
                          <td key={day} className="py-3 px-2.5 space-y-2.5 align-top min-w-[150px]">
                            {dayScheds.length === 0 ? (
                              <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-[11px] italic bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                Tidak ada jam
                              </div>
                            ) : (
                              dayScheds.map((s) => (
                                <div
                                  key={s.id}
                                  className="p-3 rounded-xl border border-violet-200/80 dark:border-violet-900/60 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-950/40 dark:to-slate-900/60 hover:shadow-sm transition space-y-1.5 group relative"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] font-semibold font-mono">
                                      Jam {s.period}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                      {s.start} - {s.end}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-slate-900 dark:text-white text-xs leading-snug">
                                    {s.subject}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-600 dark:text-slate-400 pt-1 border-t border-violet-100/60 dark:border-slate-800">
                                    <span className="text-violet-600 dark:text-violet-400 font-semibold">
                                      {s.class}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5 text-rose-500" />
                                      {s.room || 'Kelas'}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </td>
                        );
                      })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: DAFTAR JADWAL (TABLE LIST MASTER) */}
      {/* ========================================================================= */}
      {activeViewMode === 'list' && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border shadow-sm overflow-hidden ${
              isSolid
                ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800'
                : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800'
            }`}
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Master Data Jadwal Mengajar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kelola, pantau, dan modifikasi seluruh entri jadwal mengajar
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterDayList}
                  onChange={(e) => setFilterDayList(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="ALL">Semua Hari</option>
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>

                <select
                  value={filterCycleList}
                  onChange={(e) => setFilterCycleList(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="ALL">Semua Siklus/Tipe</option>
                  <option value="Reguler">Reguler</option>
                  <option value="A">Minggu A</option>
                  <option value="B">Minggu B</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Hari</th>
                    <th className="py-3 px-4">Jam / Waktu</th>
                    <th className="py-3 px-4">Siklus</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4">Ruangan</th>
                    <th className="py-3 px-4 text-center">JPM</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredScheduleList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                        Tidak ada data jadwal ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredScheduleList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{s.day}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium font-mono">
                          Jam {s.period} ({s.start} - {s.end})
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.cycle === 'A'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : s.cycle === 'B'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {s.cycle === 'Reguler' ? 'Reguler' : 'Minggu ' + s.cycle}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{s.class}</td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {s.subject}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {s.room || 'Kelas Utama'}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-violet-600 dark:text-violet-400">
                          {s.jpm}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditScheduleModal(s)}
                              className="p-1.5 text-violet-600 hover:text-violet-800 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingSchedule(s)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SETUP WIZARD (2-STEP CONFIGURATION) */}
      {/* ========================================================================= */}
      {isWizardOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden my-auto">
              <button
                onClick={() => setIsWizardOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  SETUP SISTEM JADWAL MENGAJAR
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Konfigurasi sistem jam mengajar semester ini sesuai kurikulum sekolah Anda
                </p>

                {/* Step indicators */}
                <div className="flex items-center justify-center space-x-2 pt-3">
                  <span
                    className={`w-8 h-2 rounded-full transition-all ${
                      wizardStep === 1 ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  ></span>
                  <span
                    className={`w-8 h-2 rounded-full transition-all ${
                      wizardStep === 2 ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  ></span>
                </div>
              </div>

              {/* STEP 1: CHOOSE SYSTEM */}
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option REGULER */}
                    <div
                      onClick={() => {
                        setTempConfig({ ...tempConfig, systemType: 'REGULER' });
                        setWizardStep(2);
                      }}
                      className={`border-2 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-3 group ${
                        tempConfig.systemType === 'REGULER'
                          ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-violet-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 font-bold text-lg">
                          📅
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-violet-600 dark:group-hover:text-violet-400">
                          SISTEM REGULER
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Jadwal berulang sama setiap minggu (Senin–Sabtu). Cocok untuk sekolah dengan sistem jadwal konvensional.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <span>Pilih Reguler</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Option BLOK */}
                    <div
                      onClick={() => {
                        setTempConfig({ ...tempConfig, systemType: 'BLOK' });
                        setWizardStep(2);
                      }}
                      className={`border-2 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between space-y-3 group ${
                        tempConfig.systemType === 'BLOK'
                          ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-violet-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3 font-bold text-lg">
                          🔄
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-violet-600 dark:group-hover:text-violet-400">
                          SISTEM BLOK 2 MINGGU
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Jadwal berganti selang-seling setiap 2 minggu (Minggu A & Minggu B). Sangat cocok untuk SMK / Kurikulum Merdeka.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <span>Pilih Sistem Blok</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      Catatan: Anda dapat melakukan Reset & Setup Ulang Sistem Jadwal kapan saja jika terjadi perubahan kebijakan kurikulum.
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 2: SYSTEM PARAMETERS */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tahun Ajaran
                      </label>
                      <select
                        value={tempConfig.academicYear}
                        onChange={(e) => setTempConfig({ ...tempConfig, academicYear: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                      >
                        <option value="2025/2026">2025/2026</option>
                        <option value="2026/2027">2026/2027</option>
                        <option value="2027/2028">2027/2028</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Semester
                      </label>
                      <select
                        value={tempConfig.semester}
                        onChange={(e) =>
                          setTempConfig({ ...tempConfig, semester: e.target.value as 'Ganjil' | 'Genap' })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                      >
                        <option value="Ganjil">Ganjil</option>
                        <option value="Genap">Genap</option>
                      </select>
                    </div>
                  </div>

                  {/* Fields for BLOK SYSTEM */}
                  {tempConfig.systemType === 'BLOK' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Tanggal Awal Siklus (Minggu 1 / Minggu A)
                        </label>
                        <input
                          type="date"
                          value={tempConfig.anchorDate}
                          onChange={(e) => setTempConfig({ ...tempConfig, anchorDate: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Sistem otomatis menghitung penanggalan Minggu A & B dari tanggal acuan ini.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Pola Awal Rotasi
                        </label>
                        <select
                          value={tempConfig.cyclePattern}
                          onChange={(e) =>
                            setTempConfig({
                              ...tempConfig,
                              cyclePattern: e.target.value as 'A_FIRST' | 'B_FIRST',
                            })
                          }
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                        >
                          <option value="A_FIRST">Minggu A → Minggu B → Minggu A</option>
                          <option value="B_FIRST">Minggu B → Minggu A → Minggu B</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Active Days Selection */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hari Belajar Aktif
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((d) => (
                        <label
                          key={d}
                          className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl cursor-not-allowed opacity-80"
                        >
                          <input type="checkbox" checked disabled className="rounded text-violet-600" />
                          <span>{d}</span>
                        </label>
                      ))}
                      <label className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
                        <input
                          type="checkbox"
                          checked={tempConfig.activeDays.includes('Sabtu')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempConfig({
                                ...tempConfig,
                                activeDays: [...tempConfig.activeDays, 'Sabtu'],
                              });
                            } else {
                              setTempConfig({
                                ...tempConfig,
                                activeDays: tempConfig.activeDays.filter((d) => d !== 'Sabtu'),
                              });
                            }
                          }}
                          className="rounded text-violet-600"
                        />
                        <span>Sabtu</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    >
                      ← Kembali
                    </button>
                    <button
                      type="button"
                      onClick={finishWizardSetup}
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    >
                      Simpan & Selesai
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH / EDIT JADWAL */}
      {/* ========================================================================= */}
      {isScheduleModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 my-auto">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingSchedule ? 'Edit Jam Mengajar' : 'Tambah Jam Mengajar Baru'}
                </h3>
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-4 mt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hari
                    </label>
                    <select
                      value={scheduleForm.day}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, day: e.target.value as ScheduleDay })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="Senin">Senin</option>
                      <option value="Selasa">Selasa</option>
                      <option value="Rabu">Rabu</option>
                      <option value="Kamis">Kamis</option>
                      <option value="Jumat">Jumat</option>
                      <option value="Sabtu">Sabtu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Siklus / Tipe
                    </label>
                    <select
                      value={scheduleForm.cycle}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, cycle: e.target.value as ScheduleCycle })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-violet-600 dark:text-violet-400 font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="Reguler">Reguler (Setiap Minggu)</option>
                      <option value="A">Minggu A (Ganjil)</option>
                      <option value="B">Minggu B (Genap)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      list="mapel-options"
                      required
                      placeholder="Contoh: Bahasa Inggris"
                      value={scheduleForm.subject}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = mapelList.find((m) => m.namaMapel === val);
                        setScheduleForm({
                          ...scheduleForm,
                          subject: val,
                          kodeMapel: match ? match.kodeMapel : scheduleForm.kodeMapel,
                        });
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <datalist id="mapel-options">
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.namaMapel} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kelas
                    </label>
                    <input
                      type="text"
                      list="kelas-options"
                      required
                      placeholder="Contoh: X TKR 1"
                      value={scheduleForm.class}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, class: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <datalist id="kelas-options">
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.namaKelas} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jam Ke-
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1 - 2"
                      value={scheduleForm.period}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, period: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.start}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, start: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.end}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, end: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ruangan / Lab
                    </label>
                    <input
                      type="text"
                      placeholder="Ruang 3 / Lab"
                      value={scheduleForm.room}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah JPM
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      required
                      value={scheduleForm.jpm}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, jpm: parseInt(e.target.value, 10) || 2 })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition"
                  >
                    Simpan Jadwal
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL 3: SALIN JADWAL (COPY SCHEDULE) */}
      {/* ========================================================================= */}
      {isCopyModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 my-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Salin Jadwal Pembelajaran
                </h3>
                <button
                  onClick={() => setIsCopyModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Option 1: Copy Block A -> Block B */}
                {scheduleConfig.systemType === 'BLOK' && (
                  <div className="p-4 rounded-2xl bg-violet-50/60 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 space-y-2">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      <span>1. Duplikasi Minggu A ke Minggu B</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Menggandakan seluruh susunan jadwal Minggu A ke Minggu B agar Anda tidak perlu menginput ulang dari awal.
                    </p>
                    <button
                      onClick={executeCopyBlockAtoB}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition shadow-sm"
                    >
                      Salin Minggu A → Minggu B
                    </button>
                  </div>
                )}

                {/* Option 2: Copy Day X -> Day Y */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    <span>2. Salin Antar Hari</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Dari Hari:
                      </label>
                      <select
                        value={copyFromDay}
                        onChange={(e) => setCopyFromDay(e.target.value as ScheduleDay)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-2.5 py-1.5 font-medium"
                      >
                        <option value="Senin">Senin</option>
                        <option value="Selasa">Selasa</option>
                        <option value="Rabu">Rabu</option>
                        <option value="Kamis">Kamis</option>
                        <option value="Jumat">Jumat</option>
                        <option value="Sabtu">Sabtu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Ke Hari:
                      </label>
                      <select
                        value={copyToDay}
                        onChange={(e) => setCopyToDay(e.target.value as ScheduleDay)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-2.5 py-1.5 font-medium"
                      >
                        <option value="Senin">Senin</option>
                        <option value="Selasa">Selasa</option>
                        <option value="Rabu">Rabu</option>
                        <option value="Kamis">Kamis</option>
                        <option value="Jumat">Jumat</option>
                        <option value="Sabtu">Sabtu</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={executeCopyDayToDay}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-semibold transition"
                  >
                    Salin Jadwal Hari
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL 4: INTEGRATED PRESENSI SISWA (KBM PRESENSI CEPAT) */}
      {/* ========================================================================= */}
      {presensiModalData &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 my-auto">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    Presensi & Jurnal KBM
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    Kelas {presensiModalData.schedule.class} • {presensiModalData.schedule.subject}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDateString(presensiModalData.date)} • Jam{' '}
                    {presensiModalData.schedule.start} – {presensiModalData.schedule.end} (
                    {presensiModalData.schedule.room || 'Kelas'})
                  </p>
                </div>
                <button
                  onClick={() => setPresensiModalData(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Action Toolbar */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-800 dark:text-white">
                  Daftar Siswa ({quickStudentStatuses.length})
                </div>
                <button
                  onClick={() =>
                    setQuickStudentStatuses((prev) =>
                      prev.map((s) => ({ ...s, status: 'Hadir' as StatusPresensi }))
                    )
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Hadir Semua</span>
                </button>
              </div>

              {/* Student Roster List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {quickStudentStatuses.map((st, idx) => (
                  <div
                    key={st.siswaId || idx}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="font-semibold text-slate-800 dark:text-white min-w-0 pr-2 truncate">
                      {st.namaSiswa}
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as StatusPresensi[]).map((status) => {
                        const isSel = st.status === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setQuickStudentStatuses((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, status } : item))
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              isSel
                                ? status === 'Hadir'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : status === 'Izin'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : status === 'Sakit'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-rose-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Journal Note */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan Ringkasan Materi / Jurnal KBM
                </label>
                <input
                  type="text"
                  value={quickJournalTopic}
                  onChange={(e) => setQuickJournalTopic(e.target.value)}
                  placeholder="Contoh: Diskusi materi dan latihan soal..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setPresensiModalData(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveQuickPresensi}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Presensi & Jurnal</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL 5: HAPUS JADWAL CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingSchedule &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 my-auto">
              <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
                <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hapus Jam Mengajar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {deletingSchedule.subject} — {deletingSchedule.class}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus jadwal{' '}
                <strong className="text-slate-900 dark:text-white">
                  {deletingSchedule.subject} ({deletingSchedule.class})
                </strong>{' '}
                pada hari <strong className="text-slate-900 dark:text-white">{deletingSchedule.day}</strong> (Jam{' '}
                {deletingSchedule.period})?
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setDeletingSchedule(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteSchedule}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Ya, Hapus Jadwal
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
