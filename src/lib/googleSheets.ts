import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
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
} from '../types';

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({ prompt: 'select_account' });

let isSigningIn = false;
let cachedAccessToken: string | null = localStorage.getItem('catatan_guru_google_token');

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('catatan_guru_google_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan Access Token dari Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem('catatan_guru_google_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error?.code === 'auth/popup-closed-by-user' || String(error?.message).includes('popup-closed-by-user')) {
      throw new Error('Jendela Login Google ditutup sebelum selesai. Silakan klik "Masuk dengan Google" dan pilih akun Google Anda.');
    }
    if (error?.code === 'auth/popup-blocked' || String(error?.message).includes('popup-blocked')) {
      throw new Error('Jendela popup Login Google diblokir peramban. Harap izinkan popup di peramban (browser) Anda.');
    }
    if (error?.code === 'auth/cancelled-popup-request' || String(error?.message).includes('cancelled-popup-request')) {
      throw new Error('Permintaan login Google dibatalkan karena ada proses login lain yang sedang berjalan.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem('catatan_guru_google_token');
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Interface for Google Drive file
export interface SpreadsheetFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

// List Spreadsheets in User's Drive
export async function listUserSpreadsheets(accessToken: string): Promise<SpreadsheetFile[]> {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink,modifiedTime)&pageSize=20&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error HTTP ${res.status}: ${errText}`);
    }
    const data = await res.json();
    return data.files || [];
  } catch (err: any) {
    console.error('Gagal mengambil daftar spreadsheet:', err);
    throw err;
  }
}

// Create a new Google Spreadsheet with default sheets
export async function createSpreadsheet(accessToken: string, title: string): Promise<{ id: string; url: string }> {
  try {
    const requestBody = {
      properties: {
        title: title || 'Catatan Seorang Guru - Database Spreadsheet',
      },
      sheets: [
        { properties: { title: 'Data_Sekolah' } },
        { properties: { title: 'Profil_Guru' } },
        { properties: { title: 'Data_Mapel' } },
        { properties: { title: 'Data_Kelas' } },
        { properties: { title: 'Data_Siswa' } },
        { properties: { title: 'Data_Presensi' } },
        { properties: { title: 'Data_Nilai' } },
        { properties: { title: 'Data_Jurnal' } },
        { properties: { title: 'Jadwal_Settings' } },
        { properties: { title: 'Jadwal_Mengajar' } },
      ],
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gagal membuat Spreadsheet: ${errText}`);
    }

    const data = await res.json();
    return {
      id: data.spreadsheetId,
      url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    };
  } catch (err: any) {
    console.error('Error createSpreadsheet:', err);
    throw err;
  }
}

