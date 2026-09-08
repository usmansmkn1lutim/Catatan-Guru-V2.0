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
  verifySpreadsheetAccess,
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
  Trash2,
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
  const [activeIntegrationMode, setActiveIntegrationMode] = useState<'oauth' | 'gas'>('oauth');

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
  const [connectedSpreadsheetTitle, setConnectedSpreadsheetTitle] = useState<string>(() => {
    return localStorage.getItem('catatan_guru_active_sheet_title') || '';
  });

  const [userSpreadsheets, setUserSpreadsheets] = useState<SpreadsheetFile[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState<boolean>(false);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

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

  const handleSelectSpreadsheet = (id: string, url?: string, title?: string) => {
    setConnectedSpreadsheetId(id);
    const computedUrl = url || `https://docs.google.com/spreadsheets/d/${id}/edit`;
    setConnectedSpreadsheetUrl(computedUrl);
    if (title) {
      setConnectedSpreadsheetTitle(title);
      localStorage.setItem('catatan_guru_active_sheet_title', title);
    }
    localStorage.setItem('catatan_guru_active_sheet_id', id);
    localStorage.setItem('catatan_guru_active_sheet_url', computedUrl);
    showToast('Spreadsheet Google berhasil terhubung!', 'success');
  };

  const handleDisconnectSpreadsheet = () => {
    setConnectedSpreadsheetId('');
    setConnectedSpreadsheetUrl('');
    setConnectedSpreadsheetTitle('');
    localStorage.removeItem('catatan_guru_active_sheet_id');
    localStorage.removeItem('catatan_guru_active_sheet_url');
    localStorage.removeItem('catatan_guru_active_sheet_title');
    showToast('Tautan Spreadsheet Google telah diputuskan.', 'success');
  };

  const handleCreateNewSpreadsheet = async () => {
    setIsCreating(true);
    try {
      const title = `Catatan Guru - Database (${dataSekolah.namaSekolah || 'Sekolah'})`;
      const res = await executeWithGoogleAuth((token) => createSpreadsheet(token, title));
      handleSelectSpreadsheet(res.id, res.url, title);
      showToast(`Spreadsheet baru "${title}" berhasil dibuat di Google Drive!`, 'success');
      const freshToken = getAccessToken();
      if (freshToken) fetchSpreadsheets(freshToken);
    } catch (err: any) {
      showToast(`Gagal membuat Spreadsheet: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCustomLinkAdd = async () => {
    if (!customSheetInput.trim()) {
      showToast('Masukkan ID atau URL Google Spreadsheet terlebih dahulu.', 'error');
      return;
    }
    let sheetId = customSheetInput.trim();
    const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    if (!user) {
      showToast('Silakan klik "Masuk dengan Google" terlebih dahulu agar aplikasi dapat mengakses Spreadsheet.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const verified = await executeWithGoogleAuth((tok) => verifySpreadsheetAccess(sheetId, tok));
      handleSelectSpreadsheet(sheetId, `https://docs.google.com/spreadsheets/d/${sheetId}/edit`, verified.title);
      setCustomSheetInput('');
      showToast(`Berhasil terhubung ke Spreadsheet: "${verified.title}"`, 'success');
    } catch (err: any) {
      showToast(`Gagal menghubungkan: ${err.message || 'Periksa ID/URL Spreadsheet dan izin akses akun Anda.'}`, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSyncToSheets = async () => {
    if (!connectedSpreadsheetId) {
      showToast('Pilih atau hubungkan Spreadsheet Google terlebih dahulu.', 'error');
      return;
    }

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menyinkronkan data aplikasi ke Google Spreadsheet terpilih?\n\nData di Google Spreadsheet akan diperbarui sesuai data aplikasi saat ini.'
    );
    if (!confirmed) return;

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
            onClick={() => setActiveIntegrationMode('oauth')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeIntegrationMode === 'oauth'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Akun Google &amp; URL Sheet</span>
            <span className="ml-1 text-[9px] bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
              Pilihan Anda
            </span>
          </button>

          <button
            onClick={() => setActiveIntegrationMode('gas')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeIntegrationMode === 'gas'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Google Apps Script (GAS)</span>
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
          {/* STEP 1: GOOGLE ACCOUNT LOGIN */}
          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/20 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 gap-4">
              <div className="flex items-center space-x-3.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {user.email?.charAt(0).toUpperCase() || 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {user.displayName || 'Pengguna Google'}
                    </p>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Terhubung
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 hover:border-rose-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti Akun / Keluar</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-md uppercase tracking-wider">
                  Langkah 1: Otorisasi Akun
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Masuk dengan Akun Google
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  Masuk dengan akun Google Anda untuk memberikan izin akses membaca dan menyimpan ke Google Spreadsheet di Drive Anda.
                </p>
              </div>

              {/* Official Google Sign In Button */}
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-slate-400 rounded-xl font-semibold text-xs flex items-center space-x-3 shadow-sm hover:shadow transition-all shrink-0 disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span>{isLoggingIn ? 'Membuka Login Google...' : 'Masuk dengan Google'}</span>
              </button>
            </div>
          )}

          {/* STEP 2: PASTE ID/URL SPREADSHEET & CONNECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-md uppercase tracking-wider">
                  Langkah 2: Hubungkan Spreadsheet
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Masukkan ID atau URL Google Spreadsheet
                </h3>
              </div>

              <button
                onClick={handleCreateNewSpreadsheet}
                disabled={isCreating || !user}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-2 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-40 self-start sm:self-auto"
                title={!user ? 'Masuk dengan Google terlebih dahulu' : ''}
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? 'Membuat...' : 'Buat Spreadsheet Baru di Drive'}</span>
              </button>
            </div>

            {/* If Connected */}
            {connectedSpreadsheetId ? (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-emerald-950 dark:text-emerald-100 text-sm">
                          {connectedSpreadsheetTitle || 'Spreadsheet Aktif Terhubung'}
                        </p>
                        <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold rounded-md">
                          TERHUBUNG
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-md mt-0.5">
                        ID: <span className="font-bold text-emerald-800 dark:text-emerald-300">{connectedSpreadsheetId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <a
                      href={connectedSpreadsheetUrl || `https://docs.google.com/spreadsheets/d/${connectedSpreadsheetId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                    >
                      <span>Buka File di Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={handleDisconnectSpreadsheet}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1 transition-colors"
                      title="Putuskan sambungan Spreadsheet ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Putuskan</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-1 py-6">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Belum ada Spreadsheet Google yang terhubung.
                </p>
                <p className="text-[11px] text-slate-400">
                  Silakan tempelkan ID atau link URL file Spreadsheet Anda di bawah ini, lalu klik tombol <strong>Hubungkan &amp; Verifikasi</strong>.
                </p>
              </div>
            )}

            {/* Custom Link / ID Paste Form */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Salin &amp; Tempelkan ID atau URL Lengkap Google Spreadsheet:</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit atau masukkan ID saja"
                  value={customSheetInput}
                  onChange={(e) => setCustomSheetInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCustomLinkAdd();
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  onClick={handleCustomLinkAdd}
                  disabled={isVerifying}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors disabled:opacity-60 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isVerifying ? 'Memverifikasi...' : 'Hubungkan & Verifikasi'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Petunjuk Menyalin ID/URL Spreadsheet:</span>
                </p>
                <p>
                  1. Buka file Google Spreadsheet Anda di browser.<br />
                  2. Salin seluruh URL pada bilah alamat (address bar), misalnya <code className="text-emerald-700 dark:text-emerald-400 bg-slate-200/60 dark:bg-slate-900 px-1 py-0.5 rounded">https://docs.google.com/spreadsheets/d/1A2B3C4D.../edit</code>, atau cukup salin kode ID uniknya.<br />
                  3. Pastikan akun Google yang Anda gunakan untuk login di atas memiliki izin (Editor/Viewer) pada file Spreadsheet tersebut.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 3: SYNC ACTIONS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Aksi Sinkronisasi Data
              </h4>
              {connectedSpreadsheetId && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Target: {connectedSpreadsheetTitle || connectedSpreadsheetId}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleSyncToSheets}
                disabled={!connectedSpreadsheetId || isSyncing}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                <span>{isSyncing ? 'Mengirim Data...' : 'Kirim Data ke Google Sheets (Backup)'}</span>
              </button>

              <button
                onClick={handleImportFromSheets}
                disabled={!connectedSpreadsheetId || isImporting}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-2.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{isImporting ? 'Membaca Data...' : 'Tarik Data dari Google Sheets (Restore)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
