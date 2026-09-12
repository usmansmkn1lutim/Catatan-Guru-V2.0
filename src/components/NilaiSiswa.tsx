import React, { useState, useMemo } from 'react';
import { NilaiRecord, Siswa, Kelas, Mapel, NilaiItemSiswa } from '../types';
import { exportToExcel, exportToPdf } from '../lib/storage';
import {
  Award,
  Calendar,
  Calculator,
  Save,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  FileSpreadsheet,
  Plus,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';

interface NilaiSiswaProps {
  nilaiList: NilaiRecord[];
  siswaList: Siswa[];
  kelasList: Kelas[];
  mapelList: Mapel[];
  onSaveNilaiList: (list: NilaiRecord[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

interface ScoreColumn {
  id: string;
  label: string;
  category: 'tp' | 'uh' | 'uts' | 'uas' | 'custom';
}

const DEFAULT_SCORE_COLUMNS: ScoreColumn[] = [
  { id: 'tp1', label: 'TP 1', category: 'tp' },
  { id: 'tp2', label: 'TP 2', category: 'tp' },
  { id: 'uh1', label: 'UH 1', category: 'uh' },
  { id: 'uts', label: 'UTS', category: 'uts' },
  { id: 'uas', label: 'UAS', category: 'uas' },
];

export const NilaiSiswaView: React.FC<NilaiSiswaProps> = ({
  nilaiList,
  siswaList,
  kelasList,
  mapelList,
  onSaveNilaiList,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'rekap'>('input');

  // Dynamic Score Columns State
  const [scoreColumns, setScoreColumns] = useState<ScoreColumn[]>(DEFAULT_SCORE_COLUMNS);

  // Tab 1 Input State
  const [inputTanggal, setInputTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputKelas, setInputKelas] = useState<string>(kelasList[0]?.namaKelas || 'X IPA 1');
  const [inputMapelCode, setInputMapelCode] = useState<string>(mapelList[0]?.kodeMapel || '');

  const selectedMapelObj = useMemo(() => {
    return mapelList.find((m) => m.kodeMapel === inputMapelCode) || mapelList[0];
  }, [mapelList, inputMapelCode]);

  const [inputKkm, setInputKkm] = useState<number | string>(selectedMapelObj?.kkm || 75);

  React.useEffect(() => {
    if (selectedMapelObj) setInputKkm(selectedMapelObj.kkm || 75);
  }, [selectedMapelObj]);

  // Students in selected class
  const classStudents = useMemo(() => {
    return siswaList.filter((s) => s.namaKelas === inputKelas);
  }, [siswaList, inputKelas]);

  // Score state for current input matrix
  const [nilaiItems, setNilaiItems] = useState<NilaiItemSiswa[]>([]);

  // Helper to sync changes to parent state/nilaiList for instant Rekap Nilai reflection
  const autoSyncToNilaiList = (
    updatedItems: NilaiItemSiswa[],
    kkmVal: number | string = inputKkm,
    tglVal: string = inputTanggal
  ) => {
    if (updatedItems.length === 0) return;
    const newRecord: NilaiRecord = {
      id: `nilai-${inputKelas}-${inputMapelCode}`,
      tanggal: tglVal,
      kelas: inputKelas,
      kodeMapel: selectedMapelObj?.kodeMapel || inputMapelCode,
      namaMapel: selectedMapelObj?.namaMapel || 'Mata Pelajaran',
      kkm: Number(kkmVal) || 75,
      items: updatedItems,
    };

    const filtered = nilaiList.filter((n) => !(n.kelas === inputKelas && n.kodeMapel === inputMapelCode));
    onSaveNilaiList([newRecord, ...filtered]);
  };

  // Calculate average and completion based on active score columns
  const calculateItemSummary = (item: NilaiItemSiswa, cols: ScoreColumn[], kkmVal: number | string = inputKkm) => {
    const validScores: number[] = [];

    cols.forEach((col) => {
      let val: number | string | undefined;
      if (col.category === 'uts') {
        val = item.utsScore;
      } else if (col.category === 'uas') {
        val = item.uasScore;
      } else if (col.category === 'uh') {
        val = item.uhScores?.[col.label] ?? item.uhScores?.[col.id];
      } else {
        // 'tp' or 'custom'
        val = item.tpScores?.[col.label] ?? item.tpScores?.[col.id];
      }

      if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) {
        validScores.push(Number(val));
      }
    });

    const avg = validScores.length > 0 ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)) : 0;
    const targetKkm = Number(kkmVal) || 75;
    const isTuntas = avg >= targetKkm;
    return { avg, isTuntas };
  };

  // Initialize or load existing grades when class or mapel changes
  React.useEffect(() => {
    const existingRecord = nilaiList.find((n) => n.kelas === inputKelas && n.kodeMapel === inputMapelCode);
    if (existingRecord) {
      setNilaiItems(existingRecord.items);
      // Reconstruct columns if existing record has tp/uh scores
      if (existingRecord.items.length > 0) {
        const sample = existingRecord.items[0];
        const newCols: ScoreColumn[] = [];

        if (sample.tpScores) {
          Object.keys(sample.tpScores).forEach((k) => {
            newCols.push({ id: `col_${k}`, label: k, category: 'tp' });
          });
        }
        if (sample.uhScores) {
          Object.keys(sample.uhScores).forEach((k) => {
            newCols.push({ id: `col_${k}`, label: k, category: 'uh' });
          });
        }
        if (sample.utsScore !== undefined && sample.utsScore !== '') {
          newCols.push({ id: 'uts', label: 'UTS', category: 'uts' });
        }
        if (sample.uasScore !== undefined && sample.uasScore !== '') {
          newCols.push({ id: 'uas', label: 'UAS', category: 'uas' });
        }

        if (newCols.length > 0) {
          setScoreColumns(newCols);
        } else {
          setScoreColumns(DEFAULT_SCORE_COLUMNS);
        }
      }
    } else {
      setScoreColumns(DEFAULT_SCORE_COLUMNS);
      const initial: NilaiItemSiswa[] = classStudents.map((s) => ({
        siswaId: s.id,
        nisn: s.nisn,
        namaSiswa: s.namaLengkap,
        tpScores: { 'TP 1': '', 'TP 2': '' },
        uhScores: { 'UH 1': '' },
        utsScore: '',
        uasScore: '',
        rataRata: 0,
        isTuntas: false,
      }));
      setNilaiItems(initial);
    }
  }, [classStudents, inputKelas, inputMapelCode, inputKkm, nilaiList]);

  // Handle score change for any column
  const handleScoreChangeForCol = (siswaId: string, col: ScoreColumn, rawVal: string) => {
    let parsedVal: number | string = '';
    if (rawVal !== '' && rawVal !== null && rawVal !== undefined) {
      const num = Number(rawVal);
      if (!isNaN(num)) {
        parsedVal = Math.max(0, Math.min(100, num));
      }
    }

    const updatedItems = nilaiItems.map((item) => {
      if (item.siswaId === siswaId) {
        const newItem: NilaiItemSiswa = { ...item };

        if (col.category === 'uts') {
          newItem.utsScore = parsedVal;
        } else if (col.category === 'uas') {
          newItem.uasScore = parsedVal;
        } else if (col.category === 'uh') {
          newItem.uhScores = { ...(newItem.uhScores || {}), [col.label]: parsedVal };
        } else {
          // tp or custom
          newItem.tpScores = { ...(newItem.tpScores || {}), [col.label]: parsedVal };
        }

        const { avg, isTuntas } = calculateItemSummary(newItem, scoreColumns);
        newItem.rataRata = avg;
        newItem.isTuntas = isTuntas;
        return newItem;
      }
      return item;
    });

    setNilaiItems(updatedItems);
    autoSyncToNilaiList(updatedItems);
  };

  // Add a new score column
  const handleAddColumn = () => {
    const colNumber = scoreColumns.length + 1;
    const newCol: ScoreColumn = {
      id: `col_${Date.now()}`,
      label: `Nilai ${colNumber}`,
      category: 'custom',
    };

    const updatedCols = [...scoreColumns, newCol];
    setScoreColumns(updatedCols);

    const updatedItems = nilaiItems.map((item) => {
      const newItem = {
        ...item,
        tpScores: { ...(item.tpScores || {}), [newCol.label]: '' },
      };
      const { avg, isTuntas } = calculateItemSummary(newItem, updatedCols);
      newItem.rataRata = avg;
      newItem.isTuntas = isTuntas;
      return newItem;
    });

    setNilaiItems(updatedItems);
    autoSyncToNilaiList(updatedItems);
    showToast(`Kolom "${newCol.label}" berhasil ditambahkan!`, 'success');
  };

  // Rename column label
  const handleUpdateColumnLabel = (colId: string, newLabel: string) => {
    const oldCol = scoreColumns.find((c) => c.id === colId);
    if (!oldCol) return;
    const oldLabel = oldCol.label;

    const updatedCols = scoreColumns.map((col) => (col.id === colId ? { ...col, label: newLabel } : col));
    setScoreColumns(updatedCols);

    // Sync item key name
    const updatedItems = nilaiItems.map((item) => {
      const newItem = { ...item };
      if (oldCol.category === 'uh' && newItem.uhScores && oldLabel in newItem.uhScores) {
        const val = newItem.uhScores[oldLabel];
        delete newItem.uhScores[oldLabel];
        newItem.uhScores[newLabel] = val;
      } else if (newItem.tpScores && oldLabel in newItem.tpScores) {
        const val = newItem.tpScores[oldLabel];
        delete newItem.tpScores[oldLabel];
        newItem.tpScores[newLabel] = val;
      }
      return newItem;
    });

    setNilaiItems(updatedItems);
    autoSyncToNilaiList(updatedItems);
  };

  // Delete column
  const handleDeleteColumn = (colId: string) => {
    if (scoreColumns.length <= 1) {
      showToast('Minimal harus ada 1 kolom nilai', 'error');
      return;
    }

    const colToDelete = scoreColumns.find((c) => c.id === colId);
    const updatedCols = scoreColumns.filter((c) => c.id !== colId);
    setScoreColumns(updatedCols);

    if (colToDelete) {
      const updatedItems = nilaiItems.map((item) => {
        const newItem = { ...item };
        if (colToDelete.category === 'uts') delete newItem.utsScore;
        else if (colToDelete.category === 'uas') delete newItem.uasScore;
        else if (colToDelete.category === 'uh' && newItem.uhScores) delete newItem.uhScores[colToDelete.label];
        else if (newItem.tpScores) delete newItem.tpScores[colToDelete.label];

        const { avg, isTuntas } = calculateItemSummary(newItem, updatedCols);
        newItem.rataRata = avg;
        newItem.isTuntas = isTuntas;
        return newItem;
      });

      setNilaiItems(updatedItems);
      autoSyncToNilaiList(updatedItems);
    }

    showToast('Kolom nilai berhasil dihapus', 'success');
  };

  // Button: "Isi Nilai Contoh"
  const handleFillSampleScores = () => {
    setNilaiItems((prev) =>
      prev.map((item) => {
        const randBase = Math.floor(Math.random() * 20) + 75; // 75-95
        const newItem: NilaiItemSiswa = {
          ...item,
          tpScores: { 'TP 1': randBase, 'TP 2': randBase + 2, 'TP 3': randBase - 3 },
          uhScores: { 'UH 1': randBase - 1, 'UH 2': randBase + 1 },
          utsScore: randBase,
          uasScore: randBase + 3,
        };
        const { avg, isTuntas } = calculateItemSummary(newItem, scoreColumns);
        newItem.rataRata = avg;
        newItem.isTuntas = isTuntas;
        return newItem;
      })
    );
    showToast('Nilai contoh berhasil diisikan untuk seluruh siswa!', 'success');
  };

  // Class Average
  const classAvgScore = useMemo(() => {
    if (nilaiItems.length === 0) return 0;
    const sum = nilaiItems.reduce((a, b) => a + (b.rataRata || 0), 0);
    return (sum / nilaiItems.length).toFixed(1);
  }, [nilaiItems]);

  const completedStudentsCount = useMemo(() => {
    return nilaiItems.filter((i) => i.isTuntas).length;
  }, [nilaiItems]);

  const handleSimpanNilai = () => {
    if (nilaiItems.length === 0) {
      showToast('Tidak ada data nilai siswa untuk disimpan', 'error');
      return;
    }

    const newRecord: NilaiRecord = {
      id: `nilai-${inputKelas}-${inputMapelCode}`,
      tanggal: inputTanggal,
      kelas: inputKelas,
      kodeMapel: selectedMapelObj?.kodeMapel || inputMapelCode,
      namaMapel: selectedMapelObj?.namaMapel || 'Mata Pelajaran',
      kkm: Number(inputKkm) || 75,
      items: nilaiItems,
    };

    const filtered = nilaiList.filter((n) => !(n.kelas === inputKelas && n.kodeMapel === inputMapelCode));
    onSaveNilaiList([newRecord, ...filtered]);
    showToast('Data Nilai Siswa berhasil disimpan ke Google Spreadsheet!', 'success');
  };

  // Tab 2 Rekap State
  const [rekapKelasFilter, setRekapKelasFilter] = useState('Semua');
  const [rekapMapelFilter, setRekapMapelFilter] = useState('Semua');
  const [rekapSearchTerm, setRekapSearchTerm] = useState('');

  // Collect all dynamic column labels present across matched NilaiRecords
  const rekapColumns = useMemo(() => {
    const colsSet = new Set<string>();
    nilaiList.forEach((nr) => {
      if (rekapMapelFilter !== 'Semua' && nr.kodeMapel !== rekapMapelFilter) return;
      if (rekapKelasFilter !== 'Semua' && nr.kelas !== rekapKelasFilter) return;

      nr.items.forEach((it) => {
        if (it.tpScores) Object.keys(it.tpScores).forEach((k) => colsSet.add(k));
        if (it.uhScores) Object.keys(it.uhScores).forEach((k) => colsSet.add(k));
        if (it.utsScore !== undefined && it.utsScore !== '') colsSet.add('UTS');
        if (it.uasScore !== undefined && it.uasScore !== '') colsSet.add('UAS');
      });
    });

    const cols = Array.from(colsSet);
    return cols.length > 0 ? cols : ['TP 1', 'TP 2', 'UH 1', 'UTS', 'UAS'];
  }, [nilaiList, rekapKelasFilter, rekapMapelFilter]);

  const rekapFlatData = useMemo(() => {
    const list: {
      siswa: Siswa;
      mapel: string;
      kkm: number;
      scoresMap: Record<string, number | string>;
      rata: number;
      isTuntas: boolean;
    }[] = [];

    siswaList.forEach((s) => {
      if (rekapKelasFilter !== 'Semua' && s.namaKelas !== rekapKelasFilter) return;
      if (rekapSearchTerm && !s.namaLengkap.toLowerCase().includes(rekapSearchTerm.toLowerCase())) return;

      nilaiList.forEach((nr) => {
        if (rekapMapelFilter !== 'Semua' && nr.kodeMapel !== rekapMapelFilter) return;
        if (nr.kelas !== s.namaKelas) return;

        const found = nr.items.find((it) => it.siswaId === s.id || it.nisn === s.nisn);
        if (found) {
          const scoresMap: Record<string, number | string> = {};
          rekapColumns.forEach((colName) => {
            if (colName === 'UTS') {
              scoresMap[colName] = found.utsScore ?? '-';
            } else if (colName === 'UAS') {
              scoresMap[colName] = found.uasScore ?? '-';
            } else if (found.uhScores && colName in found.uhScores) {
              scoresMap[colName] = found.uhScores[colName] ?? '-';
            } else if (found.tpScores && colName in found.tpScores) {
              scoresMap[colName] = found.tpScores[colName] ?? '-';
            } else {
              scoresMap[colName] = '-';
            }
          });

          list.push({
            siswa: s,
            mapel: nr.namaMapel,
            kkm: nr.kkm,
            scoresMap,
            rata: found.rataRata || 0,
            isTuntas: !!found.isTuntas,
          });
        }
      });
    });

    return list;
  }, [siswaList, nilaiList, rekapKelasFilter, rekapMapelFilter, rekapSearchTerm, rekapColumns]);

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nilai Siswa</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Input nilai TP 1-10, UH 1-5, UTS, UAS, kalkulasi tuntas/belum tuntas, dan rekapitulasi nilai
            </p>
          </div>
        </div>

        {/* 2 Tabs Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0">
          <button
            onClick={() => setActiveSubTab('input')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeSubTab === 'input'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Input Nilai
          </button>
          <button
            onClick={() => setActiveSubTab('rekap')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeSubTab === 'rekap'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rekap Nilai
          </button>
        </div>
      </div>

      {/* TAB 1: INPUT NILAI */}
      {activeSubTab === 'input' && (
        <div className="space-y-6">
          {/* Header Parameter */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Kelas</label>
                <select
                  value={inputKelas}
                  onChange={(e) => setInputKelas(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.kodeMapel}>
                      {m.namaMapel} ({m.kodeMapel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal Penilaian</label>
                <input
                  type="date"
                  value={inputTanggal}
                  onChange={(e) => {
                    setInputTanggal(e.target.value);
                    autoSyncToNilaiList(nilaiItems, inputKkm, e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">KKM Kelulusan</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={inputKkm}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = raw === '' ? '' : Number(raw);
                    setInputKkm(val);
                    autoSyncToNilaiList(nilaiItems, val, inputTanggal);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-violet-600 font-bold"
                />
              </div>
            </div>

            {/* Quick Stats Bar & Add Column action & Simpan Nilai button beside it */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-800 text-xs text-slate-800 dark:text-slate-200 gap-3">
              <div className="flex items-center space-x-4">
                <span>Rata-Rata Kelas: <strong className="text-violet-600 text-sm">{classAvgScore}</strong></span>
                <span>Tuntas KKM: <strong className="text-emerald-600 text-sm">{completedStudentsCount} / {nilaiItems.length} Siswa</strong></span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 shadow-sm transition-all"
                  title="Tambah Kolom Nilai Baru"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kolom Nilai</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimpanNilai}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-violet-600 text-white font-semibold rounded-full hover:bg-violet-700 shadow-sm transition-all"
                  title="Simpan Nilai Siswa"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Nilai</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scores Matrix Table with Frozen Columns up to Nama Siswa */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="overflow-x-auto relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    {/* Frozen Columns up to Nama Siswa */}
                    <th className="p-3 sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 min-w-[48px] border-b border-slate-200 dark:border-slate-700">
                      No
                    </th>
                    <th className="p-3 sticky left-[48px] z-20 bg-slate-100 dark:bg-slate-800 min-w-[110px] border-b border-slate-200 dark:border-slate-700">
                      NISN
                    </th>
                    <th className="p-3 sticky left-[158px] z-20 bg-slate-100 dark:bg-slate-800 min-w-[180px] border-b border-r-2 border-slate-300 dark:border-slate-600 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                      Nama Siswa
                    </th>

                    {/* Dynamic Editable Score Header Columns */}
                    {scoreColumns.map((col) => (
                      <th key={col.id} className="p-2 text-center min-w-[110px] border-b border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col items-center gap-1 group">
                          <input
                            type="text"
                            value={col.label}
                            onChange={(e) => handleUpdateColumnLabel(col.id, e.target.value)}
                            className="w-full text-center bg-transparent border-b border-dashed border-violet-400 focus:border-violet-600 font-extrabold text-xs text-slate-800 dark:text-white px-1 py-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all outline-none"
                            title="Klik untuk mengedit nama kolom"
                          />
                          {scoreColumns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(col.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 transition-opacity"
                              title="Hapus Kolom Ini"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}

                    <th className="p-3 text-center min-w-[90px] border-b border-slate-200 dark:border-slate-700">Rata-Rata</th>
                    <th className="p-3 text-center min-w-[110px] border-b border-slate-200 dark:border-slate-700">Status KKM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {nilaiItems.map((item, idx) => (
                    <tr key={item.siswaId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      {/* Frozen Sticky Columns */}
                      <td className="p-3 sticky left-0 z-10 bg-white dark:bg-slate-900 font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 sticky left-[48px] z-10 bg-white dark:bg-slate-900 font-mono text-violet-600 font-semibold">
                        {item.nisn}
                      </td>
                      <td className="p-3 sticky left-[158px] z-10 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white border-r-2 border-slate-200 dark:border-slate-700 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                        {item.namaSiswa}
                      </td>

                      {/* Dynamic Score Cell Inputs */}
                      {scoreColumns.map((col) => {
                        let scoreVal: number | string = '';
                        if (col.category === 'uts') {
                          scoreVal = item.utsScore ?? '';
                        } else if (col.category === 'uas') {
                          scoreVal = item.uasScore ?? '';
                        } else if (col.category === 'uh') {
                          scoreVal = item.uhScores?.[col.label] ?? item.uhScores?.[col.id] ?? '';
                        } else {
                          scoreVal = item.tpScores?.[col.label] ?? item.tpScores?.[col.id] ?? '';
                        }

                        return (
                          <td key={col.id} className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={scoreVal}
                              onChange={(e) => handleScoreChangeForCol(item.siswaId, col, e.target.value)}
                              className="w-16 text-center px-1 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                            />
                          </td>
                        );
                      })}

                      <td className="p-3 text-center font-extrabold text-sm text-slate-900 dark:text-white">
                        {item.rataRata || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.isTuntas
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.isTuntas ? 'Tuntas' : 'Belum Tuntas'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {nilaiItems.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  Tidak ada siswa di kelas ini untuk diinput nilainya.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAP NILAI */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
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
                  placeholder="Nama Siswa..."
                  value={rekapSearchTerm}
                  onChange={(e) => setRekapSearchTerm(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 min-w-[48px] border-b border-slate-200 dark:border-slate-700">No</th>
                    <th className="p-3 sticky left-[48px] z-20 bg-slate-100 dark:bg-slate-800 min-w-[110px] border-b border-slate-200 dark:border-slate-700">NISN</th>
                    <th className="p-3 sticky left-[158px] z-20 bg-slate-100 dark:bg-slate-800 min-w-[180px] border-b border-r-2 border-slate-300 dark:border-slate-600 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]">Nama Siswa</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Mata Pelajaran</th>
                    {rekapColumns.map((colName) => (
                      <th key={colName} className="p-3 text-center min-w-[80px]">
                        {colName}
                      </th>
                    ))}
                    <th className="p-3 text-center">Rata-Rata</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rekapFlatData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-3 sticky left-0 z-10 bg-white dark:bg-slate-900 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 sticky left-[48px] z-10 bg-white dark:bg-slate-900 font-mono font-semibold text-violet-600">{row.siswa.nisn}</td>
                      <td className="p-3 sticky left-[158px] z-10 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white border-r-2 border-slate-200 dark:border-slate-700 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.05)]">{row.siswa.namaLengkap}</td>
                      <td className="p-3">{row.siswa.namaKelas}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{row.mapel}</td>
                      {rekapColumns.map((colName) => (
                        <td key={colName} className="p-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                          {row.scoresMap[colName] !== undefined && row.scoresMap[colName] !== '' ? row.scoresMap[colName] : '-'}
                        </td>
                      ))}
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{row.rata}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.isTuntas ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {row.isTuntas ? 'Tuntas' : 'Belum Tuntas'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {rekapFlatData.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  Belum ada data rekap nilai tersimpan sesuai filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