// Batch write application data to Google Sheets
export async function exportToGoogleSheets(
  spreadsheetId: string,
  accessToken: string,
  data: {
    appConfig?: AppConfig;
    dataSekolah: DataSekolah;
    profilGuru: ProfilGuru;
    mapelList: Mapel[];
    kelasList: Kelas[];
    siswaList: Siswa[];
    presensiList: PresensiRecord[];
    scheduleList?: any[];
    scheduleConfig?: any;
    nilaiList: NilaiRecord[];
    jurnalList: JurnalRecord[];
  }
) {
  try {
    // 0. Ensure all required sheets exist
    const requiredSheets = ['Data_Sekolah', 'Profil_Guru', 'Data_Mapel', 'Data_Kelas', 'Data_Siswa', 'Data_Presensi', 'Data_Nilai', 'Data_Jurnal', 'Jadwal_Settings', 'Jadwal_Mengajar'];
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      const existingTitles = metaData.sheets.map((s: any) => s.properties.title);
      const missingSheets = requiredSheets.filter(title => !existingTitles.includes(title));
      if (missingSheets.length > 0) {
        const addSheetRequests = missingSheets.map(title => ({ addSheet: { properties: { title } } }));
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: addSheetRequests })
        });
      }
    }

    // 1. Prepare sheet data rows
    const dataSekolahRows = [
      ['KEY', 'VALUE'],
      ['NPSN', data.dataSekolah.npsn],
      ['Nama Sekolah', data.dataSekolah.namaSekolah],
      ['Alamat Lengkap', data.dataSekolah.alamatLengkap],
      ['Kelurahan', data.dataSekolah.kelurahan],
      ['Kecamatan', data.dataSekolah.kecamatan],
      ['Kabupaten / Kota', data.dataSekolah.kabupatenKota],
      ['Provinsi', data.dataSekolah.provinsi],
      ['Nomor Kontak', data.dataSekolah.nomorKontak],
      ['Email', data.dataSekolah.email],
      ['Website', data.dataSekolah.website],
      ['Akreditasi', data.dataSekolah.akreditasi],
      ['Nama Kepala Sekolah', data.dataSekolah.namaKepalaSekolah],
      ['Logo Sekolah URL', data.dataSekolah.logoSekolahUrl || ''],
      ['APP_NAMA', data.appConfig?.namaAplikasi || ''],
      ['APP_DESKRIPSI', data.appConfig?.deskripsiAplikasi || ''],
      ['APP_LOGO', data.appConfig?.logoAplikasiUrl || ''],
      ['APP_BG_IMAGE', data.appConfig?.customBgImage || ''],
      ['APP_BG_STYLE', data.appConfig?.customBgStyle || ''],
      ['APP_BG_OPACITY', data.appConfig?.customBgOpacity?.toString() || ''],
    ];

    const profilGuruRows = [
      ['KEY', 'VALUE'],
      ['Nama Guru', data.profilGuru.namaGuru],
      ['NIP', data.profilGuru.nip],
      ['NUPTK', data.profilGuru.nuptk],
      ['Jenis Kelamin', data.profilGuru.jenisKelamin],
      ['Tempat Lahir', data.profilGuru.tempatLahir],
      ['Tanggal Lahir', data.profilGuru.tanggalLahir],
      ['Nomor HP', data.profilGuru.nomorHp],
      ['Email', data.profilGuru.email],
      ['Alamat', data.profilGuru.alamat],
      ['Foto Profil URL', data.profilGuru.fotoProfilUrl || ''],
    ];

    const mapelRows = [
      ['ID', 'Kode Mapel', 'Nama Mapel', 'Tingkat Kelas', 'Fase', 'Beban Jam (JP)', 'KKM/KKTP'],
      ...data.mapelList.map((m) => [
        m.id,
        m.kodeMapel,
        m.namaMapel,
        m.tingkatKelas,
        m.fase,
        m.bebanJam,
        m.kkm,
      ]),
    ];

    const kelasRows = [
      ['ID', 'Nama Kelas', 'Wali Kelas', 'Ruangan'],
      ...data.kelasList.map((k) => [k.id, k.namaKelas, k.waliKelas, k.ruangan]),
    ];

    const siswaRows = [
      ['ID', 'NISN', 'NIS', 'Nama Lengkap', 'JK', 'Kelas', 'Tempat Lahir', 'Tanggal Lahir', 'Alamat', 'Orang Tua', 'Kontak Ortu'],
      ...data.siswaList.map((s) => [
        s.id,
        s.nisn,
        s.nis,
        s.namaLengkap,
        s.jenisKelamin,
        s.namaKelas,
        s.tempatLahir,
        s.tanggalLahir,
        s.alamat,
        s.namaOrangTua,
        s.kontakOrangTua,
      ]),
    ];

    const presensiRows = [
      ['ID', 'Tanggal', 'Kelas', 'Kode Mapel', 'Nama Mapel', 'Pertemuan', 'Hadir', 'Sakit', 'Izin', 'Alpha'],
      ...data.presensiList.map((p) => [
        p.id,
        p.tanggal,
        p.kelas,
        p.kodeMapel,
        p.namaMapel,
        p.pertemuanKe,
        p.summary?.hadir ?? (p.summary as any)?.Hadir ?? 0,
        p.summary?.sakit ?? (p.summary as any)?.Sakit ?? 0,
        p.summary?.izin ?? (p.summary as any)?.Izin ?? 0,
        p.summary?.alpha ?? (p.summary as any)?.Alpha ?? 0,
      ]),
    ];

    const nilaiRows = [
      ['ID', 'Tanggal', 'Kelas', 'Kode Mapel', 'Nama Mapel', 'KKM', 'Jumlah Siswa'],
      ...data.nilaiList.map((n) => [
        n.id,
        n.tanggal,
        n.kelas,
        n.kodeMapel,
        n.namaMapel,
        n.kkm,
        n.items?.length || 0,
      ]),
    ];

    const jurnalRows = [
      ['ID', 'Tanggal', 'Kode Mapel', 'Nama Mapel', 'Kelas', 'Jam Ke', 'Materi', 'Catatan Kendala'],
      ...data.jurnalList.map((j) => [
        j.id,
        j.tanggal,
        j.kodeMapel,
        j.namaMapel,
        j.kelas,
        j.jamKe,
        j.materiPembelajaran,
        j.catatanKendala,
      ]),
    ];

    const jadwalSettingsRows = [
      ['Nama Guru', 'TahunAjaran', 'Semester', 'Sistem', 'TanggalMulai', 'Status'],
      [
        data.profilGuru.namaGuru,
        data.scheduleConfig?.academicYear || '',
        data.scheduleConfig?.semester || '',
        data.scheduleConfig?.systemType || '',
        data.scheduleConfig?.anchorDate || '',
        'Aktif',
      ],
    ];

    const jadwalMengajarRows = [
      ['Nama Guru', 'Sistem', 'Siklus', 'Hari', 'JamMulai', 'JamSelesai', 'Kelas', 'Mapel', 'Ruang'],
      ...(data.scheduleList || []).map((s) => [
        data.profilGuru.namaGuru,
        data.scheduleConfig?.systemType || 'REGULER',
        s.cycle || 'Reguler',
        s.day || '',
        s.start || '',
        s.end || '',
        s.class || '',
        s.subject || '',
        s.room || '',
      ]),
    ];

    const payload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: 'Data_Sekolah!A1', values: dataSekolahRows },
        { range: 'Profil_Guru!A1', values: profilGuruRows },
        { range: 'Data_Mapel!A1', values: mapelRows },
        { range: 'Data_Kelas!A1', values: kelasRows },
        { range: 'Data_Siswa!A1', values: siswaRows },
        { range: 'Data_Presensi!A1', values: presensiRows },
        { range: 'Data_Nilai!A1', values: nilaiRows },
        { range: 'Data_Jurnal!A1', values: jurnalRows },
        { range: 'Jadwal_Settings!A1', values: jadwalSettingsRows },
        { range: 'Jadwal_Mengajar!A1', values: jadwalMengajarRows },
      ],
    };

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gagal menulis ke Google Sheets: ${errText}`);
    }

    return true;
  } catch (err: any) {
    console.error('Error exportToGoogleSheets:', err);
    throw err;
  }
}

// Import/Fetch values from Google Sheets
export async function importFromGoogleSheets(spreadsheetId: string, accessToken: string) {
  try {
    const ranges = [
      'Data_Sekolah!A1:B30',
      'Profil_Guru!A1:B30',
      'Data_Mapel!A2:H100',
      'Data_Kelas!A2:D100',
      'Data_Siswa!A2:K500',
      'Jadwal_Settings!A2:F2',
      'Jadwal_Mengajar!A2:I1000',
    ];

    const rangesQuery = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gagal membaca data dari Google Sheets: ${errText}`);
    }

    const result = await res.json();
    const valueRanges = result.valueRanges || [];

    // Parse Data Sekolah
    const dsValues = valueRanges[0]?.values || [];
    const dsObj: Record<string, string> = {};
    dsValues.forEach((row: string[]) => {
      if (row[0] && row[1]) dsObj[row[0]] = row[1];
    });

    // Parse Profil Guru
    const pgValues = valueRanges[1]?.values || [];
    const pgObj: Record<string, string> = {};
    pgValues.forEach((row: string[]) => {
      if (row[0] && row[1]) pgObj[row[0]] = row[1];
    });

    // Parse Mapel
    const mapelValues = valueRanges[2]?.values || [];
    const mapelList: Mapel[] = mapelValues.map((r: string[], idx: number) => ({
      id: r[0] || `m_${idx}`,
      kodeMapel: r[1] || '',
      namaMapel: r[2] || '',
      tingkatKelas: r[3] || 'XII',
      fase: r[4] || 'F',
      bebanJam: Number(r[5]) || 4,
      kkm: Number(r[6]) || 75,
    }));

    // Parse Kelas
    const kelasValues = valueRanges[3]?.values || [];
    const kelasList: Kelas[] = kelasValues.map((r: string[], idx: number) => ({
      id: r[0] || `k_${idx}`,
      namaKelas: r[1] || '',
      waliKelas: r[2] || '',
      ruangan: r[3] || '',
    }));

    // Parse Siswa
    const siswaValues = valueRanges[4]?.values || [];
    const siswaList: Siswa[] = siswaValues.map((r: string[], idx: number) => ({
      id: r[0] || `s_${idx}`,
      nisn: r[1] || '',
      nis: r[2] || '',
      namaLengkap: r[3] || '',
      jenisKelamin: (r[4] as 'L' | 'P') || 'L',
      namaKelas: r[5] || '',
      tempatLahir: r[6] || '',
      tanggalLahir: r[7] || '',
      alamat: r[8] || '',
      namaOrangTua: r[9] || '',
      kontakOrangTua: r[10] || '',
    }));

    // Parse Jadwal Settings
    const scheduleConfigValues = valueRanges[5]?.values || [];
    let scheduleConfig: any = null;
    if (scheduleConfigValues.length > 0) {
      const r = scheduleConfigValues[0];
      scheduleConfig = {
        academicYear: r[1] || '',
        semester: r[2] || 'Ganjil',
        systemType: r[3] || 'REGULER',
        anchorDate: r[4] || '',
      };
    }

    // Parse Jadwal Mengajar
    const scheduleListValues = valueRanges[6]?.values || [];
    const scheduleList: any[] = scheduleListValues.map((r: string[], idx: number) => ({
      id: `gas_${idx}`,
      cycle: r[2] || 'Reguler',
      day: r[3] || '',
      start: r[4] || '',
      end: r[5] || '',
      class: r[6] || '',
      subject: r[7] || '',
      room: r[8] || '',
    })).filter(s => s.subject && s.class);

    return {
      dataSekolah: Object.keys(dsObj).length > 0 ? {
        npsn: dsObj['NPSN'] || '',
        namaSekolah: dsObj['Nama Sekolah'] || '',
        alamatLengkap: dsObj['Alamat Lengkap'] || '',
        kelurahan: dsObj['Kelurahan'] || '',
        kecamatan: dsObj['Kecamatan'] || '',
        kabupatenKota: dsObj['Kabupaten / Kota'] || '',
        provinsi: dsObj['Provinsi'] || '',
        nomorKontak: dsObj['Nomor Kontak'] || '',
        email: dsObj['Email'] || '',
        website: dsObj['Website'] || '',
        akreditasi: dsObj['Akreditasi'] || 'A',
        namaKepalaSekolah: dsObj['Nama Kepala Sekolah'] || '',
        logoSekolahUrl: dsObj['Logo Sekolah URL'] || dsObj['Logo Sekolah'] || dsObj['Logo URL'] || '',
      } : null,
      profilGuru: Object.keys(pgObj).length > 0 ? {
        namaGuru: pgObj['Nama Guru'] || '',
        nip: pgObj['NIP'] || '',
        nuptk: pgObj['NUPTK'] || '',
        jenisKelamin: (pgObj['Jenis Kelamin'] as 'L' | 'P') || 'L',
        tempatLahir: pgObj['Tempat Lahir'] || '',
        tanggalLahir: pgObj['Tanggal Lahir'] || '',
        nomorHp: pgObj['Nomor HP'] || '',
        email: pgObj['Email'] || '',
        alamat: pgObj['Alamat'] || '',
        fotoProfilUrl: pgObj['Foto Profil URL'] || pgObj['Foto Profil'] || pgObj['Foto URL'] || '',
      } : null,
      appConfig: Object.keys(dsObj).length > 0 ? {
        namaAplikasi: dsObj['APP_NAMA'] || '',
        deskripsiAplikasi: dsObj['APP_DESKRIPSI'] || '',
        logoAplikasiUrl: dsObj['APP_LOGO'] || '',
        customBgImage: dsObj['APP_BG_IMAGE'] || '',
        customBgStyle: dsObj['APP_BG_STYLE'] || '',
        customBgOpacity: dsObj['APP_BG_OPACITY'] ? parseFloat(dsObj['APP_BG_OPACITY']) : undefined,
      } : null,
      mapelList: mapelList.filter((m) => m.namaMapel),
      kelasList: kelasList.filter((k) => k.namaKelas),
      siswaList: siswaList.filter((s) => s.namaLengkap),
      scheduleList: scheduleList.length > 0 ? scheduleList : null,
      scheduleConfig: scheduleConfig,
    };
  } catch (err: any) {
    console.error('Error importFromGoogleSheets:', err);
    throw err;
  }
}
