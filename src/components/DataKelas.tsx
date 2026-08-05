import React, { useState, useMemo } from 'react';
import { Kelas, Siswa } from '../types';
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  X,
  UserPlus,
  UserMinus,
} from 'lucide-react';

interface DataKelasProps {
  kelasList: Kelas[];
  siswaList: Siswa[];
  onSaveKelasList: (list: Kelas[]) => void;
  onSaveSiswaList: (list: Siswa[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DataKelasView: React.FC<DataKelasProps> = ({
  kelasList,
  siswaList,
  onSaveKelasList,
  onSaveSiswaList,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isKelasModalOpen, setIsKelasModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);

  // Student list roster modal state
  const [selectedRosterKelas, setSelectedRosterKelas] = useState<Kelas | null>(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [addSiswaSelectId, setAddSiswaSelectId] = useState('');

  const [deletingKelas, setDeletingKelas] = useState<Kelas | null>(null);

  // Sorted and searched classes alphabetically
  const filteredAndSortedKelas = useMemo(() => {
    return kelasList
      .filter(
        (k) =>
          k.namaKelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
          k.waliKelas.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.namaKelas.localeCompare(b.namaKelas));
  }, [kelasList, searchTerm]);

  // CRUD Kelas
  const handleOpenAddKelas = () => {
    setEditingKelas({
      id: `kelas-${Date.now()}`,
      namaKelas: '',
      waliKelas: '',
      ruangan: '',
    });
    setIsKelasModalOpen(true);
  };

  const handleOpenEditKelas = (k: Kelas, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKelas({ ...k });
    setIsKelasModalOpen(true);
  };

  const handleDeleteKelas = (k: Kelas, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingKelas(k);
  };

  const handleSaveKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKelas) return;

    const existsIdx = kelasList.findIndex((k) => k.id === editingKelas.id);
    let newList: Kelas[];
    if (existsIdx >= 0) {
      newList = [...kelasList];
      newList[existsIdx] = editingKelas;
    } else {
      newList = [...kelasList, editingKelas];
    }

    onSaveKelasList(newList);
    setIsKelasModalOpen(false);
    showToast('Data kelas berhasil disimpan!', 'success');
  };

  // Student Roster Modal
  const handleOpenRoster = (k: Kelas) => {
    setSelectedRosterKelas(k);
    setIsRosterModalOpen(true);
  };

  const currentClassStudents = useMemo(() => {
    if (!selectedRosterKelas) return [];
    return siswaList.filter((s) => s.namaKelas === selectedRosterKelas.namaKelas);
  }, [siswaList, selectedRosterKelas]);

  const unassignedOrOtherStudents = useMemo(() => {
    if (!selectedRosterKelas) return [];
    return siswaList.filter((s) => s.namaKelas !== selectedRosterKelas.namaKelas);
  }, [siswaList, selectedRosterKelas]);

  const handleAddStudentToClass = () => {
    if (!addSiswaSelectId || !selectedRosterKelas) return;
    const updatedSiswa = siswaList.map((s) => {
      if (s.id === addSiswaSelectId) {
        return { ...s, namaKelas: selectedRosterKelas.namaKelas };
      }
      return s;
    });
    onSaveSiswaList(updatedSiswa);
    setAddSiswaSelectId('');
    showToast('Siswa berhasil dimasukkan ke kelas!', 'success');
  };

  const handleRemoveStudentFromClass = (siswaId: string) => {
    const updatedSiswa = siswaList.map((s) => {
      if (s.id === siswaId) {
        return { ...s, namaKelas: 'Tanpa Kelas' };
      }
      return s;
    });
    onSaveSiswaList(updatedSiswa);
    showToast('Siswa dikeluarkan dari kelas', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Kelas</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola rombongan belajar, wali kelas, dan daftar siswa per kelas
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddKelas}
          className="flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari kelas atau nama wali kelas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
        />
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedKelas.map((k) => {
          const studentCount = siswaList.filter((s) => s.namaKelas === k.namaKelas).length;
          return (
            <div
              key={k.id}
              onClick={() => handleOpenRoster(k)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 uppercase">
                    {k.ruangan || 'Ruangan Belajar'}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 group-hover:text-violet-600 transition-colors">
                    {k.namaKelas}
                  </h3>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleOpenEditKelas(k, e)}
                    className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Kelas"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteKelas(k, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Wali Kelas:</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {k.waliKelas || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-violet-500" />
                    <span>Jumlah Siswa:</span>
                  </span>
                  <span className="font-bold text-violet-600 dark:text-violet-400">
                    {studentCount} Siswa
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAndSortedKelas.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Tidak ada data kelas yang cocok dengan pencarian.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Class Modal */}
      {isKelasModalOpen && editingKelas && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {kelasList.some((k) => k.id === editingKelas.id) ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <button onClick={() => setIsKelasModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKelas} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X IPA 1"
                  value={editingKelas.namaKelas}
                  onChange={(e) => setEditingKelas({ ...editingKelas, namaKelas: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Wali Kelas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dra. Endang Sulastri"
                  value={editingKelas.waliKelas}
                  onChange={(e) => setEditingKelas({ ...editingKelas, waliKelas: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ruangan Belajar
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang 101"
                  value={editingKelas.ruangan}
                  onChange={(e) => setEditingKelas({ ...editingKelas, ruangan: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsKelasModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors shadow-md shadow-violet-500/20"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Student Roster Modal */}
      {isRosterModalOpen && selectedRosterKelas && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar Siswa Kelas {selectedRosterKelas.namaKelas}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wali Kelas: {selectedRosterKelas.waliKelas} | Total: {currentClassStudents.length} Siswa
                </p>
              </div>

              <button onClick={() => setIsRosterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add student dropdown input */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
              <select
                value={addSiswaSelectId}
                onChange={(e) => setAddSiswaSelectId(e.target.value)}
                className="flex-1 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Pilih Siswa Untuk Ditambahkan Ke Kelas Ini --</option>
                {unassignedOrOtherStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaLengkap} ({s.nisn}) - Saat ini: {s.namaKelas || 'Tanpa Kelas'}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddStudentToClass}
                disabled={!addSiswaSelectId}

                className="w-full sm:w-auto px-4 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambahkan</span>
              </button>
            </div>

            {/* Roster Table */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {currentClassStudents.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">No</th>
                      <th className="p-2.5">NISN / NIS</th>
                      <th className="p-2.5">Nama Siswa</th>
                      <th className="p-2.5">JK</th>
                      <th className="p-2.5 text-right rounded-r-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentClassStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-mono text-violet-600 dark:text-violet-400">{s.nisn}</td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{s.namaLengkap}</td>
                        <td className="p-2.5">{s.jenisKelamin}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleRemoveStudentFromClass(s.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded flex items-center space-x-1 ml-auto text-[11px]"
                            title="Keluarkan dari kelas"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Keluarkan</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  Belum ada siswa di kelas ini. Gunakan dropdown di atas untuk memasukkan siswa.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setIsRosterModalOpen(false)}
                className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Kelas Confirmation */}
      {deletingKelas && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Data Kelas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deletingKelas.namaKelas} — Ruangan {deletingKelas.ruangan || '-'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus kelas <strong className="text-slate-900 dark:text-white">{deletingKelas.namaKelas}</strong>? Data yang telah dihapus tidak dapat dikembalikan.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDeletingKelas(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const updated = kelasList.filter((k) => k.id !== deletingKelas.id);
                  onSaveKelasList(updated);
                  setDeletingKelas(null);
                  showToast('Kelas berhasil dihapus', 'success');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all"
              >
                Ya, Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
