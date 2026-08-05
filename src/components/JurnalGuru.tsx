import React, { useState, useMemo } from 'react';
import { JurnalRecord, Mapel, Kelas } from '../types';
import { exportToPdf } from '../lib/storage';
import { formatDateString } from '../lib/dateUtils';
import {
  BookMarked,
  Plus,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Eye,
  Download,
  Save,
  X,
  CheckCircle2,
} from 'lucide-react';

interface JurnalGuruProps {
  jurnalList: JurnalRecord[];
  mapelList: Mapel[];
  kelasList: Kelas[];
  onSaveJurnalList: (list: JurnalRecord[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const JurnalGuruView: React.FC<JurnalGuruProps> = ({
  jurnalList,
  mapelList,
  kelasList,
  onSaveJurnalList,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'riwayat'>('input');

  // Input Form State
  const [inputMapelCode, setInputMapelCode] = useState<string>(mapelList[0]?.kodeMapel || '');
  const [inputKelas, setInputKelas] = useState<string>(kelasList[0]?.namaKelas || 'X IPA 1');
  const [inputTanggal, setInputTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputJamKe, setInputJamKe] = useState<string>('1 - 2 (07:30 - 09:00)');
  const [inputPertemuanKe, setInputPertemuanKe] = useState<number>(1);
  const [inputMateri, setInputMateri] = useState<string>('');
  const [inputTpList, setInputTpList] = useState<string[]>(['']);
  const [inputProses, setInputProses] = useState<string>('');
  const [inputCatatan, setInputCatatan] = useState<string>('');
  const [inputJumlahHadir, setInputJumlahHadir] = useState<number>(30);
  const [inputJumlahTidakHadir, setInputJumlahTidakHadir] = useState<number>(0);

  // Get TP List for dropdown based on selected Mapel
  const activeMapelObj = useMemo(() => {
    return mapelList.find((m) => m.kodeMapel === inputMapelCode) || mapelList[0];
  }, [mapelList, inputMapelCode]);

  const availableTpOptions = useMemo(() => {
    if (!activeMapelObj || !activeMapelObj.capaianPembelajaran) return [];
    const tps: { id: string; label: string }[] = [];
    activeMapelObj.capaianPembelajaran.forEach((cp) => {
      cp.tujuanPembelajaran.forEach((tp) => {
        tps.push({
          id: tp.id,
          label: `${tp.kodeTp} - ${tp.deskripsi}`,
        });
      });
    });
    return tps;
  }, [activeMapelObj]);

  // Set default TP option when mapel changes
  React.useEffect(() => {
    if (availableTpOptions.length > 0) {
      setInputTpList([availableTpOptions[0].label]);
    } else {
      setInputTpList(['TP 1 - Memahami konsep dasar']);
    }
  }, [availableTpOptions]);

  const handleAddTpInput = () => {
    const nextOpt = availableTpOptions[inputTpList.length % Math.max(1, availableTpOptions.length)]?.label || availableTpOptions[0]?.label || 'TP General - Pembelajaran reguler';
    setInputTpList((prev) => [...prev, nextOpt]);
  };

  const handleRemoveTpInput = (index: number) => {
    if (inputTpList.length <= 1) return;
    setInputTpList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTpChange = (index: number, val: string) => {
    setInputTpList((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleSimpanJurnal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMateri) {
      showToast('Materi Pembelajaran wajib diisi!', 'error');
      return;
    }

    const combinedTp = inputTpList
      .map((tp) => tp.trim())
      .filter(Boolean)
      .join('; ');

    const newJurnal: JurnalRecord = {
      id: `jurnal-${Date.now()}`,
      tanggal: formatDateString(inputTanggal),
      kodeMapel: activeMapelObj?.kodeMapel || inputMapelCode,
      namaMapel: activeMapelObj?.namaMapel || 'Mata Pelajaran',
      kelas: inputKelas,
      jamKe: inputJamKe,
      pertemuanKe: inputPertemuanKe,
      materiPembelajaran: inputMateri,
      tujuanPembelajaran: combinedTp || 'TP General - Pembelajaran reguler',
      prosesPembelajaran: inputProses,
      catatanKendala: inputCatatan,
      jumlahHadir: inputJumlahHadir,
      jumlahTidakHadir: inputJumlahTidakHadir,
    };

    onSaveJurnalList([newJurnal, ...jurnalList]);
    showToast('Jurnal mengajar guru berhasil disimpan ke Google Spreadsheet!', 'success');
    setActiveSubTab('riwayat');

    // Reset fields
    setInputMateri('');
    setInputProses('');
    setInputCatatan('');
  };

  // Modals state
  const [selectedViewJurnal, setSelectedViewJurnal] = useState<JurnalRecord | null>(null);
  const [editingJurnal, setEditingJurnal] = useState<JurnalRecord | null>(null);

  const handleDeleteJurnal = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jurnal mengajar ini?')) {
      const updated = jurnalList.filter((j) => j.id !== id);
      onSaveJurnalList(updated);
      showToast('Jurnal mengajar berhasil dihapus', 'success');
    }
  };

  const handleDownloadSinglePdf = (j: JurnalRecord) => {
    const headers = ['Parameter Jurnal', 'Detail Laporan Mengajar'];
    const rows = [
      ['Tanggal', j.tanggal],
      ['Kelas', j.kelas],
      ['Mata Pelajaran', j.namaMapel],
      ['Jam Ke / Waktu', j.jamKe],
      ['Pertemuan Ke-', `#${j.pertemuanKe}`],
      ['Materi Pembelajaran', j.materiPembelajaran],
      ['Tujuan Pembelajaran (TP)', j.tujuanPembelajaran],
      ['Proses Pembelajaran', j.prosesPembelajaran],
      ['Catatan / Kendala Siswa', j.catatanKendala || '-'],
      ['Jumlah Siswa Hadir', `${j.jumlahHadir} Siswa`],
      ['Jumlah Siswa Tidak Hadir', `${j.jumlahTidakHadir} Siswa`],
    ];

    exportToPdf(
      `JURNAL MENGAJAR GURU - KELAS ${j.kelas}`,
      `Mata Pelajaran: ${j.namaMapel} | Tanggal: ${j.tanggal}`,
      headers,
      rows,
      `Jurnal_${j.kelas}_${j.tanggal}`
    );
    showToast('File PDF Jurnal berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar & Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Jurnal Guru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catatan harian proses KBM, materi, Tujuan Pembelajaran (TP), serta evaluasi kendala kelas
            </p>
          </div>
        </div>

        {/* 2 Sub-Tabs Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0">
          <button
            onClick={() => setActiveSubTab('input')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeSubTab === 'input'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Input Jurnal
          </button>
          <button
            onClick={() => setActiveSubTab('riwayat')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeSubTab === 'riwayat'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Riwayat Jurnal
          </button>
        </div>
      </div>

      {/* TAB 1: INPUT JURNAL */}
      {activeSubTab === 'input' && (
        <form onSubmit={handleSimpanJurnal} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Formulir Catatan Jurnal Mengajar
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Mata Pelajaran</label>
              <select
                value={inputMapelCode}
                onChange={(e) => setInputMapelCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                {mapelList.map((m) => (
                  <option key={m.id} value={m.kodeMapel}>
                    {m.namaMapel}
                  </option>
                ))}
              </select>
            </div>

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
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal KBM</label>
              <input
                type="date"
                value={inputTanggal}
                onChange={(e) => setInputTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Jam Ke- / Rentang Waktu</label>
              <input
                type="text"
                value={inputJamKe}
                onChange={(e) => setInputJamKe(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Pertemuan Ke-</label>
              <input
                type="number"
                min={1}
                value={inputPertemuanKe}
                onChange={(e) => setInputPertemuanKe(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Jumlah Siswa Hadir</label>
              <input
                type="number"
                min={0}
                value={inputJumlahHadir}
                onChange={(e) => setInputJumlahHadir(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Jumlah Siswa Tidak Hadir</label>
              <input
                type="number"
                min={0}
                value={inputJumlahTidakHadir}
                onChange={(e) => setInputJumlahTidakHadir(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-rose-600"
              />
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-600 dark:text-slate-400">
                  Tujuan Pembelajaran (TP)
                </label>
                <button
                  type="button"
                  onClick={handleAddTpInput}
                  className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-violet-100 hover:bg-violet-200 dark:bg-violet-950 dark:hover:bg-violet-900 text-violet-700 dark:text-violet-300 font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah TP</span>
                </button>
              </div>
              <div className="space-y-2">
                {inputTpList.map((tpVal, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <select
                      value={tpVal}
                      onChange={(e) => handleTpChange(idx, e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-violet-500"
                    >
                      {availableTpOptions.length > 0 ? (
                        availableTpOptions.map((tp) => (
                          <option key={tp.id} value={tp.label}>
                            {tp.label}
                          </option>
                        ))
                      ) : (
                        <option value="TP General - Pembelajaran reguler">TP General - Pembelajaran reguler</option>
                      )}
                    </select>
                    {inputTpList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTpInput(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Hapus TP ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Materi Pembelajaran
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pembahasan Struktur Teks Eksposisi Analitis"
                value={inputMateri}
                onChange={(e) => setInputMateri(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Proses & Metode Pembelajaran
              </label>
              <textarea
                rows={3}
                placeholder="Deskripsikan langkah kegiatan KBM, diskusi kelompok, praktikum, dll..."
                value={inputProses}
                onChange={(e) => setInputProses(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Catatan Evaluasi / Kendala Siswa
              </label>
              <textarea
                rows={2}
                placeholder="Catat kendala pemahaman siswa atau tindak lanjut pembelajaran berikutnya..."
                value={inputCatatan}
                onChange={(e) => setInputCatatan(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 shadow-md shadow-violet-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Jurnal Mengajar</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: RIWAYAT JURNAL */}
      {activeSubTab === 'riwayat' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jurnalList.map((j) => (
              <div
                key={j.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300">
                      Kelas {j.kelas} • Pertemuan #{j.pertemuanKe}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      {j.materiPembelajaran}
                    </h3>
                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-0.5">
                      {j.namaMapel}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingJurnal({ ...j })}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Jurnal"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedViewJurnal(j)}
                      className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadSinglePdf(j)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Unduh PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteJurnal(j.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p><strong>TP:</strong> {j.tujuanPembelajaran}</p>
                  <p className="line-clamp-2"><strong>Proses:</strong> {j.prosesPembelajaran || '-'}</p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span>{formatDateString(j.tanggal)} | Jam: {j.jamKe}</span>
                    <div className="flex items-center space-x-2 font-bold">
                      <span className="text-emerald-600">Hadir: {j.jumlahHadir}</span>
                      <span className="text-rose-600">Tidak Hadir: {j.jumlahTidakHadir ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {jurnalList.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Belum ada riwayat jurnal mengajar tersimpan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal View Detail Jurnal */}
      {selectedViewJurnal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Detail Jurnal — Kelas {selectedViewJurnal.kelas}
              </h3>
              <button onClick={() => setSelectedViewJurnal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <p><strong>Mata Pelajaran:</strong> {selectedViewJurnal.namaMapel}</p>
              <p><strong>Tanggal & Waktu:</strong> {formatDateString(selectedViewJurnal.tanggal)} ({selectedViewJurnal.jamKe})</p>
              <p><strong>Pertemuan Ke-:</strong> #{selectedViewJurnal.pertemuanKe}</p>
              <p><strong>Materi:</strong> {selectedViewJurnal.materiPembelajaran}</p>
              <p><strong>Tujuan Pembelajaran:</strong> {selectedViewJurnal.tujuanPembelajaran}</p>
              <p><strong>Proses Pembelajaran:</strong> {selectedViewJurnal.prosesPembelajaran || '-'}</p>
              <p><strong>Catatan Kendala:</strong> {selectedViewJurnal.catatanKendala || '-'}</p>
              <p><strong>Kehadiran:</strong> {selectedViewJurnal.jumlahHadir} Siswa Hadir / {selectedViewJurnal.jumlahTidakHadir} Tidak Hadir</p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleDownloadSinglePdf(selectedViewJurnal)}
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-full flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>
              <button
                onClick={() => setSelectedViewJurnal(null)}
                className="px-4 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-full"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Jurnal */}
      {editingJurnal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-500" />
                <span>Edit Jurnal Mengajar — Kelas {editingJurnal.kelas}</span>
              </h3>
              <button onClick={() => setEditingJurnal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updated = jurnalList.map((j) => (j.id === editingJurnal.id ? editingJurnal : j));
                onSaveJurnalList(updated);
                showToast('Jurnal mengajar berhasil diperbarui!', 'success');
                setEditingJurnal(null);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Mata Pelajaran</label>
                  <select
                    value={editingJurnal.kodeMapel}
                    onChange={(e) => {
                      const m = mapelList.find((item) => item.kodeMapel === e.target.value);
                      setEditingJurnal({
                        ...editingJurnal,
                        kodeMapel: e.target.value,
                        namaMapel: m ? m.namaMapel : editingJurnal.namaMapel,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.kodeMapel}>
                        {m.namaMapel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Kelas</label>
                  <select
                    value={editingJurnal.kelas}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, kelas: e.target.value })}
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
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editingJurnal.tanggal}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, tanggal: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Jam Ke- / Waktu</label>
                  <input
                    type="text"
                    value={editingJurnal.jamKe}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, jamKe: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Pertemuan Ke-</label>
                  <input
                    type="number"
                    min={1}
                    value={editingJurnal.pertemuanKe}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, pertemuanKe: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Jumlah Siswa Hadir</label>
                  <input
                    type="number"
                    min={0}
                    value={editingJurnal.jumlahHadir}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, jumlahHadir: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Jumlah Siswa Tidak Hadir</label>
                  <input
                    type="number"
                    min={0}
                    value={editingJurnal.jumlahTidakHadir || 0}
                    onChange={(e) => setEditingJurnal({ ...editingJurnal, jumlahTidakHadir: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Materi Pembelajaran</label>
                <input
                  type="text"
                  required
                  value={editingJurnal.materiPembelajaran}
                  onChange={(e) => setEditingJurnal({ ...editingJurnal, materiPembelajaran: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tujuan Pembelajaran (TP)</label>
                <input
                  type="text"
                  required
                  value={editingJurnal.tujuanPembelajaran}
                  onChange={(e) => setEditingJurnal({ ...editingJurnal, tujuanPembelajaran: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Proses & Metode Pembelajaran</label>
                <textarea
                  rows={3}
                  value={editingJurnal.prosesPembelajaran}
                  onChange={(e) => setEditingJurnal({ ...editingJurnal, prosesPembelajaran: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Catatan Evaluasi / Kendala Siswa</label>
                <textarea
                  rows={2}
                  value={editingJurnal.catatanKendala || ''}
                  onChange={(e) => setEditingJurnal({ ...editingJurnal, catatanKendala: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingJurnal(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full shadow-md flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
