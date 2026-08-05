import React, { useState, useMemo } from 'react';
import { Siswa, Kelas, PresensiRecord, NilaiRecord } from '../types';
import { formatWhatsAppUrl } from '../lib/storage';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  FileSpreadsheet,
  MessageCircle,
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  User,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import * as XLSX from 'xlsx';

interface DataSiswaProps {
  siswaList: Siswa[];
  kelasList: Kelas[];
  presensiList: PresensiRecord[];
  nilaiList: NilaiRecord[];
  onSaveSiswaList: (list: Siswa[]) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DataSiswaView: React.FC<DataSiswaProps> = ({
  siswaList,
  kelasList,
  presensiList,
  nilaiList,
  onSaveSiswaList,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('Semua');

  // Student Form Modal state
  const [isSiswaModalOpen, setIsSiswaModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [deletingSiswa, setDeletingSiswa] = useState<Siswa | null>(null);

  // Student Detail Modal state
  const [selectedDetailSiswa, setSelectedDetailSiswa] = useState<Siswa | null>(null);

  // Mass Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedPreviewSiswa, setImportedPreviewSiswa] = useState<Siswa[]>([]);
  const [isDraggingSiswa, setIsDraggingSiswa] = useState(false);

  // Filtered student list
  const filteredSiswaList = useMemo(() => {
    return siswaList.filter((s) => {
      const matchSearch =
        s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.includes(searchTerm) ||
        s.nis.includes(searchTerm);

      const matchKelas =
        selectedKelasFilter === 'Semua' ? true : s.namaKelas === selectedKelasFilter;

      return matchSearch && matchKelas;
    });
  }, [siswaList, searchTerm, selectedKelasFilter]);

  // CRUD Siswa
  const handleOpenAddSiswa = () => {
    setEditingSiswa({
      id: `siswa-${Date.now()}`,
      nisn: '',
      nis: '',
      namaLengkap: '',
      jenisKelamin: 'L',
      namaKelas: kelasList[0]?.namaKelas || 'X IPA 1',
      tempatLahir: '',
      tanggalLahir: '2008-01-01',
      alamat: '',
      namaOrangTua: '',
      kontakOrangTua: '',
    });
    setIsSiswaModalOpen(true);
  };

  const handleOpenEditSiswa = (s: Siswa, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSiswa({ ...s });
    setIsSiswaModalOpen(true);
  };

  const handleDeleteSiswa = (s: Siswa, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSiswa(s);
  };

  const handleSaveSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;

    // Validation
    if (!editingSiswa.nisn || !editingSiswa.namaLengkap) {
      showToast('NISN dan Nama Lengkap wajib diisi!', 'error');
      return;
    }

    const existsIdx = siswaList.findIndex((s) => s.id === editingSiswa.id);
    let newList: Siswa[];
    if (existsIdx >= 0) {
      newList = [...siswaList];
      newList[existsIdx] = editingSiswa;
    } else {
      newList = [...siswaList, editingSiswa];
    }

    onSaveSiswaList(newList);
    setIsSiswaModalOpen(false);
    showToast('Data siswa berhasil disimpan!', 'success');
  };

  // Student Attendance Statistics
  const studentAttendanceStats = useMemo(() => {
    if (!selectedDetailSiswa) return null;

    let hadir = 0,
      terlambat = 0,
      sakit = 0,
      izin = 0,
      alpha = 0;
    const history: { tanggal: string; mapel: string; kelas: string; status: string; catatan?: string }[] = [];

    presensiList.forEach((p) => {
      const foundItem = p.items.find((it) => it.siswaId === selectedDetailSiswa.id || it.nisn === selectedDetailSiswa.nisn);
      if (foundItem) {
        if (foundItem.status === 'Hadir') hadir++;
        else if (foundItem.status === 'Terlambat') terlambat++;
        else if (foundItem.status === 'Sakit') sakit++;
        else if (foundItem.status === 'Izin') izin++;
        else if (foundItem.status === 'Alpha') alpha++;

        history.push({
          tanggal: p.tanggal,
          mapel: p.namaMapel,
          kelas: p.kelas,
          status: foundItem.status,
          catatan: foundItem.catatan,
        });
      }
    });

    const total = hadir + terlambat + sakit + izin + alpha;
    const percentage = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 100;

    const pieData = [
      { name: 'Hadir', value: hadir, color: '#10b981' },
      { name: 'Terlambat', value: terlambat, color: '#f59e0b' },
      { name: 'Sakit', value: sakit, color: '#3b82f6' },
      { name: 'Izin', value: izin, color: '#8b5cf6' },
      { name: 'Alpha', value: alpha, color: '#ef4444' },
    ].filter((d) => d.value > 0);

    return { hadir, terlambat, sakit, izin, alpha, total, percentage, pieData, history };
  }, [selectedDetailSiswa, presensiList]);

  // Student Grade Statistics
  const studentGradesStats = useMemo(() => {
    if (!selectedDetailSiswa) return null;

    const scoresList: number[] = [];
    const allStudentGrades: { mapel: string; jenis: string; nilai: number; kkm: number; status: string }[] = [];

    nilaiList.forEach((nr) => {
      const item = nr.items.find((it) => it.siswaId === selectedDetailSiswa.id || it.nisn === selectedDetailSiswa.nisn);
      if (item) {
        Object.entries(item.tpScores || {}).forEach(([tp, sc]) => {
          const scoreVal = Number(sc);
          scoresList.push(scoreVal);
          allStudentGrades.push({
            mapel: nr.namaMapel,
            jenis: tp,
            nilai: scoreVal,
            kkm: nr.kkm,
            status: scoreVal >= nr.kkm ? 'Tuntas' : 'Belum Tuntas',
          });
        });

        if (item.utsScore !== undefined) {
          scoresList.push(item.utsScore);
          allStudentGrades.push({
            mapel: nr.namaMapel,
            jenis: 'UTS',
            nilai: item.utsScore,
            kkm: nr.kkm,
            status: item.utsScore >= nr.kkm ? 'Tuntas' : 'Belum Tuntas',
          });
        }
        if (item.uasScore !== undefined) {
          scoresList.push(item.uasScore);
          allStudentGrades.push({
            mapel: nr.namaMapel,
            jenis: 'UAS',
            nilai: item.uasScore,
            kkm: nr.kkm,
            status: item.uasScore >= nr.kkm ? 'Tuntas' : 'Belum Tuntas',
          });
        }
      }
    });

    const avg = scoresList.length > 0 ? (scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(1) : '-';
    const highest = scoresList.length > 0 ? Math.max(...scoresList) : '-';
    const lowest = scoresList.length > 0 ? Math.min(...scoresList) : '-';

    return { avg, highest, lowest, list: allStudentGrades };
  }, [selectedDetailSiswa, nilaiList]);

  // Mass Import Template Generator
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        NISN: '0071234599',
        NIS: '23241099',
        NamaLengkap: 'Siswa Contoh Baru',
        JenisKelamin: 'L',
        NamaKelas: 'X IPA 1',
        TempatLahir: 'Bandung',
        TanggalLahir: '2008-05-10',
        Alamat: 'Jl. Pemuda No. 12',
        NamaOrangTua: 'H. Suherman',
        KontakOrangTua: '081234567890',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
    showToast('Template Excel berhasil diunduh!', 'success');
  };

  // Handle Mass Import Upload (File Select or Drag & Drop)
  const processSiswaFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json<any>(ws);

        const parsed: Siswa[] = rawJson.map((row: any, i: number) => ({
          id: `siswa-imp-${Date.now()}-${i}`,
          nisn: String(row.NISN || row.nisn || ''),
          nis: String(row.NIS || row.nis || ''),
          namaLengkap: String(row.NamaLengkap || row['Nama Lengkap'] || row.nama || ''),
          jenisKelamin: String(row.JenisKelamin || row['Jenis Kelamin'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
          namaKelas: String(row.NamaKelas || row['Nama Kelas'] || row.kelas || 'X IPA 1'),
          tempatLahir: String(row.TempatLahir || row['Tempat Lahir'] || ''),
          tanggalLahir: String(row.TanggalLahir || row['Tanggal Lahir'] || '2008-01-01'),
          alamat: String(row.Alamat || ''),
          namaOrangTua: String(row.NamaOrangTua || row['Nama Orang Tua'] || ''),
          kontakOrangTua: String(row.KontakOrangTua || row['Kontak Orang Tua'] || ''),
        }));

        setImportedPreviewSiswa(parsed);
        showToast(`Berhasil membaca ${parsed.length} data siswa dari file`, 'success');
      } catch (err) {
        console.error(err);
        showToast('Gagal membaca file Excel/CSV siswa', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSiswaFile(file);
  };

  const handleConfirmMassImport = () => {
    if (importedPreviewSiswa.length === 0) return;
    const combined = [...siswaList, ...importedPreviewSiswa];
    onSaveSiswaList(combined);
    setImportedPreviewSiswa([]);
    setIsImportModalOpen(false);
    showToast(`Berhasil menambahkan ${importedPreviewSiswa.length} siswa baru!`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Siswa</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola data peserta didik, kontak orang tua, dan rekap partisipasi harian
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-full hover:bg-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-violet-600" />
            <span>Import Massal</span>
          </button>

          <button
            onClick={handleOpenAddSiswa}
            className="flex items-center space-x-1.5 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama Siswa, NISN, atau NIS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
          >
            <option value="Semua">Semua Kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.namaKelas}>
                {k.namaKelas}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">No</th>
                <th className="p-3.5">NISN / NIS</th>
                <th className="p-3.5">Nama Siswa</th>
                <th className="p-3.5">JK</th>
                <th className="p-3.5">Kelas</th>
                <th className="p-3.5">Orang Tua / Wali</th>
                <th className="p-3.5">Kontak WhatsApp</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSiswaList.map((s, idx) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedDetailSiswa(s)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3.5 font-mono">
                    <span className="font-semibold text-violet-600 dark:text-violet-400">{s.nisn}</span>
                    <span className="text-[10px] text-slate-400 block">{s.nis}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 dark:text-white hover:text-violet-600 transition-colors">
                      {s.namaLengkap}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.jenisKelamin === 'L'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                      }`}
                    >
                      {s.jenisKelamin}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{s.namaKelas}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{s.namaOrangTua || '-'}</td>
                  <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                    {s.kontakOrangTua ? (
                      <a
                        href={formatWhatsAppUrl(s.kontakOrangTua, `Halo Bapak/Ibu ${s.namaOrangTua || 'Orang Tua'}, mengabarkan mengenai siswa ${s.namaLengkap}...`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full hover:bg-emerald-100 font-semibold text-[11px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{s.kontakOrangTua}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={(e) => handleOpenEditSiswa(s, e)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Siswa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSiswa(s, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSiswaList.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              Tidak ada data siswa yang sesuai filter.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isSiswaModalOpen && editingSiswa && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {siswaList.some((s) => s.id === editingSiswa.id) ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setIsSiswaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    NISN (10 Digit)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={editingSiswa.nisn}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, nisn: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    NIS Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSiswa.nis}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, nis: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSiswa.namaLengkap}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, namaLengkap: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={editingSiswa.jenisKelamin}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, jenisKelamin: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Kelas
                  </label>
                  <select
                    value={editingSiswa.namaKelas}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, namaKelas: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.namaKelas}>
                        {k.namaKelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={editingSiswa.tempatLahir}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, tempatLahir: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={editingSiswa.tanggalLahir}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, tanggalLahir: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Alamat Domisili Siswa
                  </label>
                  <textarea
                    rows={2}
                    value={editingSiswa.alamat}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, alamat: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={editingSiswa.namaOrangTua}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, namaOrangTua: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Kontak Orang Tua (WhatsApp)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={editingSiswa.kontakOrangTua}
                    onChange={(e) => setEditingSiswa({ ...editingSiswa, kontakOrangTua: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSiswaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 shadow-md shadow-violet-500/20"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detail Modal (Biodata, Pie Chart, Attendance History, Grades Rekap, WA button) */}
      {selectedDetailSiswa && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-violet-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">{selectedDetailSiswa.namaLengkap}</h3>
                  <p className="text-xs text-violet-100">
                    NISN: {selectedDetailSiswa.nisn} | Kelas {selectedDetailSiswa.namaKelas}
                  </p>
                </div>
              </div>

              <button onClick={() => setSelectedDetailSiswa(null)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Section A: Biodata & WA Button */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="md:col-span-2 space-y-2 text-xs">
                  <h4 className="font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">
                    A. Biodata Lengkap
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <p><strong>Tempat, Tgl Lahir:</strong> {selectedDetailSiswa.tempatLahir}, {selectedDetailSiswa.tanggalLahir}</p>
                    <p><strong>Jenis Kelamin:</strong> {selectedDetailSiswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                    <p><strong>Nama Orang Tua:</strong> {selectedDetailSiswa.namaOrangTua || '-'}</p>
                    <p><strong>Kontak Orang Tua:</strong> {selectedDetailSiswa.kontakOrangTua || '-'}</p>
                    <p className="col-span-2"><strong>Alamat:</strong> {selectedDetailSiswa.alamat || '-'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-4 md:pt-0 md:pl-6 space-y-3">
                  <span className="text-xs font-semibold text-slate-500">Hubungi Orang Tua</span>
                  {selectedDetailSiswa.kontakOrangTua ? (
                    <a
                      href={formatWhatsAppUrl(
                        selectedDetailSiswa.kontakOrangTua,
                        `Halo Bapak/Ibu ${selectedDetailSiswa.namaOrangTua || 'Orang Tua'}, mengabarkan perkembangan akademis & presensi dari siswa ${selectedDetailSiswa.namaLengkap}...`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-full font-bold text-xs flex items-center justify-center space-x-2 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim WhatsApp</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Kontak WA belum diisi</span>
                  )}
                </div>
              </div>

              {/* Section B & C: Attendance Stats & Pie Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
                  <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">
                    B. Statistik Kehadiran ({studentAttendanceStats?.percentage}% Hadir)
                  </h4>
                  <div className="h-48 w-full">
                    {studentAttendanceStats && studentAttendanceStats.pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={studentAttendanceStats.pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            label
                          >
                            {studentAttendanceStats.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        Belum ada data presensi tercatat
                      </div>
                    )}
                  </div>

                  {/* Attendance status breakdown badges */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full font-bold text-xs flex items-center space-x-1">
                      <span>Hadir:</span>
                      <span>{studentAttendanceStats?.hadir || 0}</span>
                    </span>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded-full font-bold text-xs flex items-center space-x-1">
                      <span>Terlambat:</span>
                      <span>{studentAttendanceStats?.terlambat || 0}</span>
                    </span>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-full font-bold text-xs flex items-center space-x-1">
                      <span>Sakit:</span>
                      <span>{studentAttendanceStats?.sakit || 0}</span>
                    </span>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-full font-bold text-xs flex items-center space-x-1">
                      <span>Izin:</span>
                      <span>{studentAttendanceStats?.izin || 0}</span>
                    </span>
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-full font-bold text-xs flex items-center space-x-1">
                      <span>Alpha:</span>
                      <span>{studentAttendanceStats?.alpha || 0}</span>
                    </span>
                  </div>
                </div>

                {/* Section D: History List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                    D. Riwayat Presensi Terbaru
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 text-xs custom-scrollbar">
                    {studentAttendanceStats?.history && studentAttendanceStats.history.length > 0 ? (
                      studentAttendanceStats.history.map((h, i) => (
                        <div key={i} className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{h.mapel}</p>
                            <p className="text-[10px] text-slate-400">{h.tanggal} | {h.catatan || 'Tanpa Catatan'}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              h.status === 'Hadir'
                                ? 'bg-emerald-100 text-emerald-700'
                                : h.status === 'Terlambat'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {h.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Belum ada catatan riwayat</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section E: Rekap Nilai Siswa */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                    E. Rekapitulasi Nilai Siswa
                  </h4>
                  <div className="flex items-center space-x-3 text-xs font-bold">
                    <span>Rata-rata: <span className="text-violet-600">{studentGradesStats?.avg}</span></span>
                    <span>Tertinggi: <span className="text-emerald-600">{studentGradesStats?.highest}</span></span>
                    <span>Terendah: <span className="text-rose-600">{studentGradesStats?.lowest}</span></span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold">
                      <tr>
                        <th className="p-2">Mata Pelajaran</th>
                        <th className="p-2">Jenis Penilaian</th>
                        <th className="p-2">Nilai</th>
                        <th className="p-2">KKM</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {studentGradesStats?.list && studentGradesStats.list.length > 0 ? (
                        studentGradesStats.list.map((g, i) => (
                          <tr key={i}>
                            <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">{g.mapel}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-400">{g.jenis}</td>
                            <td className="p-2 font-bold text-violet-600">{g.nilai}</td>
                            <td className="p-2">{g.kkm}</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  g.status === 'Tuntas'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {g.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            Belum ada rekap nilai tercatat untuk siswa ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setSelectedDetailSiswa(null)}
                className="px-6 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Data Siswa Massal</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-950/40 p-4 rounded-xl border border-violet-200 dark:border-violet-800">
              <div>
                <p className="text-xs font-bold text-violet-900 dark:text-violet-200">Langkah 1: Unduh Format Template</p>
                <p className="text-[11px] text-violet-700 dark:text-violet-300">Gunakan file Excel yang telah disesuaikan strukturnya</p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="px-3.5 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-full flex items-center space-x-1 hover:bg-violet-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template</span>
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingSiswa(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingSiswa(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingSiswa(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processSiswaFile(file);
              }}
              className={`p-6 border-2 border-dashed rounded-xl text-center transition-all ${
                isDraggingSiswa
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 transition-transform ${isDraggingSiswa ? 'text-violet-700 scale-125 animate-bounce' : 'text-violet-600'}`} />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Langkah 2: {isDraggingSiswa ? 'Lepaskan File Excel / CSV di sini' : 'Tarik & Lepas File Excel / CSV di sini'}
              </p>
              <p className="text-[11px] text-slate-400 my-1">Atau klik tombol di bawah jika ingin memilih manual</p>
              <label className="inline-block mt-1 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full cursor-pointer hover:bg-violet-700 shadow-sm">
                <span>Pilih File</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFileChange} className="hidden" />
              </label>
            </div>

            {importedPreviewSiswa.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-emerald-600">
                  Preview: Ready to import {importedPreviewSiswa.length} siswa
                </p>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs space-y-1">
                  {importedPreviewSiswa.map((s, i) => (
                    <div key={i} className="truncate">
                      <strong>{s.nisn}</strong> - {s.namaLengkap} ({s.namaKelas})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmMassImport}
                disabled={importedPreviewSiswa.length === 0}
                className="px-5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full disabled:opacity-50"
              >
                Konfirmasi & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Siswa Confirmation */}
      {deletingSiswa && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Data Siswa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deletingSiswa.namaLengkap} — NISN: {deletingSiswa.nisn}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data siswa <strong className="text-slate-900 dark:text-white">{deletingSiswa.namaLengkap}</strong> (Kelas {deletingSiswa.namaKelas})? Data yang telah dihapus tidak dapat dikembalikan.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDeletingSiswa(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const updated = siswaList.filter((s) => s.id !== deletingSiswa.id);
                  onSaveSiswaList(updated);
                  setDeletingSiswa(null);
                  showToast('Data siswa berhasil dihapus', 'success');
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
