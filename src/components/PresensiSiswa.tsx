import React, { useState, useMemo } from 'react';
import { PresensiRecord, Siswa, Kelas, Mapel, StatusPresensi, ItemPresensiSiswa } from '../types';
import { exportToExcel, exportToPdf } from '../lib/storage';
import { formatDateString, formatTimeString } from '../lib/dateUtils';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Pencil,
  Trash2,
  Download,
  Search,
  Filter,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface PresensiSiswaProps {
  presensiList: PresensiRecord[];
  siswaList: Siswa[];
  kelasList: Kelas[];
  mapelList: Mapel[];
  onSavePresensiList: (list: PresensiRecord[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const PresensiSiswaView: React.FC<PresensiSiswaProps> = ({
  presensiList,
  siswaList,
  kelasList,
  mapelList,
  onSavePresensiList,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'riwayat' | 'rekap'>('input');

  // Tab 1 Input State
  const [inputTanggal, setInputTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputKelas, setInputKelas] = useState<string>(kelasList[0]?.namaKelas || 'X IPA 1');
  const [inputMapelCode, setInputMapelCode] = useState<string>(mapelList[0]?.kodeMapel || '');
  const [inputPertemuanKe, setInputPertemuanKe] = useState<number>(1);
  const [inputWaktuMulai, setInputWaktuMulai] = useState<string>('07:30');
  const [inputWaktuSelesai, setInputWaktuSelesai] = useState<string>('09:00');
  const [inputCatatanGlobal, setInputCatatanGlobal] = useState<string>('');

  // Attendance Items for input
  const [studentPresensiItems, setStudentPresensiItems] = useState<ItemPresensiSiswa[]>([]);

  // Live Attendance summary for current input tab items
  const inputLiveSummary = useMemo(() => {
    let hadir = 0,
      terlambat = 0,
      sakit = 0,
      izin = 0,
      alpha = 0;
    studentPresensiItems.forEach((it) => {
      if (it.status === 'Hadir') hadir++;
      else if (it.status === 'Terlambat') terlambat++;
      else if (it.status === 'Sakit') sakit++;
      else if (it.status === 'Izin') izin++;
      else if (it.status === 'Alpha') alpha++;
    });
    return { hadir, terlambat, sakit, izin, alpha };
  }, [studentPresensiItems]);

  // Tab 2 Riwayat Modals
  const [selectedViewRecord, setSelectedViewRecord] = useState<PresensiRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<PresensiRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<PresensiRecord | null>(null);

  // Tab 3 Rekap Filters
  const [rekapKelasFilter, setRekapKelasFilter] = useState<string>('Semua');
  const [rekapMapelFilter, setRekapMapelFilter] = useState<string>('Semua');
  const [rekapSearchTerm, setRekapSearchTerm] = useState<string>('');

  // Sync students on class or mapel change in Input Tab
  const activeStudentsForInput = useMemo(() => {
    return siswaList.filter((s) => s.namaKelas === inputKelas);
  }, [siswaList, inputKelas]);

  // Update presensi state items whenever active class changes
  React.useEffect(() => {
    const initialItems: ItemPresensiSiswa[] = activeStudentsForInput.map((s) => ({
      siswaId: s.id,
      nisn: s.nisn,
      namaSiswa: s.namaLengkap,
      status: 'Hadir',
      catatan: '',
    }));
    setStudentPresensiItems(initialItems);
  }, [activeStudentsForInput]);

  const handleStatusChange = (siswaId: string, status: StatusPresensi) => {
    setStudentPresensiItems((prev) =>
      prev.map((item) => (item.siswaId === siswaId ? { ...item, status } : item))
    );
  };

  const handleCatatanChange = (siswaId: string, catatan: string) => {
    setStudentPresensiItems((prev) =>
      prev.map((item) => (item.siswaId === siswaId ? { ...item, catatan } : item))
    );
  };

  const handleHadirSemua = () => {
    setStudentPresensiItems((prev) => prev.map((item) => ({ ...item, status: 'Hadir' })));
    showToast('Semua siswa diset Hadir!', 'success');
  };

  const handleSimpanPresensi = () => {
    if (studentPresensiItems.length === 0) {
      showToast('Tidak ada siswa di kelas ini untuk dicatat presensinya', 'error');
      return;
    }

    const mapelObj = mapelList.find((m) => m.kodeMapel === inputMapelCode) || mapelList[0];

    let hadir = 0,
      terlambat = 0,
      sakit = 0,
      izin = 0,
      alpha = 0;
    studentPresensiItems.forEach((it) => {
      if (it.status === 'Hadir') hadir++;
      else if (it.status === 'Terlambat') terlambat++;
      else if (it.status === 'Sakit') sakit++;
      else if (it.status === 'Izin') izin++;
      else if (it.status === 'Alpha') alpha++;
    });

    const newRecord: PresensiRecord = {
      id: `presensi-${Date.now()}`,
      tanggal: formatDateString(inputTanggal),
      kelas: inputKelas,
      kodeMapel: mapelObj?.kodeMapel || inputMapelCode,
      namaMapel: mapelObj?.namaMapel || 'Mata Pelajaran',
      pertemuanKe: inputPertemuanKe,
      waktuMulai: formatTimeString(inputWaktuMulai),
      waktuSelesai: formatTimeString(inputWaktuSelesai),
      catatanGlobal: inputCatatanGlobal,
      items: studentPresensiItems,
      summary: {
        hadir,
        terlambat,
        sakit,
        izin,
        alpha,
        totalSiswa: studentPresensiItems.length,
      },
    };

    onSavePresensiList([newRecord, ...presensiList]);
    showToast('Presensi siswa berhasil disimpan ke Google Spreadsheet!', 'success');
    setActiveSubTab('riwayat');
  };

  // Delete Riwayat Record
  const handleDeleteRecord = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data presensi ini?')) {
      const updated = presensiList.filter((p) => p.id !== id);
      onSavePresensiList(updated);
      showToast('Data presensi berhasil dihapus', 'success');
    }
  };

  // Save Edit Record
  const handleSaveEditRecord = () => {
    if (!editingRecord) return;
    let hadir = 0,
      terlambat = 0,
      sakit = 0,
      izin = 0,
      alpha = 0;
    editingRecord.items.forEach((it) => {
      if (it.status === 'Hadir') hadir++;
      else if (it.status === 'Terlambat') terlambat++;
      else if (it.status === 'Sakit') sakit++;
      else if (it.status === 'Izin') izin++;
      else if (it.status === 'Alpha') alpha++;
    });

    const updatedRecord = {
      ...editingRecord,
      summary: { hadir, terlambat, sakit, izin, alpha, totalSiswa: editingRecord.items.length },
    };

    const updatedList = presensiList.map((p) => (p.id === updatedRecord.id ? updatedRecord : p));
    onSavePresensiList(updatedList);
    setEditingRecord(null);
    showToast('Perubahan presensi berhasil disimpan!', 'success');
  };

  // Tab 3 Rekap Data Matrix Calculations
  const rekapMatrixData = useMemo(() => {
    const filteredSiswa = siswaList.filter((s) => {
      const matchKelas = rekapKelasFilter === 'Semua' ? true : s.namaKelas === rekapKelasFilter;
      const matchSearch =
        s.namaLengkap.toLowerCase().includes(rekapSearchTerm.toLowerCase()) ||
        s.nisn.includes(rekapSearchTerm);
      return matchKelas && matchSearch;
    });

    return filteredSiswa.map((siswa, idx) => {
      const pMap: Record<number, string> = {};
      let hadir = 0,
        terlambat = 0,
        sakit = 0,
        izin = 0,
        alpha = 0;

      presensiList.forEach((p) => {
        if (rekapMapelFilter !== 'Semua' && p.kodeMapel !== rekapMapelFilter) return;
        if (p.kelas !== siswa.namaKelas) return;

        const found = p.items.find((it) => it.siswaId === siswa.id || it.nisn === siswa.nisn);
        if (found) {
          pMap[p.pertemuanKe] = found.status;
          if (found.status === 'Hadir') hadir++;
          else if (found.status === 'Terlambat') terlambat++;
          else if (found.status === 'Sakit') sakit++;
          else if (found.status === 'Izin') izin++;
          else if (found.status === 'Alpha') alpha++;
        }
      });

      const total = hadir + terlambat + sakit + izin + alpha;
      const pct = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 100;

      return {
        no: idx + 1,
        siswa,
        meetings: pMap,
        hadir,
        terlambat,
        sakit,
        izin,
        alpha,
        percentage: pct,
      };
    });
  }, [siswaList, presensiList, rekapKelasFilter, rekapMapelFilter, rekapSearchTerm]);

  // Export Rekap Matrix to Excel
  const handleExportExcelRekap = () => {
    const exportRows = rekapMatrixData.map((row) => {
      const obj: any = {
        No: row.no,
        NISN: row.siswa.nisn,
        'Nama Siswa': row.siswa.namaLengkap,
        'Jenis Kelamin': row.siswa.jenisKelamin,
        Kelas: row.siswa.namaKelas,
      };
      for (let i = 1; i <= 25; i++) {
        obj[`P${i}`] = row.meetings[i] || '-';
      }
      obj['Total Hadir'] = row.hadir;
      obj['Total Terlambat'] = row.terlambat;
      obj['Total Sakit'] = row.sakit;
      obj['Total Izin'] = row.izin;
      obj['Total Alpha'] = row.alpha;
      obj['% Kehadiran'] = `${row.percentage}%`;
      return obj;
    });

    exportToExcel(exportRows, `Rekap_Presensi_${rekapKelasFilter}_${new Date().toISOString().split('T')[0]}`, 'Rekap Presensi');
    showToast('Rekap Presensi berhasil diexport ke Excel!', 'success');
  };

  // Export Rekap Matrix to PDF
  const handleExportPdfRekap = () => {
    const headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpha', '% Kehadiran'];
    const rows = rekapMatrixData.map((r) => [
      r.no,
      r.siswa.nisn,
      r.siswa.namaLengkap,
      r.siswa.namaKelas,
      r.hadir,
      r.terlambat,
      r.sakit,
      r.izin,
      r.alpha,
      `${r.percentage}%`,
    ]);

    exportToPdf('REKAPITULASI PRESENSI SISWA', `Kelas: ${rekapKelasFilter} | Mapel: ${rekapMapelFilter}`, headers, rows, 'Rekap_Presensi_Siswa');
    showToast('Rekap Presensi berhasil diexport ke PDF!', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar & Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Presensi Siswa</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Input presensi kelas harian, riwayat pembelajaran, dan rekapitulasi kehadiran 25 pertemuan
            </p>
          </div>
        </div>

        {/* 3 Tabs Segmented Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0">
          <button
            onClick={() => setActiveSubTab('input')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeSubTab === 'input'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Input Presensi
          </button>
          <button
            onClick={() => setActiveSubTab('riwayat')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeSubTab === 'riwayat'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Riwayat Presensi
          </button>
          <button
            onClick={() => setActiveSubTab('rekap')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeSubTab === 'rekap'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rekap Presensi
          </button>
        </div>
      </div>

      {/* TAB 1: INPUT PRESENSI */}
      {activeSubTab === 'input' && (
        <div className="space-y-6">
          {/* Filters Form Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Parameter Pertemuan Pembelajaran
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={inputTanggal}
                  onChange={(e) => setInputTanggal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Kelas</label>
                <select
                  value={inputKelas}
                  onChange={(e) => setInputKelas(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.namaKelas}>
                      {k.namaKelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Mata Pelajaran</label>
                <select
                  value={inputMapelCode}
                  onChange={(e) => setInputMapelCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.kodeMapel}>
                      {m.namaMapel} ({m.kodeMapel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Pertemuan Ke-</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={inputPertemuanKe}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setInputPertemuanKe(raw === '' ? ('' as any) : Number(raw));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Waktu Mulai</label>
                <input
                  type="time"
                  value={inputWaktuMulai}
                  onChange={(e) => setInputWaktuMulai(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Waktu Selesai</label>
                <input
                  type="time"
                  value={inputWaktuSelesai}
                  onChange={(e) => setInputWaktuSelesai(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Student Attendance Matrix Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daftar Presensi Kelas {inputKelas} ({studentPresensiItems.length} Siswa)
                </h3>
                <p className="text-xs text-slate-500">Pilih status kehadiran secara horizontal untuk tiap siswa</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleHadirSemua}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  ✓ Set Hadir Semua
                </button>
                <button
                  type="button"
                  onClick={handleSimpanPresensi}
                  className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors shadow-md shadow-violet-500/20"
                >
                  Simpan Presensi Kelas
                </button>
              </div>
            </div>

            {/* Live Attendance Summary Badges above the Table */}
            <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400 mr-1">Informasi Presensi:</span>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                Hadir: {inputLiveSummary.hadir}
              </span>
              <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold rounded-full border border-amber-200 dark:border-amber-800">
                Terlambat: {inputLiveSummary.terlambat}
              </span>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold rounded-full border border-blue-200 dark:border-blue-800">
                Sakit: {inputLiveSummary.sakit}
              </span>
              <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-full border border-purple-200 dark:border-purple-800">
                Izin: {inputLiveSummary.izin}
              </span>
              <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold rounded-full border border-rose-200 dark:border-rose-800">
                Alpha: {inputLiveSummary.alpha}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">No</th>
                    <th className="p-3">NISN</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Status Kehadiran</th>
                    <th className="p-3">Catatan Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentPresensiItems.map((item, idx) => (
                    <tr key={item.siswaId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-semibold text-violet-600 dark:text-violet-400">{item.nisn}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{item.namaSiswa}</td>
                      <td className="p-3">
                        {/* Horizontal Segmented Control / Radio */}
                        <div className="flex items-center justify-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full max-w-xs mx-auto">
                          {(['Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpha'] as StatusPresensi[]).map((st) => {
                            const isSel = item.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(item.siswaId, st)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                                  isSel
                                    ? st === 'Hadir'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : st === 'Terlambat'
                                      ? 'bg-amber-500 text-white shadow-sm'
                                      : st === 'Sakit'
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : st === 'Izin'
                                      ? 'bg-purple-600 text-white shadow-sm'
                                      : 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Catatan..."
                          value={item.catatan || ''}
                          onChange={(e) => handleCatatanChange(item.siswaId, e.target.value)}
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {studentPresensiItems.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  Tidak ada siswa terdaftar di kelas {inputKelas}. Silakan tambah siswa di menu Data Siswa terlebih dahulu.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT PRESENSI */}
      {activeSubTab === 'riwayat' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presensiList.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {rec.namaMapel}
                    </h3>
                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      Kelas {rec.kelas} • Pertemuan ke-{rec.pertemuanKe}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3 mt-1.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-violet-500" />
                        <span>{formatDateString(rec.tanggal)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-violet-500" />
                        <span>{formatTimeString(rec.waktuMulai)} - {formatTimeString(rec.waktuSelesai)}</span>
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedViewRecord(rec)}
                      className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingRecord(rec)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Presensi"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingRecord(rec)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Hapus Presensi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badge summary counts */}
                <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200">
                    Hadir: {rec.summary.hadir}
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200">
                    Terlambat: {rec.summary.terlambat}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200">
                    Sakit: {rec.summary.sakit}
                  </span>
                  <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200">
                    Izin: {rec.summary.izin}
                  </span>
                  <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200">
                    Alpha: {rec.summary.alpha}
                  </span>
                </div>
              </div>
            ))}

            {presensiList.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Belum ada riwayat presensi tersimpan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REKAP PRESENSI MATRIX (P1 - P25) */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-6">
          {/* Filter & Export toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Kelas:</label>
                <select
                  value={rekapKelasFilter}
                  onChange={(e) => setRekapKelasFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Semua">Semua Kelas</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.namaKelas}>
                      {k.namaKelas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Mata Pelajaran:</label>
                <select
                  value={rekapMapelFilter}
                  onChange={(e) => setRekapMapelFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Semua">Semua Mapel</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.kodeMapel}>
                      {m.namaMapel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Cari Siswa:</label>
                <input
                  type="text"
                  placeholder="Nama / NISN..."
                  value={rekapSearchTerm}
                  onChange={(e) => setRekapSearchTerm(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                onClick={handleExportExcelRekap}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={handleExportPdfRekap}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-full hover:bg-rose-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Matrix Table 25 Pertemuan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-[11px] whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">No</th>
                    <th className="p-2.5 sticky left-8 bg-slate-50 dark:bg-slate-800 z-10">NISN</th>
                    <th className="p-2.5 sticky left-32 bg-slate-50 dark:bg-slate-800 z-10">Nama Siswa</th>
                    <th className="p-2.5">Kelas</th>
                    {Array.from({ length: 25 }, (_, i) => (
                      <th key={i} className="p-2 text-center w-8">
                        P{i + 1}
                      </th>
                    ))}
                    <th className="p-2.5 text-center text-emerald-600">H</th>
                    <th className="p-2.5 text-center text-amber-600">T</th>
                    <th className="p-2.5 text-center text-blue-600">S</th>
                    <th className="p-2.5 text-center text-purple-600">I</th>
                    <th className="p-2.5 text-center text-rose-600">A</th>
                    <th className="p-2.5 text-center">% Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rekapMatrixData.map((row) => (
                    <tr key={row.siswa.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 font-mono sticky left-0 bg-white dark:bg-slate-900 z-10">{row.no}</td>
                      <td className="p-2.5 font-mono text-violet-600 font-semibold sticky left-8 bg-white dark:bg-slate-900 z-10">{row.siswa.nisn}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white sticky left-32 bg-white dark:bg-slate-900 z-10">{row.siswa.namaLengkap}</td>
                      <td className="p-2.5">{row.siswa.namaKelas}</td>
                      {Array.from({ length: 25 }, (_, i) => {
                        const st = row.meetings[i + 1];
                        return (
                          <td key={i} className="p-2 text-center font-bold">
                            {st === 'Hadir' ? (
                              <span className="text-emerald-600">H</span>
                            ) : st === 'Terlambat' ? (
                              <span className="text-amber-500">T</span>
                            ) : st === 'Sakit' ? (
                              <span className="text-blue-500">S</span>
                            ) : st === 'Izin' ? (
                              <span className="text-purple-500">I</span>
                            ) : st === 'Alpha' ? (
                              <span className="text-rose-600">A</span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2.5 text-center font-bold text-emerald-600">{row.hadir}</td>
                      <td className="p-2.5 text-center font-bold text-amber-600">{row.terlambat}</td>
                      <td className="p-2.5 text-center font-bold text-blue-600">{row.sakit}</td>
                      <td className="p-2.5 text-center font-bold text-purple-600">{row.izin}</td>
                      <td className="p-2.5 text-center font-bold text-rose-600">{row.alpha}</td>
                      <td className="p-2.5 text-center font-extrabold text-violet-600">{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Detail Presensi (Eye) */}
      {selectedViewRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Detail Presensi — {selectedViewRecord.namaMapel}
              </h3>
              <button onClick={() => setSelectedViewRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Kelas: <strong className="text-slate-800 dark:text-slate-200">{selectedViewRecord.kelas}</strong> | Tanggal: <strong className="text-slate-800 dark:text-slate-200">{formatDateString(selectedViewRecord.tanggal)}</strong> | <strong className="text-slate-800 dark:text-slate-200">Pertemuan ke-{selectedViewRecord.pertemuanKe}</strong>
            </p>

            <div className="max-h-80 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                  <tr>
                    <th className="p-2.5 text-center w-10">No</th>
                    <th className="p-2.5">NISN</th>
                    <th className="p-2.5">Nama Siswa</th>
                    <th className="p-2.5 text-center">Status Kehadiran</th>
                    <th className="p-2.5">Catatan Khusus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedViewRecord.items.map((it, idx) => {
                    const nisnVal = it.nisn || siswaList.find((s) => s.id === it.siswaId || s.namaLengkap === it.namaSiswa)?.nisn || '-';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-semibold text-violet-600 dark:text-violet-400">{nisnVal}</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{it.namaSiswa}</td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            it.status === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : it.status === 'Terlambat'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : it.status === 'Sakit'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : it.status === 'Izin'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {it.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 italic">{it.catatan || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedViewRecord(null)}
                className="px-5 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-full"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Presensi Record */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Presensi — {editingRecord.namaMapel}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kelas: {editingRecord.kelas} | Tanggal: {formatDateString(editingRecord.tanggal)} | Pertemuan ke-{editingRecord.pertemuanKe}
                </p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                    <tr>
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5">NISN</th>
                      <th className="p-2.5">Nama Siswa</th>
                      <th className="p-2.5 text-center">Status Kehadiran</th>
                      <th className="p-2.5">Catatan Khusus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {editingRecord.items.map((it, idx) => {
                      const nisnVal = it.nisn || siswaList.find((s) => s.id === it.siswaId || s.namaLengkap === it.namaSiswa)?.nisn || '-';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-semibold text-violet-600 dark:text-violet-400">{nisnVal}</td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{it.namaSiswa}</td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full max-w-xs mx-auto">
                              {(['Hadir', 'Terlambat', 'Sakit', 'Izin', 'Alpha'] as StatusPresensi[]).map((st) => {
                                const isSel = it.status === st;
                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                      const updatedItems = editingRecord.items.map((item, i) =>
                                        i === idx ? { ...item, status: st } : item
                                      );
                                      setEditingRecord({ ...editingRecord, items: updatedItems });
                                    }}
                                    className={`px-2 py-1 text-[11px] font-bold rounded-full transition-all ${
                                      isSel
                                        ? st === 'Hadir'
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : st === 'Terlambat'
                                          ? 'bg-amber-500 text-white shadow-sm'
                                          : st === 'Sakit'
                                          ? 'bg-blue-600 text-white shadow-sm'
                                          : st === 'Izin'
                                          ? 'bg-purple-600 text-white shadow-sm'
                                          : 'bg-rose-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="Catatan..."
                              value={it.catatan || ''}
                              onChange={(e) => {
                                const updatedItems = editingRecord.items.map((item, i) =>
                                  i === idx ? { ...item, catatan: e.target.value } : item
                                );
                                setEditingRecord({ ...editingRecord, items: updatedItems });
                              }}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 shrink-0">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditRecord}
                className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Presensi Confirmation */}
      {deletingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Presensi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deletingRecord.namaMapel} — Kelas {deletingRecord.kelas}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data presensi tanggal <strong className="text-slate-900 dark:text-white">{formatDateString(deletingRecord.tanggal)}</strong> (Pertemuan ke-{deletingRecord.pertemuanKe})? Data yang telah dihapus tidak dapat dikembalikan.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const updated = presensiList.filter((p) => p.id !== deletingRecord.id);
                  onSavePresensiList(updated);
                  setDeletingRecord(null);
                  showToast('Data presensi berhasil dihapus', 'success');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
