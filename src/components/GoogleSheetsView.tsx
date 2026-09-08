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
  getSpreadsheetDetails,
  extractSpreadsheetId,
  activeFirebaseConfig,
  SpreadsheetFile,
  SpreadsheetDetails,
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
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
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
    scheduleList?: any[];
    scheduleConfig?: any;
  }) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error' | 'disabled' | 'unconfigured';
  lastSyncedTime?: string | null;
}

interface ConfirmModalState {
  isOpen: boolean;
  type: 'export' | 'import';
  title: string;
  description: string;
  details: string[];
  confirmLabel: string;
  onConfirm: () => Promise<void>;
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
  // Default to OAuth REST API as requested
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

  const [spreadsheetDetails, setSpreadsheetDetails] = useState<SpreadsheetDetails | null>(null);
  const [isValidatingSheet, setIsValidatingSheet] = useState<boolean>(false);
  const [customSheetInput, setCustomSheetInput] = useState<string>('');

  const [userSpreadsheets, setUserSpreadsheets] = useState<SpreadsheetFile[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState<boolean>(false);
  const [showDriveList, setShowDriveList] = useState<boolean>(false);

  // Vercel / Unauthorized Domain Helper State
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState<{
    domain: string;
    projectId: string;
  } | null>(null);
  const [showVercelGuide, setShowVercelGuide] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Confirmation Modal State (Mandatory for destructive/modifying operations)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Listen to Firebase Auth state for OAuth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        if (token) {
          fetchSpreadsheets(token);
          if (connectedSpreadsheetId) {
            verifySpreadsheetId(connectedSpreadsheetId, token, false);
          }
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [connectedSpreadsheetId]);

  // Direct OAuth token resolver
  const executeWithGoogleAuth = async <T,>(
    action: (token: string) => Promise<T>
  ): Promise<T> => {
    const currentToken = accessToken || getAccessToken();
    if (!currentToken) {
      throw new Error(
        'Anda belum terhubung dengan Akun Google. Silakan klik tombol "Sign in with Google" terlebih dahulu.'
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
        setAccessToken(null);
        throw new Error(
          'Sesi akses Google Anda telah berakhir. Silakan klik "Sign in with Google" untuk memperbarui sesi.'
        );
      }
      throw err;
    }
  };

  const handleCopyCurrentDomain = () => {
    const domain = typeof window !== 'undefined' ? window.location.hostname : '';
    if (domain) {
      navigator.clipboard.writeText(domain);
      setCopiedDomain(true);
      showToast(`Domain "${domain}" berhasil disalin!`, 'success');
      setTimeout(() => setCopiedDomain(false), 3000);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setUnauthorizedDomainError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(`Berhasil masuk sebagai ${result.user.displayName || result.user.email}`, 'success');
        fetchSpreadsheets(result.accessToken);
        if (connectedSpreadsheetId) {
          verifySpreadsheetId(connectedSpreadsheetId, result.accessToken, false);
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || String(err?.message).includes('unauthorized-domain')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain Vercel Anda';
        setUnauthorizedDomainError({
          domain: currentHost,
          projectId: activeFirebaseConfig.projectId,
        });
        showToast(`Domain "${currentHost}" belum diizinkan di Firebase Console. Lihat solusi di bawah.`, 'error');
      } else {
        showToast(`Gagal masuk Google: ${err.message || 'Terjadi kesalahan'}`, 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setAccessToken(null);
    setSpreadsheetDetails(null);
    showToast('Telah keluar dari Akun Google.', 'success');
  };

  const fetchSpreadsheets = async (token: string) => {
    setIsLoadingSpreadsheets(true);
    try {
      const files = await listUserSpreadsheets(token);
      setUserSpreadsheets(files);
    } catch (err: any) {
      console.warn('Fetch spreadsheets warning:', err);
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  // Verify and load spreadsheet metadata via REST API
  const verifySpreadsheetId = async (
    sheetId: string,
    token: string,
    notifySuccess = true
  ): Promise<boolean> => {
    setIsValidatingSheet(true);
    try {
      const details = await getSpreadsheetDetails(sheetId, token);
      setSpreadsheetDetails(details);
      setConnectedSpreadsheetId(details.id);
      setConnectedSpreadsheetUrl(details.url);
      setConnectedSpreadsheetTitle(details.title);

      localStorage.setItem('catatan_guru_active_sheet_id', details.id);
      localStorage.setItem('catatan_guru_active_sheet_url', details.url);
      localStorage.setItem('catatan_guru_active_sheet_title', details.title);

      if (notifySuccess) {
        showToast(`Spreadsheet "${details.title}" berhasil diverifikasi dan terhubung!`, 'success');
      }
      return true;
    } catch (err: any) {
      console.error('Verifikasi Spreadsheet Gagal:', err);
      if (notifySuccess) {
        showToast(`Gagal memverifikasi spreadsheet: ${err.message}`, 'error');
      }
      return false;
    } finally {
      setIsValidatingSheet(false);
    }
  };

  // Connect pasted URL or ID
  const handleConnectCustomSheet = async () => {
    if (!customSheetInput.trim()) {
      showToast('Tempel atau ketik ID/URL Google Spreadsheet terlebih dahulu.', 'error');
      return;
    }

    const currentToken = accessToken || getAccessToken();
    if (!currentToken) {
      showToast('Silakan klik "Sign in with Google" terlebih dahulu sebelum menghubungkan spreadsheet.', 'error');
      return;
    }

    const cleanId = extractSpreadsheetId(customSheetInput);
    if (!cleanId || cleanId.length < 10) {
      showToast('Format URL atau ID Spreadsheet tidak valid. Pastikan format benar.', 'error');
      return;
    }

    const ok = await verifySpreadsheetId(cleanId, currentToken, true);
    if (ok) {
      setCustomSheetInput('');
    }
  };

  // Disconnect spreadsheet
  const handleDisconnectSpreadsheet = () => {
    setConnectedSpreadsheetId('');
    setConnectedSpreadsheetUrl('');
    setConnectedSpreadsheetTitle('');
    setSpreadsheetDetails(null);
    localStorage.removeItem('catatan_guru_active_sheet_id');
    localStorage.removeItem('catatan_guru_active_sheet_url');
    localStorage.removeItem('catatan_guru_active_sheet_title');
    showToast('Spreadsheet telah dilepas dari aplikasi.', 'success');
  };

  // Paste from clipboard helper
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCustomSheetInput(text.trim());
      }
    } catch (err) {
      // Clipboard permissions may fail in some environments
    }
  };

  // Create new Spreadsheet directly in Google Drive
  const handleCreateNewSpreadsheet = async () => {
    setIsCreating(true);
    try {
      const title = `Catatan Guru - Database (${dataSekolah.namaSekolah || 'Sekolah'})`;
      const res = await executeWithGoogleAuth((token) => createSpreadsheet(token, title));
      const freshToken = accessToken || getAccessToken();
      if (freshToken) {
        await verifySpreadsheetId(res.id, freshToken, false);
        fetchSpreadsheets(freshToken);
      }
      showToast(`Spreadsheet baru "${title}" berhasil dibuat di Google Drive!`, 'success');
    } catch (err: any) {
      showToast(`Gagal membuat Spreadsheet: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Perform Export to Google Sheets
  const performExportToSheets = async () => {
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
      const freshToken = accessToken || getAccessToken();
      if (freshToken) {
        verifySpreadsheetId(connectedSpreadsheetId, freshToken, false);
      }
    } catch (err: any) {
      showToast(`Gagal menyinkronkan data: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Perform Import from Google Sheets
  const performImportFromSheets = async () => {
    if (!connectedSpreadsheetId) {
      showToast('Pilih atau hubungkan Spreadsheet Google terlebih dahulu.', 'error');
      return;
    }
    setIsImporting(true);
    try {
      const imported = await executeWithGoogleAuth((token) =>
        importFromGoogleSheets(connectedSpreadsheetId, token)
      );
      onImportData(imported);
      showToast('Data berhasil dibaca dan diperbarui dari Google Sheets!', 'success');
    } catch (err: any) {
      showToast(`Gagal membaca data dari Google Sheets: ${err.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Open confirmation modal for Export
  const promptExportConfirm = () => {
    if (!connectedSpreadsheetId) {
      showToast('Hubungkan Google Spreadsheet terlebih dahulu.', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Konfirmasi Kirim Data ke Google Sheets',
      description:
        'Tindakan ini akan mengirim seluruh data lokal aplikasi dan memperbarui lembar kerja (tabs) di Google Spreadsheet terpilih dengan data terbaru.',
      details: [
        'Data Sekolah & Profil Guru',
        'Data Mata Pelajaran & Kelas',
        'Data Siswa & Rekap Presensi',
        'Rekap Nilai Siswa & Jurnal Mengajar',
      ],
      confirmLabel: 'Ya, Kirim & Simpan ke Spreadsheet',
      onConfirm: async () => {
        setConfirmModal(null);
        await performExportToSheets();
      },
    });
  };

  // Open confirmation modal for Import
  const promptImportConfirm = () => {
    if (!connectedSpreadsheetId) {
      showToast('Hubungkan Google Spreadsheet terlebih dahulu.', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'import',
      title: 'Konfirmasi Tarik Data dari Google Sheets',
      description:
        'Tindakan ini akan membaca data dari Google Spreadsheet dan memperbarui data lokal aplikasi (sekolah, guru, mapel, kelas, siswa).',
      details: [
        'Data lokal sekolah dan profil guru akan digantikan data dari Spreadsheet',
        'Daftar mata pelajaran, kelas, dan data siswa akan diperbarui',
      ],
      confirmLabel: 'Ya, Tarik & Perbarui Data Lokal',
      onConfirm: async () => {
        setConfirmModal(null);
        await performImportFromSheets();
      },
    });
  };

  // Save GAS URL
  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    setStoredGasUrl(url);
    setGasConnected(null);
  };

  // Test GAS Connection
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

  // GAS Save
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

  // GAS Load
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
              Integrasikan akun Google Anda untuk sinkronisasi data sekolah, guru, siswa, presensi, nilai, dan jurnal ke Google Sheets.
            </p>
          </div>
        </div>

        {/* Integration Mode Switcher */}
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
            <span>OAuth REST API</span>
            <span className="ml-1 text-[9px] bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
              Resmi
            </span>
          </button>

          <button
            onClick={() => setActiveIntegrationMode('gas')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              activeIntegrationMode === 'gas'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Google Apps Script</span>
          </button>
        </div>
      </div>

      {/* Auto-Sync Status Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <RefreshCw className={`w-4 h-4 ${autoSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Status Sinkronisasi Spreadsheet
              </h3>
              {connectedSpreadsheetId ? (
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  TERHUBUNG
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold rounded-md">
                  BELUM DIHUBUNGKAN
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {connectedSpreadsheetTitle
                ? `Spreadsheet Aktif: ${connectedSpreadsheetTitle}`
                : 'Silakan masuk akun Google lalu paste ID atau URL Spreadsheet di bawah.'}
            </p>
            {lastSyncedTime && (
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Terakhir disinkronkan: {lastSyncedTime}
              </p>
            )}
          </div>
        </div>

        {onToggleAutoSync && (
          <button
            onClick={onToggleAutoSync}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shrink-0 ${
              autoSyncEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span>{autoSyncEnabled ? 'Auto-Sync: Aktif' : 'Auto-Sync: Nonaktif'}</span>
          </button>
        )}
      </div>

      {/* MODE 1: DIRECT GOOGLE OAUTH REST API */}
      {activeIntegrationMode === 'oauth' && (
        <div className="space-y-6">
          {/* Step 1: Google Account Authentication */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Autentikasi Akun Google (OAuth REST API)
                </h3>
              </div>
              {user && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Izin Google Terverifikasi</span>
                </span>
              )}
            </div>

            {user ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {user.email?.charAt(0).toUpperCase() || 'G'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {user.displayName || 'Pengguna Google'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      OAuth REST API siap digunakan
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-5 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1 text-left">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Masuk dengan Akun Google untuk Mengaktifkan REST API
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                    Aplikasi akan mengakses Google Sheets dan Google Drive Anda dengan izin resmi pengguna melalui popup Google Sign-In.
                  </p>
                </div>

                {/* Official Styled Google Sign-In Button */}
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm transition-all active:scale-98 disabled:opacity-60 shrink-0"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span className="text-xs font-bold">
                    {isLoggingIn ? 'Menghubungkan...' : 'Masuk dengan Google (Sign in)'}
                  </span>
                </button>
              </div>
            )}

            {/* ERROR BANNER: UNAUTHORIZED DOMAIN (VERCEL / CUSTOM HOST) */}
            {unauthorizedDomainError && (
              <div className="p-5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-3.5 animate-fadeIn">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-rose-500 text-white rounded-lg shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                      <span>Penyebab Gagal Login di Vercel: Domain Belum Diizinkan (Authorized Domains)</span>
                    </h4>
                    <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                      Google & Firebase Authentication membatasi izin login hanya dari domain yang terdaftar secara resmi. Domain Vercel Anda (<strong>{unauthorizedDomainError.domain}</strong>) belum didaftarkan di Firebase Console.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Domain Anda:</span>
                  <code className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-1 rounded border border-rose-200 dark:border-rose-800 font-mono">
                    {unauthorizedDomainError.domain}
                  </code>
                  <button
                    onClick={handleCopyCurrentDomain}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-md flex items-center space-x-1 transition-colors ml-auto"
                  >
                    {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDomain ? 'Tersalin!' : 'Salin Domain'}</span>
                  </button>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-lg border border-rose-200/70 dark:border-rose-800/70 space-y-2 text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    Langkah Mengatasi (Hanya butuh 1 menit):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    <li>
                      Buka Firebase Console pada proyek <strong className="text-slate-800 dark:text-slate-200">{unauthorizedDomainError.projectId}</strong>
                    </li>
                    <li>
                      Pilih menu <strong>Authentication</strong> &rarr; tab <strong>Settings</strong> (Pengaturan)
                    </li>
                    <li>
                      Gulir ke bagian <strong>Authorized domains</strong> (Domain yang diizinkan) &rarr; klik <strong>Add domain</strong>
                    </li>
                    <li>
                      Tempel domain Anda: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-rose-600">{unauthorizedDomainError.domain}</code> lalu klik <strong>Add</strong>
                    </li>
                    <li>
                      Kembali ke sini dan klik tombol <strong>Masuk dengan Google</strong> lagi!
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                  <a
                    href={`https://console.firebase.google.com/project/${unauthorizedDomainError.projectId}/authentication/settings`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <span>Buka Pengaturan Firebase Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setActiveIntegrationMode('gas')}
                    className="w-full sm:w-auto px-3.5 py-2 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors border border-violet-200 dark:border-violet-800"
                  >
                    <Zap className="w-3.5 h-3.5 text-violet-600" />
                    <span>Alternatif: Gunakan Google Apps Script (Tanpa Perlu Izin Domain)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* PROACTIVE VERCEL & HOSTING GUIDE COLLAPSIBLE */}
            {!unauthorizedDomainError && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVercelGuide(!showVercelGuide)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center space-x-1.5 font-medium transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hosting di Vercel atau domain kustom? Klik untuk panduan Authorized Domains Firebase</span>
                  {showVercelGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showVercelGuide && (
                  <div className="mt-3 p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-3 text-xs">
                    <div className="flex items-start space-x-2.5">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-slate-700 dark:text-slate-300">
                        <p className="font-bold text-[11px]">
                          Mengapa login Google gagal di Vercel?
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Secara default, Firebase Authentication hanya mengizinkan <code>localhost</code> dan domain default Firebase. Ketika Anda mendeploy ke Vercel (misal: <code>aplikasi-anda.vercel.app</code>), domain tersebut harus didaftarkan di Firebase Console agar popup Google Sign-In tidak ditolak.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 text-[11px]">
                      <span className="text-slate-500">Domain halaman ini:</span>
                      <code className="font-bold font-mono text-amber-700 dark:text-amber-400">
                        {typeof window !== 'undefined' ? window.location.hostname : 'domain Vercel'}
                      </code>
                      <button
                        onClick={handleCopyCurrentDomain}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded flex items-center space-x-1 ml-auto"
                      >
                        {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? 'Tersalin' : 'Salin Domain'}</span>
                      </button>
                    </div>

                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
                      <li>Buka Firebase Console &rarr; Proyek <strong>{activeFirebaseConfig.projectId}</strong></li>
                      <li>Masuk ke <strong>Authentication</strong> &rarr; tab <strong>Settings</strong> &rarr; <strong>Authorized domains</strong></li>
                      <li>Klik <strong>Add domain</strong>, tempel domain Vercel Anda, lalu simpan.</li>
                    </ol>

                    <div className="pt-1">
                      <a
                        href={`https://console.firebase.google.com/project/${activeFirebaseConfig.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        <span>Buka Firebase Console Authorized Domains</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Paste ID / URL Google Spreadsheet */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Hubungkan Google Spreadsheet (Paste ID / URL)
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateNewSpreadsheet}
                  disabled={isCreating || !user}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isCreating ? 'Membuat Spreadsheet...' : 'Buat Baru Otomatis'}</span>
                </button>

                {user && (
                  <button
                    onClick={() => setShowDriveList(!showDriveList)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pilih dari Drive</span>
                    {showDriveList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>

            {/* Input URL/ID Form */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Paste Link URL atau Spreadsheet ID:</span>
                </span>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Tempel dari Clipboard</span>
                </button>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={customSheetInput}
                  onChange={(e) => setCustomSheetInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConnectCustomSheet();
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
                <button
                  onClick={handleConnectCustomSheet}
                  disabled={isValidatingSheet || !customSheetInput.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shrink-0 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isValidatingSheet ? 'animate-spin' : ''}`} />
                  <span>{isValidatingSheet ? 'Memverifikasi...' : 'Hubungkan & Periksa'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Tip: Anda dapat menyalin URL langsung dari address bar browser saat membuka Google Sheets. Sistem akan otomatis mengekstrak ID Spreadsheet.
              </p>
            </div>

            {/* Verified Connected Spreadsheet Card */}
            {connectedSpreadsheetId ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                          {spreadsheetDetails?.title || connectedSpreadsheetTitle || 'Google Spreadsheet Terhubung'}
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                          Siap Sinkron
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 truncate max-w-md mt-0.5">
                        ID: {connectedSpreadsheetId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <a
                      href={connectedSpreadsheetUrl || `https://docs.google.com/spreadsheets/d/${connectedSpreadsheetId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <span>Buka di Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={handleDisconnectSpreadsheet}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-rose-600 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                      Ganti
                    </button>
                  </div>
                </div>

                {/* Detected Sheets / Tabs */}
                {spreadsheetDetails?.sheets && spreadsheetDetails.sheets.length > 0 && (
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1.5">
                      Lembar Kerja (Tabs) Terdeteksi ({spreadsheetDetails.sheets.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {spreadsheetDetails.sheets.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-medium rounded-md text-slate-700 dark:text-slate-300"
                        >
                          {s.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-1">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Belum ada Spreadsheet terhubung
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Tempel URL spreadsheet di atas atau klik "Buat Baru Otomatis" untuk membuat file database baru di Google Drive Anda.
                </p>
              </div>
            )}

            {/* User Spreadsheets from Drive (Dropdown/Collapse) */}
            {showDriveList && userSpreadsheets.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span>Daftar Spreadsheet di Google Drive Anda:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">{userSpreadsheets.length} file</span>
                </div>

                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                  {userSpreadsheets.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-400 transition-colors text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{f.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">ID: {f.id}</p>
                      </div>
                      <button
                        onClick={() => {
                          const token = accessToken || getAccessToken();
                          if (token) verifySpreadsheetId(f.id, token, true);
                          setShowDriveList(false);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shrink-0"
                      >
                        Pilih
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Synchronization Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Eksekusi Sinkronisasi (REST API)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Button Card */}
              <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2.5 text-emerald-800 dark:text-emerald-200">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wide">
                        Kirim Data ke Google Sheets
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Export & Backup Database</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                    Kirim data sekolah, guru, mapel, kelas, siswa, presensi, nilai, dan jurnal ke Google Spreadsheet terpilih.
                  </p>
                </div>

                <button
                  onClick={promptExportConfirm}
                  disabled={!connectedSpreadsheetId || isSyncing || !user}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSyncing ? 'Mengirim Data...' : 'Kirim Data ke Google Sheets'}</span>
                </button>
              </div>

              {/* Import Button Card */}
              <div className="p-5 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/60 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2.5 text-violet-800 dark:text-violet-200">
                    <div className="p-2 bg-violet-600 text-white rounded-lg">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wide">
                        Tarik Data dari Google Sheets
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Import Data ke Aplikasi</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                    Baca data sekolah, profil guru, kelas, mapel, dan siswa dari Spreadsheet untuk diterapkan ke aplikasi ini.
                  </p>
                </div>

                <button
                  onClick={promptImportConfirm}
                  disabled={!connectedSpreadsheetId || isImporting || !user}
                  className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{isImporting ? 'Membaca Data...' : 'Tarik Data dari Google Sheets'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: GOOGLE APPS SCRIPT (GAS WEB APP) */}
      {activeIntegrationMode === 'gas' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Metode Google Apps Script (GAS Web App)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Alternatif sinkronisasi menggunakan deployment Google Apps Script Web App.
                </p>
              </div>

              <button
                onClick={() => setShowCodeGuide(!showCodeGuide)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors self-start"
              >
                <Code2 className="w-4 h-4 text-violet-600" />
                <span>{showCodeGuide ? 'Sembunyikan Panduan' : 'Lihat Panduan & Kode Script'}</span>
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
                <span>{isGasSyncing ? 'Mengirim Data...' : 'Kirim Data ke Google Spreadsheet (GAS)'}</span>
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

          {/* Guide for GAS */}
          {showCodeGuide && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-violet-500/20 text-violet-400 rounded-xl">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Panduan Memasang Google Apps Script (GAS)</h4>
                    <p className="text-xs text-slate-400">Salin kode Code.gs dan deploy sebagai Web App</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded font-bold text-[10px]">Langkah 1</span>
                  <p className="font-semibold text-slate-200">Buka Spreadsheet di Drive</p>
                  <p className="text-[11px] text-slate-400">Buka Google Spreadsheet di browser.</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded font-bold text-[10px]">Langkah 2</span>
                  <p className="font-semibold text-slate-200">Buka Ekstensi &gt; Apps Script</p>
                  <p className="text-[11px] text-slate-400">Tempelkan kode Code.gs lalu Deploy sebagai Web App (Who has access: Anyone).</p>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 max-h-48 overflow-y-auto custom-scrollbar border border-slate-800">
                  {CODE_GS_CONTENT}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Destructive / Modifying Operations (Workspace Skill Standard) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start space-x-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmModal.type === 'export'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                    : 'bg-violet-100 dark:bg-violet-950 text-violet-600'
                }`}
              >
                {confirmModal.type === 'export' ? <Upload className="w-6 h-6" /> : <Download className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            {/* Target Details */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
                <span>Spreadsheet Target:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[200px]">
                  {spreadsheetDetails?.title || connectedSpreadsheetTitle || connectedSpreadsheetId}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                {confirmModal.details.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-sm ${
                  confirmModal.type === 'export'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-violet-600 hover:bg-violet-700'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
