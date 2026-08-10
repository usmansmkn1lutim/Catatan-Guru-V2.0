import React, { useState, useEffect, useRef } from 'react';
import {
  AppConfig,
  DataSekolah,
  ProfilGuru,
  Mapel,
  Kelas,
  Siswa,
  PresensiRecord,
  NilaiRecord,
  JurnalRecord,
} from './types';
import {
  initialAppConfig,
  initialDataSekolah,
  initialProfilGuru,
  initialMapelList,
  initialKelasList,
  initialSiswaList,
  initialPresensiList,
  initialNilaiList,
  initialJurnalList,
  DEFAULT_APP_LOGO,
} from './data/initialData';
import {
  loadFromStorage,
  saveToStorage,
  saveAllAppDataToGas,
} from './lib/storage';
import { getStoredGasUrl, saveAppDataToGasUrl, loadAppDataFromGasUrl } from './lib/gasApi';
import { getAccessToken, exportToGoogleSheets, importFromGoogleSheets } from './lib/googleSheets';
import { sanitizePresensiList, formatDateString } from './lib/dateUtils';
import { CODE_GS_TEMPLATE, INDEX_HTML_TEMPLATE } from './lib/gasCode';
import { updateDynamicFavicons } from './lib/faviconUtils';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DataSekolahView } from './components/DataSekolah';
import { ProfilGuruView } from './components/ProfilGuru';
import { KonfigurasiAppView } from './components/KonfigurasiApp';
import { DataMapelView } from './components/DataMapel';
import { DataKelasView } from './components/DataKelas';
import { DataSiswaView } from './components/DataSiswa';
import { PresensiSiswaView } from './components/PresensiSiswa';
import { NilaiSiswaView } from './components/NilaiSiswa';
import { JurnalGuruView } from './components/JurnalGuru';
import { GoogleSheetsView } from './components/GoogleSheetsView';

