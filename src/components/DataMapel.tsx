import React, { useState } from 'react';
import { Mapel, CPItem, TPItem } from '../types';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Layers,
  FileUp,
  X,
  Check,
  Upload,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataMapelProps {
  mapelList: Mapel[];
  onSaveMapelList: (list: Mapel[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DataMapelView: React.FC<DataMapelProps> = ({
  mapelList,
  onSaveMapelList,
  showToast,
}) => {
  const [selectedMapelId, setSelectedMapelId] = useState<string>(mapelList[0]?.id || '');
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<Mapel | null>(null);

  // CP & TP Modal state
  const [isCpTpModalOpen, setIsCpTpModalOpen] = useState(false);
  const [activeCpList, setActiveCpList] = useState<CPItem[]>([]);

  // Import CP/TP state
  const [isImportCpModalOpen, setIsImportCpModalOpen] = useState(false);
  const [importedPreviewData, setImportedPreviewData] = useState<any[]>([]);
  const [isDraggingCp, setIsDraggingCp] = useState(false);

  const activeMapel = mapelList.find((m) => m.id === selectedMapelId) || mapelList[0];

  // Mapel CRUD
  const handleOpenAddMapel = () => {
    setEditingMapel({
      id: `mapel-${Date.now()}`,
      kodeMapel: '',
      namaMapel: '',
      tingkatKelas: 'Kelas 10',
      fase: 'Fase E',
      bebanJam: 2,
      kkm: 75,
      capaianPembelajaran: [],
    });
    setIsMapelModalOpen(true);
  };

  const handleOpenEditMapel = () => {
    if (!activeMapel) return;
    setEditingMapel({ ...activeMapel });
    setIsMapelModalOpen(true);
  };

  const handleDeleteMapel = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus Mata Pelajaran ini?')) {
      const updated = mapelList.filter((m) => m.id !== id);
      onSaveMapelList(updated);
      if (updated.length > 0) setSelectedMapelId(updated[0].id);
      showToast('Mata Pelajaran berhasil dihapus', 'success');
    }
  };

  const handleSaveMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapel) return;

    const existsIndex = mapelList.findIndex((m) => m.id === editingMapel.id);
    let newList: Mapel[];
    if (existsIndex >= 0) {
      newList = [...mapelList];
      newList[existsIndex] = editingMapel;
    } else {
      newList = [...mapelList, editingMapel];
    }
    onSaveMapelList(newList);
    setSelectedMapelId(editingMapel.id);
    setIsMapelModalOpen(false);
    showToast('Mata Pelajaran berhasil disimpan!', 'success');
  };

  // CP/TP CRUD
  const handleOpenCpTpModal = () => {
    if (!activeMapel) return;
    setActiveCpList(activeMapel.capaianPembelajaran || []);
    setIsCpTpModalOpen(true);
  };

  const handleAddCP = () => {
    const newCp: CPItem = {
      id: `cp-${Date.now()}`,
      kodeCp: `CP-${activeCpList.length + 1}`,
      deskripsi: 'Capaian pembelajaran baru...',
      tujuanPembelajaran: [
        { id: `tp-${Date.now()}-1`, kodeTp: 'TP 1', deskripsi: 'Tujuan pembelajaran 1...' },
      ],
    };
    setActiveCpList([...activeCpList, newCp]);
  };

  const handleDeleteCP = (cpId: string) => {
    setActiveCpList(activeCpList.filter((c) => c.id !== cpId));
  };

  const handleAddTP = (cpId: string) => {
    setActiveCpList(
      activeCpList.map((cp) => {
        if (cp.id === cpId) {
          if (cp.tujuanPembelajaran.length >= 10) {
            showToast('Maksimal 10 TP untuk setiap CP!', 'error');
            return cp;
          }
          const nextTpNum = cp.tujuanPembelajaran.length + 1;
          const newTp: TPItem = {
            id: `tp-${Date.now()}-${nextTpNum}`,
            kodeTp: `TP ${nextTpNum}`,
            deskripsi: `Tujuan pembelajaran ${nextTpNum}...`,
          };
          return { ...cp, tujuanPembelajaran: [...cp.tujuanPembelajaran, newTp] };
        }
        return cp;
      })
    );
  };

  const handleDeleteTP = (cpId: string, tpId: string) => {
    setActiveCpList(
      activeCpList.map((cp) => {
        if (cp.id === cpId) {
          return { ...cp, tujuanPembelajaran: cp.tujuanPembelajaran.filter((t) => t.id !== tpId) };
        }
        return cp;
      })
    );
  };

  const handleSaveCpTp = () => {
    if (!activeMapel) return;
    const updatedMapelList = mapelList.map((m) => {
      if (m.id === activeMapel.id) {
        return { ...m, capaianPembelajaran: activeCpList };
      }
      return m;
    });
    onSaveMapelList(updatedMapelList);
    setIsCpTpModalOpen(false);
    showToast('Data CP & TP berhasil diperbarui!', 'success');
  };

  // Download Template CP/TP Excel
  const handleDownloadCpTemplate = () => {
    const templateRows = [
      [
        'Kode CP',
        'Deskripsi CP',
        'TP 1',
        'TP 2',
        'TP 3',
        'TP 4',
        'TP 5',
        'TP 6',
        'TP 7',
        'TP 8',
        'TP 9',
        'TP 10',
      ],
      [
        'CP-01',
        'Peserta didik mampu memahami konsep dan prinsip utama materi pembelajaran...',
        'Menjelaskan definisi dan konsep dasar secara sistematis',
        'Mengidentifikasi komponen dan elemen utama',
        'Menganalisis hubungan antar variabel',
        'Menyusun kesimpulan berdasarkan fakta',
      ],
      [
        'CP-02',
        'Peserta didik mampu menerapkan keterampilan praktis dan memecahkan masalah...',
        'Melakukan prosedur kerja sesuai langkah standar',
        'Mengevaluasi hasil uji coba dengan kritis',
        'Menyusun laporan hasil kegiatan',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_CP_TP');
    XLSX.writeFile(wb, `Template_CP_TP_${activeMapel?.kodeMapel || 'Mapel'}.xlsx`);
    showToast('Template Excel CP/TP berhasil diunduh!', 'success');
  };

  // Import CP/TP File Processor (Works for drag & drop and file select)
  const processCpFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        // Expected row structure: CP_KODE | CP_DESKRIPSI | TP1 | TP2 | ... | TP10
        if (data.length <= 1) {
          showToast('File tidak berisi data yang cukup', 'error');
          return;
        }

        const parsedCPs: CPItem[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 2) continue;
          const kodeCp = row[0] || `CP-${i}`;
          const deskripsi = row[1] || `Deskripsi CP ${i}`;
          const tps: TPItem[] = [];

          for (let j = 2; j < Math.min(row.length, 12); j++) {
            if (row[j]) {
              tps.push({
                id: `tp-imp-${i}-${j}`,
                kodeTp: `TP ${j - 1}`,
                deskripsi: String(row[j]),
              });
            }
          }

          parsedCPs.push({
            id: `cp-imp-${i}`,
            kodeCp: String(kodeCp),
            deskripsi: String(deskripsi),
            tujuanPembelajaran: tps,
          });
        }

        setImportedPreviewData(parsedCPs);
        showToast(`Berhasil membaca ${parsedCPs.length} Capaian Pembelajaran!`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Gagal membaca file Excel/CSV CP & TP', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportCpFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCpFile(file);
  };

  const handleConfirmImportCp = () => {
    if (!importedPreviewData.length || !activeMapel) return;
    const updated = activeCpList.concat(importedPreviewData);
    setActiveCpList(updated);
    setImportedPreviewData([]);
    setIsImportCpModalOpen(false);
    showToast('CP & TP dari file berhasil dimasukkan!', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Mata Pelajaran</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola daftar mata pelajaran, Capaian Pembelajaran (CP), dan Tujuan Pembelajaran (TP)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddMapel}
          className="flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mapel Baru</span>
        </button>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Daftar Mapel Cards) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              DAFTAR MAPEL ({mapelList.length})
            </h3>
          </div>

          <div className="space-y-3">
            {mapelList.map((m) => {
              const isActive = activeMapel?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMapelId(m.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20 translate-x-1'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {m.namaMapel}
                      </h4>
                      <p className={`text-xs font-mono mt-0.5 ${isActive ? 'text-violet-100' : 'text-violet-600 dark:text-violet-400'}`}>
                        {m.kodeMapel}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      KKM: {m.kkm}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={isActive ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}>
                      {m.fase} • {m.tingkatKelas}
                    </span>
                    <span className={isActive ? 'text-violet-100 font-semibold' : 'text-slate-600 dark:text-slate-300 font-semibold'}>
                      {m.bebanJam} JP / Minggu
                    </span>
                  </div>
                </div>
              );
            })}

            {mapelList.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Belum ada mata pelajaran. Klik tombol Tambah Mapel.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Detail Mapel & CP/TP) */}
        <div className="lg:col-span-7">
          {activeMapel ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                    {activeMapel.kodeMapel}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {activeMapel.namaMapel}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeMapel.fase} | {activeMapel.tingkatKelas} | Beban: {activeMapel.bebanJam} JP | KKM: {activeMapel.kkm}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOpenEditMapel}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Mapel"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMapel(activeMapel.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Hapus Mapel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CP & TP Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-violet-600" />
                    <span>Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Total {activeMapel.capaianPembelajaran?.length || 0} CP terdaftar
                  </p>
                </div>

                <button
                  onClick={handleOpenCpTpModal}
                  className="flex items-center space-x-2 px-3.5 py-2 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 text-xs font-semibold rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors border border-violet-200 dark:border-violet-800"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Input / Kelola CP & TP</span>
                </button>
              </div>

              {/* CP & TP Cards list */}
              <div className="space-y-4">
                {activeMapel.capaianPembelajaran && activeMapel.capaianPembelajaran.length > 0 ? (
                  activeMapel.capaianPembelajaran.map((cp, idx) => (
                    <div
                      key={cp.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-600 text-white uppercase">
                            {cp.kodeCp}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                            {cp.deskripsi}
                          </p>
                        </div>
                      </div>

                      {/* TP List */}
                      <div className="pl-3 border-l-2 border-violet-400 dark:border-violet-600 space-y-2 mt-2">
                        {cp.tujuanPembelajaran.map((tp) => (
                          <div key={tp.id} className="text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2">
                            <span className="font-bold text-violet-600 dark:text-violet-400 shrink-0">
                              {tp.kodeTp}:
                            </span>
                            <span>{tp.deskripsi}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Belum ada Capaian Pembelajaran & Tujuan Pembelajaran untuk mata pelajaran ini.
                    </p>
                    <button
                      onClick={handleOpenCpTpModal}
                      className="px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors"
                    >
                      + Tambah CP & TP
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400">
              Pilih mata pelajaran di kolom kiri untuk melihat detail.
            </div>
          )}
        </div>
      </div>

      {/* Modal Edit/Tambah Mapel */}
      {isMapelModalOpen && editingMapel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingMapel.id.includes('mapel-') && !mapelList.some((m) => m.id === editingMapel.id)
                  ? 'Tambah Mata Pelajaran'
                  : 'Edit Mata Pelajaran'}
              </h3>
              <button onClick={() => setIsMapelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMapel} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kode Mapel
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BING-X"
                  value={editingMapel.kodeMapel}
                  onChange={(e) => setEditingMapel({ ...editingMapel, kodeMapel: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bahasa Inggris Kelas X"
                  value={editingMapel.namaMapel}
                  onChange={(e) => setEditingMapel({ ...editingMapel, namaMapel: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tingkat / Kelas
                  </label>
                  <select
                    value={editingMapel.tingkatKelas}
                    onChange={(e) => setEditingMapel({ ...editingMapel, tingkatKelas: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Kelas 10">Kelas 10</option>
                    <option value="Kelas 11">Kelas 11</option>
                    <option value="Kelas 12">Kelas 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Fase Kurikulum
                  </label>
                  <select
                    value={editingMapel.fase}
                    onChange={(e) => setEditingMapel({ ...editingMapel, fase: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Fase E">Fase E (Kelas X)</option>
                    <option value="Fase F">Fase F (Kelas XI - XII)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Beban Jam (JP / Minggu)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editingMapel.bebanJam}
                    onChange={(e) => setEditingMapel({ ...editingMapel, bebanJam: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    KKM
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={editingMapel.kkm}
                    onChange={(e) => setEditingMapel({ ...editingMapel, kkm: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsMapelModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola CP & TP */}
      {isCpTpModalOpen && activeMapel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kelola CP & TP — {activeMapel.namaMapel}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Satu CP dapat memiliki hingga 10 Tujuan Pembelajaran (TP)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadCpTemplate}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold rounded-full hover:bg-emerald-100 transition-colors"
                  title="Unduh contoh format file Excel CP & TP"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>

                <button
                  onClick={() => setIsImportCpModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full hover:bg-slate-200 transition-colors"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Import Excel/CSV</span>
                </button>

                <button onClick={() => setIsCpTpModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {activeCpList.map((cp, cpIdx) => (
                <div key={cp.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
                      <input
                        type="text"
                        value={cp.kodeCp}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveCpList(activeCpList.map((c) => (c.id === cp.id ? { ...c, kodeCp: val } : c)));
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="Kode CP (CP-1)"
                      />
                      <input
                        type="text"
                        value={cp.deskripsi}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveCpList(activeCpList.map((c) => (c.id === cp.id ? { ...c, deskripsi: val } : c)));
                        }}
                        className="sm:col-span-3 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        placeholder="Deskripsi Capaian Pembelajaran"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCP(cp.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg shrink-0"
                      title="Hapus CP"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* TP Section */}
                  <div className="pl-4 border-l-2 border-violet-500 space-y-2 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                        Tujuan Pembelajaran ({cp.tujuanPembelajaran.length}/10):
                      </span>
                      {cp.tujuanPembelajaran.length < 10 && (
                        <button
                          type="button"
                          onClick={() => handleAddTP(cp.id)}
                          className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah TP</span>
                        </button>
                      )}
                    </div>

                    {cp.tujuanPembelajaran.map((tp) => (
                      <div key={tp.id} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tp.kodeTp}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActiveCpList(
                              activeCpList.map((c) => {
                                if (c.id === cp.id) {
                                  return {
                                    ...c,
                                    tujuanPembelajaran: c.tujuanPembelajaran.map((t) =>
                                      t.id === tp.id ? { ...t, kodeTp: val } : t
                                    ),
                                  };
                                }
                                return c;
                              })
                            );
                          }}
                          className="w-20 px-2 py-1 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center shrink-0"
                        />
                        <input
                          type="text"
                          value={tp.deskripsi}
                          onChange={(e) => {
                            const val = e.target.value;
                            setActiveCpList(
                              activeCpList.map((c) => {
                                if (c.id === cp.id) {
                                  return {
                                    ...c,
                                    tujuanPembelajaran: c.tujuanPembelajaran.map((t) =>
                                      t.id === tp.id ? { ...t, deskripsi: val } : t
                                    ),
                                  };
                                }
                                return c;
                              })
                            );
                          }}
                          className="flex-1 px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          placeholder="Deskripsi Tujuan Pembelajaran"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteTP(cp.id, tp.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          title="Hapus TP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCP}
                className="w-full py-2.5 border-2 border-dashed border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400 font-semibold text-xs rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors"
              >
                + Tambah Capaian Pembelajaran (CP) Baru
              </button>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3 shrink-0 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setIsCpTpModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCpTp}
                className="px-6 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 shadow-md shadow-violet-500/20"
              >
                Simpan Semua CP & TP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CP/TP Excel Modal */}
      {isImportCpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Import CP & TP Massal</h3>
              <button onClick={() => setIsImportCpModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-950/40 p-3.5 rounded-xl border border-violet-200 dark:border-violet-800">
              <div>
                <p className="text-xs font-bold text-violet-900 dark:text-violet-200">Belum punya format file?</p>
                <p className="text-[11px] text-violet-700 dark:text-violet-300">Unduh template Excel CP/TP untuk pengisian data cepat</p>
              </div>
              <button
                onClick={handleDownloadCpTemplate}
                className="px-3.5 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-full flex items-center space-x-1.5 hover:bg-violet-700 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih atau lepaskan file Excel (.xlsx, .xls) atau CSV dengan format kolom: <br />
              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px] text-violet-600">
                Kode CP | Deskripsi CP | TP 1 | TP 2 | ... | TP 10
              </code>
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingCp(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingCp(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingCp(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processCpFile(file);
              }}
              className={`p-6 border-2 border-dashed rounded-xl text-center transition-all ${
                isDraggingCp
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 transition-transform ${isDraggingCp ? 'text-violet-700 scale-125 animate-bounce' : 'text-violet-600'}`} />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                {isDraggingCp ? 'Lepaskan file Excel / CSV di sini' : 'Tarik & Lepas File Excel / CSV di sini'}
              </p>
              <p className="text-[11px] text-slate-400 mb-3">Atau klik tombol di bawah untuk memilih file dari komputer</p>
              <label className="inline-block px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full cursor-pointer hover:bg-violet-700 shadow-sm">
                <span>Pilih File Excel / CSV</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportCpFile} className="hidden" />
              </label>
            </div>

            {importedPreviewData.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-emerald-600">
                  Preview: Ditemukan {importedPreviewData.length} CP
                </p>
                <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs space-y-1 bg-slate-50 dark:bg-slate-800/40">
                  {importedPreviewData.map((c, i) => (
                    <div key={i} className="truncate">
                      <strong>{c.kodeCp}:</strong> {c.deskripsi} ({c.tujuanPembelajaran.length} TP)
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setIsImportCpModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmImportCp}
                disabled={importedPreviewData.length === 0}
                className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full disabled:opacity-50"
              >
                Konfirmasi & Masukkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
