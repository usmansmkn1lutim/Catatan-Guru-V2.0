import React, { useState, useEffect } from 'react';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  listUserSpreadsheets,
  createSpreadsheet,
  exportToGoogleSheets,
  importFromGoogleSheets,
  SpreadsheetFile,
} from '../lib/googleSheets';
import {
  getStoredGasUrl,
  setStoredGasUrl,
  testGasConnection,
  saveAppDataToGasUrl,
  loadAppDataFromGasUrl,
} from '../lib/gasApi';
import { CODE_GS_CONTENT } from '../lib/gasCode';
import {
  DataSekolah,
  ProfilGuru,
  Mapel,
  Kelas,
  Siswa,
  PresensiRecord,
  NilaiRecord,
  JurnalRecord,
} from '../types';
import {
  FileSpreadsheet,
  Cloud,
  Download,
  Upload,
  Plus,
  RefreshCw,
  ExternalLink,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Link2,
  Code2,
  Copy,
  Zap,
  Check,
  Globe,
  Settings2,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleSheetsViewProps {
  dataSekolah: DataSekolah;
  profilGuru: ProfilGuru;
  mapelList: Mapel[];
  kelasList: Kelas[];
  siswaList: Siswa[];
  presensiList: PresensiRecord[];
  nilaiList: NilaiRecord[];
  jurnalList: JurnalRecord[];
  onImportData: (data: {
    dataSekolah?: DataSekolah | null;
    profilGuru?: ProfilGuru | null;
    mapelList?: Mapel[];
    kelasList?: Kelas[];
    siswaList?: Siswa[];
  }) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error' | 'disabled' | 'unconfigured';
  lastSyncedTime?: string | null;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  dataSekolah,
  profilGuru,
  mapelList,
  kelasList,
  siswaList,
  presensiList,
  nilaiList,
  jurnalList,
  onImportData,
  showToast,
  autoSyncEnabled = true,
  onToggleAutoSync,
  autoSyncStatus = 'idle',
  lastSyncedTime,
}) => {
  const [activeIntegrationMode, setActiveIntegrationMode] = useState<'gas' | 'oauth'>('gas');

  // GAS State
  const [gasUrl, setGasUrl] = useState<string>(() => getStoredGasUrl());
  const [isTestingGas, setIsTestingGas] = useState<boolean>(false);
  const [gasConnected, setGasConnected] = useState<boolean | null>(null);
  const [copiedGs, setCopiedGs] = useState<boolean>(false);
  const [isGasSyncing, setIsGasSyncing] = useState<boolean>(false);
  const [isGasLoading, setIsGasLoading] = useState<boolean>(false);
  const [showCodeGuide, setShowCodeGuide] = useState<boolean>(false);

  // Direct OAuth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [connectedSpreadsheetId, setConnectedSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('catatan_guru_active_sheet_id') || '';
  });
  const [connectedSpreadsheetUrl, setConnectedSpreadsheetUrl] = useState<string>(() => {
    return localStorage.getItem('catatan_guru_active_sheet_url') || '';
  });

  const [userSpreadsheets, setUserSpreadsheets] = useState<SpreadsheetFile[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState<boolean>(false);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const [customSheetInput, setCustomSheetInput] = useState<string>('');

  // Listen to Firebase Auth state for OAuth fallback
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        if (token) fetchSpreadsheets(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save GAS URL to storage when user updates it
  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    setStoredGasUrl(url);
    setGasConnected(null);
  };

  // Test GAS Web App Connection
  const handleTestGas = async () => {
    if (!gasUrl.trim()) {
      showToast('Masukkan URL Google Apps Script Web App terlebih dahulu.', 'error');
      return;
    }
    setIsTestingGas(true);
    setGasConnected(null);
    try {
      const ok = await testGasConnection(gasUrl);
      if (ok) {
        setGasConnected(true);
        showToast('Koneksi Google Apps Script Web App BERHASIL!', 'success');
      } else {
        setGasConnected(false);
        showToast('Gagal terhubung ke URL Google Apps Script.', 'error');
      }
    } catch (err: any) {
      setGasConnected(false);
      showToast(`Koneksi Gagal: ${err.message}`, 'error');
    } finally {
      setIsTestingGas(false);
    }
  };

  // Sync Data via GAS
  const handleGasSave = async () => {
    if (!gasUrl.trim()) {
      showToast('Masukkan URL Google Apps Script Web App terlebih dahulu.', 'error');
      return;
    }
    setIsGasSyncing(true);
    try {
      const result = await saveAppDataToGasUrl(gasUrl, {
        dataSekolah,
        profilGuru,
        mapelList,
        kelasList,
        siswaList,
        presensiList,
        nilaiList,
        jurnalList,
      });
      setGasConnected(true);
      showToast(result.message || 'Seluruh data otomatis tersimpan ke Sheet Google Apps Script!', 'success');
    } catch (err: any) {
      showToast(`Gagal menyimpan data via GAS: ${err.message}`, 'error');
    } finally {
      setIsGasSyncing(false);
    }
  };

  // Load / Import Data via GAS
  const handleGasLoad = async () => {
    if (!gasUrl.trim()) {
      showToast('Masukkan URL Google Apps Script Web App terlebih dahulu.', 'error');
      return;
    }

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengimpor data dari Google Sheets via GAS?\n\nData lokal di web ini akan diperbarui dengan data dari Google Spreadsheet.'
    );
    if (!confirmed) return;

    setIsGasLoading(true);
    try {
      const imported = await loadAppDataFromGasUrl(gasUrl);
      if (imported) {
        onImportData(imported);
        showToast('Data berhasil diperbarui dari Google Sheets!', 'success');
      } else {
        showToast('Data di Google Spreadsheet masih kosong.', 'error');
      }
    } catch (err: any) {
      showToast(`Gagal membaca data via GAS: ${err.message}`, 'error');
    } finally {
      setIsGasLoading(false);
    }
  };

  const handleCopyCodeGs = () => {
    navigator.clipboard.writeText(CODE_GS_CONTENT);
    setCopiedGs(true);
    showToast('Kode Code.gs berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedGs(false), 3000);
  };

  // Direct OAuth handlers
  const fetchSpreadsheets = async (token: string) => {
    setIsLoadingSpreadsheets(true);
    try {
      const files = await listUserSpreadsheets(token);
      setUserSpreadsheets(files);
    } catch (err: any) {
      console.error('Fetch spreadsheets failed:', err);
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  const executeWithGoogleAuth = async <T,>(
    action: (token: string) => Promise<T>
  ): Promise<T> => {
    const currentToken = accessToken || getAccessToken();
    if (!currentToken) {
      throw new Error(
        'Anda belum terhubung dengan Akun Google. Silakan klik tombol "Masuk dengan Google" terlebih dahulu.'
      );
    }
    try {
      return await action(currentToken);
    } catch (err: any) {
      const errStr = String(err?.message || err);
      if (
        errStr.includes('401') ||
        errStr.includes('UNAUTHENTICATED') ||
        errStr.includes('invalid authentication credentials')
      ) {
        localStorage.removeItem('catatan_guru_google_token');
        setAccessToken(null);
        throw new Error(
          'Sesi akses Google Anda telah berakhir. Silakan klik "Masuk dengan Google" untuk menghubungkan ulang akun Anda.'
        );
      }
      throw err;
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(`Berhasil masuk sebagai ${result.user.displayName || result.user.email}`, 'success');
        fetchSpreadsheets(result.accessToken);
      }
    } catch (err: any) {
      showToast(`Gagal masuk Google: ${err.message || 'Terjadi kesalahan'}`, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setAccessToken(null);
    showToast('Telah keluar dari Akun Google.', 'success');
  };

  const handleSelectSpreadsheet = (id: string, url?: string) => {
    setConnectedSpreadsheetId(id);
    const computedUrl = url || `https://docs.google.com/spreadsheets/d/${id}/edit`;
    setConnectedSpreadsheetUrl(computedUrl);
    localStorage.setItem('catatan_guru_active_sheet_id', id);
    localStorage.setItem('catatan_guru_active_sheet_url', computedUrl);
    showToast('Spreadsheet Google berhasil terhubung!', 'success');
  };

  const handleCreateNewSpreadsheet = async () => {
    setIsCreating(true);
    try {
      const title = `Catatan Guru - Database (${dataSekolah.namaSekolah || 'Sekolah'})`;
      const res = await executeWithGoogleAuth((token) => createSpreadsheet(token, title));
      handleSelectSpreadsheet(res.id, res.url);
      showToast(`Spreadsheet baru "${title}" berhasil dibuat di Google Drive!`, 'success');
      const freshToken = getAccessToken();
      if (freshToken) fetchSpreadsheets(freshToken);
    } catch (err: any) {
      showToast(`Gagal membuat Spreadsheet: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCustomLinkAdd = () => {
    if (!customSheetInput.trim()) return;
    let sheetId = customSheetInput.trim();
    const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }
    handleSelectSpreadsheet(sheetId);
    setCustomSheetInput('');
  };

  const handleSyncToSheets = async () => {
    if (!connectedSpreadsheetId) {
      showToast('Pilih atau hubungkan Spreadsheet Google terlebih dahulu.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      await executeWithGoogleAuth((token) =>
        exportToGoogleSheets(connectedSpreadsheetId, token, {
          dataSekolah,
          profilGuru,
          mapelList,
          kelasList,
          siswaList,
          presensiList,
          nilaiList,
          jurnalList,
        })
      );
      showToast('Seluruh data aplikasi sukses tersimpan di Google Sheets!', 'success');
    } catch (err: any) {
      showToast(`Gagal menyinkronkan data: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromSheets = async () => {
    if (!connectedSpreadsheetId) {
      showToast('Pilih atau hubungkan Spreadsheet Google terlebih dahulu.', 'error');
      return;
    }
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengimpor data dari Google Sheets?\n\nData lokal saat ini akan diperbarui dengan data yang ada di Spreadsheet terpilih.'
    );
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const imported = await executeWithGoogleAuth((token) =>
        importFromGoogleSheets(connectedSpreadsheetId, token)
      );
      onImportData(imported);
      showToast('Data berhasil diperbarui dari Google Sheets!', 'success');
    } catch (err: any) {
      showToast(`Gagal mengimpor data: ${err.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Sinkronisasi Google Spreadsheet</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Simpan dan backup data sekolah, profil guru, siswa, presensi, nilai, serta jurnal mengajar secara otomatis.
            </p>
          </div>
        </div>

        {/* Integration Mode Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setActiveIntegrationMode('gas')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeIntegrationMode === 'gas'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Google Apps Script (GAS)</span>
            <span className="ml-1 text-[9px] bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded-full font-extrabold uppercase">
              Rekomendasi
            </span>
          </button>

          <button
            onClick={() => setActiveIntegrationMode('oauth')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeIntegrationMode === 'oauth'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>OAuth REST API</span>
          </button>
        </div>
      </div>

      {/* Auto-Sync Banner & Toggle Card */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sinkronisasi Otomatis Ke Google Sheets (Real-Time)
              </h3>
              {autoSyncStatus === 'synced' && (
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  AKTIF
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Setiap kali Anda mengubah data siswa, nilai, presensi, atau jurnal mengajar, data akan otomatis terkirim dan tersimpan ke Google Spreadsheet secara langsung (tanpa perlu tombol simpan manual).
            </p>
            {lastSyncedTime && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pt-0.5">
                Terakhir disinkronkan otomatis: <strong>{lastSyncedTime}</strong>
              </p>
            )}
          </div>
        </div>

        {onToggleAutoSync && (
          <button
            onClick={onToggleAutoSync}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shrink-0 ${
              autoSyncEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>{autoSyncEnabled ? 'Auto-Sync: AKTIF' : 'Auto-Sync: NONAKTIF'}</span>
          </button>
        )}
      </div>

      {/* MODE 1: GOOGLE APPS SCRIPT (GAS) - STABLE & NO POPUPS */}
      {activeIntegrationMode === 'gas' && (
        <div className="space-y-6">
          {/* Main GAS Web App Configuration Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Metode Google Apps Script (GAS Web App)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  100% stabil, langsung tersimpan ke Google Drive Anda tanpa kendala login popup / token expired peramban.
                </p>
              </div>

              <button
                onClick={() => setShowCodeGuide(!showCodeGuide)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors self-start"
              >
                <Code2 className="w-4 h-4 text-violet-600" />
                <span>{showCodeGuide ? 'Sembunyikan Panduan & Kode' : 'Lihat Panduan & Kode Script'}</span>
              </button>
            </div>

            {/* Input URL Web App GAS */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>URL Web App Google Apps Script</span>
                {gasConnected === true && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terhubung & Siap Sinkron</span>
                  </span>
                )}
                {gasConnected === false && (
                  <span className="text-rose-600 dark:text-rose-400 font-extrabold text-[11px] flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>URL Tidak Dapat Dihubungi</span>
                  </span>
                )}
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Contoh: https://script.google.com/macros/s/AKfycbx.../exec"
                  value={gasUrl}
                  onChange={(e) => handleSaveGasUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleTestGas}
                  disabled={isTestingGas || !gasUrl.trim()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-all shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
                  <span>{isTestingGas ? 'Menguji...' : 'Tes Koneksi'}</span>
                </button>
              </div>
            </div>

            {/* Quick Action Buttons for GAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleGasSave}
                disabled={isGasSyncing || !gasUrl.trim()}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>{isGasSyncing ? 'Mengirim & Membuat Sheet...' : 'Kirim Data ke Google Spreadsheet (GAS)'}</span>
              </button>

              <button
                onClick={handleGasLoad}
                disabled={isGasLoading || !gasUrl.trim()}
                className="py-3 px-4 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{isGasLoading ? 'Membaca Spreadsheet...' : 'Tarik Data dari Google Spreadsheet (GAS)'}</span>
              </button>
            </div>
          </div>

          {/* Expandable Guide & Code Box */}
          {showCodeGuide && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-violet-500/20 text-violet-400 rounded-xl">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Langkah Mudah Memasang Google Apps Script (GAS)</h4>
                    <p className="text-xs text-slate-400">Hanya perlu waktu 1 menit untuk menghubungkan Spreadsheet Anda</p>
                  </div>
                </div>

                <button
                  onClick={handleCopyCodeGs}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  {copiedGs ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedGs ? 'Kode Berhasil Disalin!' : 'Salin Kode Apps Script'}</span>
                </button>
              </div>

              {/* Numbered Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded font-bold text-[10px]">Langkah 1</span>
                  <p className="font-semibold text-slate-200">Buka Google Spreadsheet di Drive</p>
                  <p className="text-[11px] text-slate-400">Buat atau buka file Google Spreadsheet kosong di Google Drive Anda.</p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded font-bold text-[10px]">Langkah 2</span>
                  <p className="font-semibold text-slate-200">Buka Extensions &gt; Apps Script</p>
                  <p className="text-[11px] text-slate-400">Di menu atas spreadsheet, klik <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded font-bold text-[10px]">Langkah 3</span>
                  <p className="font-semibold text-slate-200">Hanya file Code.gs (Tanpa Index.html)</p>
                  <p className="text-[11px] text-slate-400">Hapus isi bawaan di <strong className="text-emerald-300">Code.gs</strong>, lalu <strong>Paste / Tempelkan Kode</strong> di bawah ini. <span className="text-amber-300 font-bold">TIDAK PERLU membuat file Index.html!</span></p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold text-[10px]">Langkah 4 (PENTING untuk Cegah Failed to Fetch)</span>
                  <p className="font-semibold text-slate-200">Deploy &amp; Set "Who Has Access" ke Anyone</p>
                  <p className="text-[11px] text-slate-400">
                    Klik <strong>Deploy &gt; New Deployment</strong> &gt; Pilih jenis <strong>Web app</strong>:<br />
                    • <em>Execute as:</em> <strong>Me (Saya)</strong><br />
                    • <em>Who has access:</em> <strong className="text-emerald-300 underline">Anyone (Siapa saja)</strong><br />
                    • Klik <strong>Deploy</strong> &gt; <strong>Authorize Access</strong> &gt; pilih email Anda &gt; <em>Advanced</em> &gt; <em>Go to project (unsafe)</em> &gt; <strong>Allow</strong>.
                  </p>
                </div>
              </div>

              {/* Troubleshooting Banner */}
              <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs space-y-1.5 text-amber-200">
                <p className="font-bold flex items-center space-x-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Mengapa Muncul "Failed to Fetch" atau Koneksi Gagal?</span>
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                  <li><strong>Belum set "Anyone":</strong> Jika <em>Who has access</em> diisi "Only myself", Google akan memblokir koneksi dari web app ini dengan error <em>Failed to fetch</em>.</li>
                  <li><strong>Belum Authorize Access:</strong> Saat Deploy pertama kali, wajib menyetujui izin Google Apps Script.</li>
                  <li><strong>Salah Salin URL:</strong> Pastikan menyalin URL Web App hasil Deploy yang berakhiran <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300">/exec</code> (bukan link Spreadsheet atau URL editor /edit).</li>
                </ul>
              </div>

              {/* Code preview box */}
              <div className="relative">
                <pre className="p-4 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 max-h-52 overflow-y-auto custom-scrollbar border border-slate-800">
                  {CODE_GS_CONTENT}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: DIRECT GOOGLE OAUTH REST API */}
      {activeIntegrationMode === 'oauth' && (
        <div className="space-y-6">
          {user ? (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full object-cover border border-emerald-500" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase() || 'G'}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{user.displayName || 'Pengguna Google'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-rose-600 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Masuk dengan Akun Google</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Hubungkan akun Google Drive Anda untuk mengakses file Spreadsheet secara langsung</p>
              </div>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm shrink-0"
              >
                <span>{isLoggingIn ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
              </button>
            </div>
          )}

          {/* Connection Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Spreadsheet Google Terhubung
                </h3>
              </div>
              <button
                onClick={handleCreateNewSpreadsheet}
                disabled={isCreating}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? 'Membuat...' : 'Buat Spreadsheet Baru'}</span>
              </button>
            </div>

            {connectedSpreadsheetId ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">Spreadsheet Terhubung</p>
                    <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 truncate max-w-md">ID: {connectedSpreadsheetId}</p>
                  </div>
                </div>
                <a
                  href={connectedSpreadsheetUrl || `https://docs.google.com/spreadsheets/d/${connectedSpreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <span>Buka di Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500">
                Belum ada Spreadsheet terhubung.
              </div>
            )}

            {/* Custom Link Add */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>Salin Paste ID / URL Google Spreadsheet</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: https://docs.google.com/spreadsheets/d/1A2B3C4D.../edit"
                  value={customSheetInput}
                  onChange={(e) => setCustomSheetInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                />
                <button onClick={handleCustomLinkAdd} className="px-4 py-2 bg-violet-600 text-white font-bold text-xs rounded-xl">
                  Hubungkan
                </button>
              </div>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleSyncToSheets}
              disabled={!connectedSpreadsheetId || isSyncing}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isSyncing ? 'Mengirim Data...' : 'Kirim Data ke Google Sheets'}</span>
            </button>

            <button
              onClick={handleImportFromSheets}
              disabled={!connectedSpreadsheetId || isImporting}
              className="py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isImporting ? 'Membaca Data...' : 'Tarik Data dari Google Sheets'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