import {
  Code,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Database,
  CloudUpload,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_mode') === 'dark';
  });

  // Main State
  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    const saved = loadFromStorage('appConfig', initialAppConfig);
    let storedAppLogo = localStorage.getItem('APP_LOGO_URL');
    
    // Force cache bust for the default logo
    if (storedAppLogo && storedAppLogo.startsWith('/logo.')) {
      storedAppLogo = DEFAULT_APP_LOGO;
    }

    const effectiveLogo = storedAppLogo || saved?.logoAplikasiUrl || initialAppConfig.logoAplikasiUrl || DEFAULT_APP_LOGO;
    if (!storedAppLogo) {
      try {
        localStorage.setItem('APP_LOGO_URL', effectiveLogo);
      } catch (e) {
        console.warn('Could not store APP_LOGO_URL:', e);
      }
    }
    return {
      namaAplikasi: saved?.namaAplikasi && saved.namaAplikasi !== 'Catatan Guru' ? saved.namaAplikasi : initialAppConfig.namaAplikasi,
      deskripsiAplikasi: saved?.deskripsiAplikasi && saved.deskripsiAplikasi !== 'Administrasi & Catatan Seorang Guru' ? saved.deskripsiAplikasi : initialAppConfig.deskripsiAplikasi,
      logoAplikasiUrl: effectiveLogo,
    };
  });
  const [dataSekolah, setDataSekolah] = useState<DataSekolah>(() => {
    const saved = loadFromStorage('dataSekolah', initialDataSekolah);
    let storedSchoolLogo = localStorage.getItem('SCHOOL_LOGO_URL');
    let savedLogo = saved?.logoSekolahUrl;
    
    // Clear old unsplash default if it exists
    if (storedSchoolLogo && storedSchoolLogo.includes('unsplash.com/photo-1546410531')) {
      storedSchoolLogo = '';
      localStorage.removeItem('SCHOOL_LOGO_URL');
    }
    if (savedLogo && savedLogo.includes('unsplash.com/photo-1546410531')) {
      savedLogo = '';
    }

    if (saved?.namaSekolah === 'SMA NEGERI 1 MANDIRI') {
      return {
        ...initialDataSekolah,
        logoSekolahUrl: storedSchoolLogo || initialDataSekolah.logoSekolahUrl,
      };
    }

    return {
      ...saved,
      logoSekolahUrl: storedSchoolLogo || savedLogo || initialDataSekolah.logoSekolahUrl,
    };
  });
  const [profilGuru, setProfilGuru] = useState<ProfilGuru>(() => {
    const saved = loadFromStorage('profilGuru', initialProfilGuru);
    let savedFoto = saved?.fotoProfilUrl;
    
    // Clear old unsplash default if it exists
    if (savedFoto && savedFoto.includes('unsplash.com/photo-1534528741775')) {
      savedFoto = '';
    }

    if (saved?.namaGuru === 'Budi Raharjo, S.Pd., M.T.') {
      return {
        ...initialProfilGuru,
        fotoProfilUrl: savedFoto || initialProfilGuru.fotoProfilUrl,
      };
    }

    return {
      ...saved,
      fotoProfilUrl: savedFoto || initialProfilGuru.fotoProfilUrl,
    };
  });
  const [mapelList, setMapelList] = useState<Mapel[]>(() =>
    loadFromStorage('mapelList', initialMapelList)
  );
  const [kelasList, setKelasList] = useState<Kelas[]>(() =>
    loadFromStorage('kelasList', initialKelasList)
  );
  const [siswaList, setSiswaList] = useState<Siswa[]>(() =>
    loadFromStorage('siswaList', initialSiswaList)
  );
  const [presensiList, setPresensiList] = useState<PresensiRecord[]>(() =>
    sanitizePresensiList(loadFromStorage('presensiList', initialPresensiList))
  );
  const [nilaiList, setNilaiList] = useState<NilaiRecord[]>(() =>
    loadFromStorage('nilaiList', initialNilaiList).map((n: NilaiRecord) => ({ ...n, tanggal: formatDateString(n.tanggal) }))
  );
  const [jurnalList, setJurnalList] = useState<JurnalRecord[]>(() =>
    loadFromStorage('jurnalList', initialJurnalList).map((j: JurnalRecord) => ({ ...j, tanggal: formatDateString(j.tanggal) }))
  );

  // Auto-Sync to Google Sheets State
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('catatan_guru_auto_sync');
    return stored !== 'false';
  });
  const [autoSyncStatus, setAutoSyncStatus] = useState<
    'idle' | 'syncing' | 'synced' | 'error' | 'disabled' | 'unconfigured'
  >('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    return localStorage.getItem('catatan_guru_last_synced_time') || null;
  });
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isFetchingRemote, setIsFetchingRemote] = useState<boolean>(false);

  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Copy code feedback state
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Sync dark mode class with <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme_mode', 'light');
    }
  }, [darkMode]);

  // Dynamic Favicon and App Icon sync across devices
  useEffect(() => {
    if (appConfig?.logoAplikasiUrl) {
      updateDynamicFavicons(appConfig.logoAplikasiUrl);
    }
  }, [appConfig?.logoAplikasiUrl]);

  // Persist to local storage on changes
  useEffect(() => {
    saveToStorage('appConfig', appConfig);
    if (appConfig?.logoAplikasiUrl) {
      localStorage.setItem('APP_LOGO_URL', appConfig.logoAplikasiUrl);
    }
  }, [appConfig]);

  useEffect(() => {
    saveToStorage('dataSekolah', dataSekolah);
    if (dataSekolah?.logoSekolahUrl) {
      localStorage.setItem('SCHOOL_LOGO_URL', dataSekolah.logoSekolahUrl);
    }
  }, [dataSekolah]);

  useEffect(() => {
    saveToStorage('profilGuru', profilGuru);
  }, [profilGuru]);

  useEffect(() => {
    saveToStorage('mapelList', mapelList);
  }, [mapelList]);

  useEffect(() => {
    saveToStorage('kelasList', kelasList);
  }, [kelasList]);

  useEffect(() => {
    saveToStorage('siswaList', siswaList);
  }, [siswaList]);

  useEffect(() => {
    saveToStorage('presensiList', presensiList);
  }, [presensiList]);

  useEffect(() => {
    saveToStorage('nilaiList', nilaiList);
  }, [nilaiList]);

  useEffect(() => {
    saveToStorage('jurnalList', jurnalList);
  }, [jurnalList]);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Toggle Auto-Sync
  const handleToggleAutoSync = () => {
    const next = !autoSyncEnabled;
    setAutoSyncEnabled(next);
    localStorage.setItem('catatan_guru_auto_sync', String(next));
    showToast(
      next
        ? 'Auto-Sync Google Sheets Diaktifkan. Perubahan data akan otomatis tersimpan.'
        : 'Auto-Sync Google Sheets Dinonaktifkan.',
      'success'
    );
  };

  // Fetch Remote Data (Pull latest from Google Sheets for multi-device sync)
  const handleFetchRemoteData = async (silent = false) => {
    const gasUrl = getStoredGasUrl();
    const activeSheetId = localStorage.getItem('catatan_guru_active_sheet_id');
    const token = getAccessToken();

    if (!gasUrl && (!activeSheetId || !token)) {
      if (!silent) showToast('Silakan atur URL Web App GAS atau Google OAuth terlebih dahulu.', 'error');
      setAutoSyncStatus('unconfigured');
      return;
    }

    if (!silent) setIsFetchingRemote(true);

    try {
      let remoteData: any = null;

      if (gasUrl) {
        remoteData = await loadAppDataFromGasUrl(gasUrl);
      } else if (activeSheetId && token) {
        remoteData = await importFromGoogleSheets(activeSheetId, token);
      }

      if (remoteData) {
        if (remoteData.dataSekolah) {
          setDataSekolah((prev) => ({
            ...remoteData.dataSekolah,
            logoSekolahUrl: remoteData.dataSekolah.logoSekolahUrl || prev.logoSekolahUrl || '',
          }));
        }
        if (remoteData.profilGuru) {
          setProfilGuru((prev) => ({
            ...remoteData.profilGuru,
            fotoProfilUrl: remoteData.profilGuru.fotoProfilUrl || prev.fotoProfilUrl || '',
          }));
        }
        if (remoteData.mapelList && Array.isArray(remoteData.mapelList)) setMapelList(remoteData.mapelList);
        if (remoteData.kelasList && Array.isArray(remoteData.kelasList)) setKelasList(remoteData.kelasList);
        if (remoteData.siswaList && Array.isArray(remoteData.siswaList)) setSiswaList(remoteData.siswaList);
        if (remoteData.presensiList && Array.isArray(remoteData.presensiList)) {
          setPresensiList(sanitizePresensiList(remoteData.presensiList));
        }
        if (remoteData.nilaiList && Array.isArray(remoteData.nilaiList)) {
          setNilaiList(remoteData.nilaiList.map((n: NilaiRecord) => ({ ...n, tanggal: formatDateString(n.tanggal) })));
        }
        if (remoteData.jurnalList && Array.isArray(remoteData.jurnalList)) {
          setJurnalList(remoteData.jurnalList.map((j: JurnalRecord) => ({ ...j, tanggal: formatDateString(j.tanggal) })));
        }
        if (remoteData.appConfig) {
          setAppConfig((prev) => ({
            ...remoteData.appConfig,
            logoAplikasiUrl: remoteData.appConfig.logoAplikasiUrl || prev.logoAplikasiUrl || DEFAULT_APP_LOGO,
          }));
        }

        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedTime(timeStr);
        localStorage.setItem('catatan_guru_last_synced_time', timeStr);
        setAutoSyncStatus('synced');
        setLastSyncError(null);
        if (!silent) showToast('Berhasil menarik data terkini dari Google Sheets', 'success');
      } else if (!silent) {
        showToast('Belum ada data tersimpan di Google Sheets.', 'error');
      }
    } catch (err: any) {
      console.error('Fetch remote data error:', err);
      if (!silent) showToast(`Gagal menarik data dari Google Sheets: ${err?.message || 'Error'}`, 'error');
      setAutoSyncStatus('error');
      setLastSyncError(err?.message || 'Gagal memuat data remote');
    } finally {
      if (!silent) setIsFetchingRemote(false);
    }
  };

  // Initial Boot & Window Focus Remote Sync
  useEffect(() => {
    handleFetchRemoteData(true);

    const onFocus = () => {
      const gasUrl = getStoredGasUrl();
      const activeSheetId = localStorage.getItem('catatan_guru_active_sheet_id');
      if (gasUrl || activeSheetId) {
        handleFetchRemoteData(true);
      }
    };

    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Debounced Auto-Sync on state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!autoSyncEnabled) {
      setAutoSyncStatus('disabled');
      return;
    }

    const gasUrl = getStoredGasUrl();
    const activeSheetId = localStorage.getItem('catatan_guru_active_sheet_id');
    const token = getAccessToken();

    if (!gasUrl && (!activeSheetId || !token)) {
      setAutoSyncStatus('unconfigured');
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setAutoSyncStatus('syncing');

      const payload = {
        dataSekolah,
        profilGuru,
        mapelList,
        kelasList,
        siswaList,
        presensiList,
        nilaiList,
        jurnalList,
        appConfig,
      };

      try {
        let success = false;
        let msg = '';

        if (gasUrl) {
          const result = await saveAppDataToGasUrl(gasUrl, payload);
          success = result.status === 'success';
          msg = result.message;
        } else if (activeSheetId && token) {
          await exportToGoogleSheets(activeSheetId, token, payload);
          success = true;
          msg = 'Berhasil disinkronkan via OAuth';
        }

        if (success) {
          const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setAutoSyncStatus('synced');
          setLastSyncedTime(timeStr);
          localStorage.setItem('catatan_guru_last_synced_time', timeStr);
          setLastSyncError(null);
        } else {
          setAutoSyncStatus('error');
          setLastSyncError(msg || 'Gagal mengirim data ke Google Sheets');
        }
      } catch (err: any) {
        console.error('Auto sync error:', err);
        setAutoSyncStatus('error');
        setLastSyncError(err?.message || 'Kesalahan jaringan saat auto-sync');
      }
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    dataSekolah,
    profilGuru,
    mapelList,
    kelasList,
    siswaList,
    presensiList,
    nilaiList,
    jurnalList,
    appConfig,
    autoSyncEnabled,
  ]);

  // Google Spreadsheet Manual Sync
  const handleSyncData = async () => {
    setIsSyncing(true);
    const allPayload = {
      dataSekolah,
      profilGuru,
      mapelList,
      kelasList,
      siswaList,
      presensiList,
      nilaiList,
      jurnalList,
    };

    try {
      const res = await saveAllAppDataToGas(allPayload);
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAutoSyncStatus('synced');
        setLastSyncedTime(timeStr);
        localStorage.setItem('catatan_guru_last_synced_time', timeStr);
        showToast(res.message, 'success');
      } else {
        showToast(`Sinkronisasi disimpan di penyimpanan lokal browser`, 'success');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat sinkronisasi', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'gs' | 'html') => {
    navigator.clipboard.writeText(text);
    if (type === 'gs') {
      setCopiedGs(true);
      setTimeout(() => setCopiedGs(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
    showToast('Kode berhasil disalin ke clipboard!', 'success');
  };

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased overflow-hidden">
      {/* Toast Notification (Fixed Position) */}
      {toast && (
        <div className="fixed bottom-12 right-8 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center gap-4 border-l-4 border-l-violet-600 transition-all animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {toast.type === 'success' ? 'Sukses' : 'Perhatian'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="ml-4 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        appConfig={appConfig}
        sekolah={dataSekolah}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar */}
        <Header
          dataSekolah={dataSekolah}
          profilGuru={profilGuru}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          setActiveTab={setActiveTab}
          onSyncData={handleSyncData}
          isSyncing={isSyncing}
          autoSyncStatus={autoSyncStatus}
          autoSyncEnabled={autoSyncEnabled}
          lastSyncedTime={lastSyncedTime}
          onToggleAutoSync={handleToggleAutoSync}
          onFetchRemoteData={() => handleFetchRemoteData(false)}
          isFetchingRemote={isFetchingRemote}
          onToggleMobileMenu={() => setIsOpenMobile((prev) => !prev)}
        />

        {/* Page Views Routing */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              dataSekolah={dataSekolah}
              profilGuru={profilGuru}
              siswaList={siswaList}
              kelasList={kelasList}
              mapelList={mapelList}
              presensiList={presensiList}
              nilaiList={nilaiList}
              jurnalList={jurnalList}
              onNavigate={(tab) => setActiveTab(tab)}
              autoSyncStatus={autoSyncStatus}
              lastSyncedTime={lastSyncedTime}
              autoSyncEnabled={autoSyncEnabled}
              onFetchRemoteData={() => handleFetchRemoteData(false)}
            />
          )}

          {activeTab === 'sekolah' && (
            <DataSekolahView
              dataSekolah={dataSekolah}
              onSaveDataSekolah={setDataSekolah}
              showToast={showToast}
            />
          )}

          {activeTab === 'profil' && (
            <ProfilGuruView
              profilGuru={profilGuru}
              onSaveProfilGuru={setProfilGuru}
              showToast={showToast}
            />
          )}

          {activeTab === 'konfigurasi' && (
            <KonfigurasiAppView
              appConfig={appConfig}
              onSaveAppConfig={(newConfig) => {
                const updated = {
                  ...newConfig,
                  logoAplikasiUrl: newConfig.logoAplikasiUrl || DEFAULT_APP_LOGO,
                };
                setAppConfig(updated);
                saveToStorage('appConfig', updated);
                localStorage.setItem('APP_LOGO_URL', updated.logoAplikasiUrl);
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'mapel' && (
            <DataMapelView
              mapelList={mapelList}
              onSaveMapelList={setMapelList}
              showToast={showToast}
            />
          )}

          {activeTab === 'kelas' && (
            <DataKelasView
              kelasList={kelasList}
              siswaList={siswaList}
              onSaveKelasList={setKelasList}
              onSaveSiswaList={setSiswaList}
              showToast={showToast}
            />
          )}

          {activeTab === 'siswa' && (
            <DataSiswaView
              siswaList={siswaList}
              kelasList={kelasList}
              presensiList={presensiList}
              nilaiList={nilaiList}
              onSaveSiswaList={setSiswaList}
              showToast={showToast}
            />
          )}

          {activeTab === 'presensi' && (
            <PresensiSiswaView
              presensiList={presensiList}
              siswaList={siswaList}
              kelasList={kelasList}
              mapelList={mapelList}
              onSavePresensiList={setPresensiList}
              showToast={showToast}
            />
          )}

          {activeTab === 'nilai' && (
            <NilaiSiswaView
              nilaiList={nilaiList}
              siswaList={siswaList}
              kelasList={kelasList}
              mapelList={mapelList}
              onSaveNilaiList={setNilaiList}
              showToast={showToast}
            />
          )}

          {activeTab === 'jurnal' && (
            <JurnalGuruView
              jurnalList={jurnalList}
              mapelList={mapelList}
              kelasList={kelasList}
              onSaveJurnalList={setJurnalList}
              showToast={showToast}
            />
          )}

          {activeTab === 'google_sheets' && (
            <GoogleSheetsView
              dataSekolah={dataSekolah}
              profilGuru={profilGuru}
              mapelList={mapelList}
              kelasList={kelasList}
              siswaList={siswaList}
              presensiList={presensiList}
              nilaiList={nilaiList}
              jurnalList={jurnalList}
              onImportData={(data) => {
                if (data.dataSekolah) setDataSekolah(data.dataSekolah);
                if (data.profilGuru) setProfilGuru(data.profilGuru);
                if (data.mapelList && data.mapelList.length > 0) setMapelList(data.mapelList);
                if (data.kelasList && data.kelasList.length > 0) setKelasList(data.kelasList);
                if (data.siswaList && data.siswaList.length > 0) setSiswaList(data.siswaList);
              }}
              showToast={showToast}
              autoSyncEnabled={autoSyncEnabled}
              onToggleAutoSync={handleToggleAutoSync}
              autoSyncStatus={autoSyncStatus}
              lastSyncedTime={lastSyncedTime}
            />
          )}

          {/* Deployment to Google Apps Script View */}
          {activeTab === 'gas_deploy' && (
            <div className="space-y-6 pb-12">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Panduan Deployment ke Google Apps Script (GAS)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Instruksi lengkap menyambungkan aplikasi ini secara gratis dengan Google Spreadsheet
                  </p>
                </div>
              </div>

              {/* Step-by-Step Guide */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 text-xs">
                <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                  Langkah-Langkah Pemasangan (Deployment)
                </h3>

                <ol className="list-decimal list-inside space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  <li>
                    Buka <strong>Google Drive</strong>, buat satu file <strong>Google Spreadsheet Baru</strong>, dan beri nama misalnya: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-violet-600">Database Catatan Guru</code>.
                  </li>
                  <li>
                    Di dalam Google Spreadsheet tersebut, klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Di dalam editor Google Apps Script, ganti seluruh isi file <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-violet-600">Code.gs</code> dengan kode backend di bawah ini.
                  </li>
                  <li>
                    Klik tombol <strong>+ (Tambah File)</strong> &gt; pilih <strong>HTML</strong>, beri nama file <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-violet-600">Index</code> (sehingga menjadi <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-violet-600">Index.html</code>), lalu tempelkan kode wrapper HTML di bawah ini.
                  </li>
                  <li>
                    Klik tombol <strong>Deploy (Terapkan)</strong> di sudut kanan atas &gt; pilih <strong>Deployment Baru (New Deployment)</strong>.
                  </li>
                  <li>
                    Pilih jenis <strong>Aplikasi Web (Web App)</strong>. Atur:
                    <ul className="list-disc list-inside ml-6 mt-1 text-slate-600 dark:text-slate-400">
                      <li><strong>Jalankan sebagai:</strong> Saya (Alamat email Anda)</li>
                      <li><strong>Siapa yang memiliki akses:</strong> Siapa saja (Anyone)</li>
                    </ul>
                  </li>
                  <li>
                    Klik <strong>Terapkan (Deploy)</strong>, berikan izin akses ke Spreadsheet Anda, dan salin <strong>URL Aplikasi Web</strong> yang dihasilkan. Aplikasi siap digunakan permanen!
                  </li>
                </ol>
              </div>

              {/* Code.gs Viewer & Copy */}
              <div className="bg-slate-900 text-slate-100 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
                <div className="px-6 py-3 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                  <span className="font-mono text-xs font-bold text-violet-400 flex items-center space-x-2">
                    <Code className="w-4 h-4" />
                    <span>Code.gs</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(CODE_GS_TEMPLATE, 'gs')}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
                  >
                    {copiedGs ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedGs ? 'Tersalin!' : 'Salin Code.gs'}</span>
                  </button>
                </div>
                <pre className="p-6 text-[11px] font-mono overflow-x-auto max-h-80 custom-scrollbar text-slate-300">
                  {CODE_GS_TEMPLATE}
                </pre>
              </div>

              {/* Index.html Viewer & Copy */}
              <div className="bg-slate-900 text-slate-100 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
                <div className="px-6 py-3 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                  <span className="font-mono text-xs font-bold text-violet-400 flex items-center space-x-2">
                    <Code className="w-4 h-4" />
                    <span>Index.html</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(INDEX_HTML_TEMPLATE, 'html')}
                    className="flex items-center space-x-1.5 px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
                  >
                    {copiedHtml ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHtml ? 'Tersalin!' : 'Salin Index.html'}</span>
                  </button>
                </div>
                <pre className="p-6 text-[11px] font-mono overflow-x-auto max-h-80 custom-scrollbar text-slate-300">
                  {INDEX_HTML_TEMPLATE}
                </pre>
              </div>
            </div>
          )}
        </main>

        {/* Status Bar / Footer */}
        <footer className="h-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-4">
            <span>v2.4.0 Stable</span>
            <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <span>Penyimpanan: Local & Apps Script Sync</span>
          </div>
          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Semua sistem berjalan normal</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
