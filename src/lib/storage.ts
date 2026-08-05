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
  initialDataSekolah,
  initialProfilGuru,
  initialMapelList,
  initialKelasList,
  initialSiswaList,
  initialPresensiRecords,
  initialNilaiRecords,
  initialJurnalRecords,
} from '../data/initialData';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const KEYS = {
  SEKOLAH: 'catatan_guru_sekolah_v1',
  GURU: 'catatan_guru_profil_v1',
  MAPEL: 'catatan_guru_mapel_v1',
  KELAS: 'catatan_guru_kelas_v1',
  SISWA: 'catatan_guru_siswa_v1',
  PRESENSI: 'catatan_guru_presensi_v1',
  NILAI: 'catatan_guru_nilai_v1',
  JURNAL: 'catatan_guru_jurnal_v1',
  SPREADSHEET_ID: 'catatan_guru_spreadsheet_id_v1',
  THEME: 'catatan_guru_theme_v1',
};

// Generic safe storage helper
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`catatan_guru_${key}_v1`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Error reading localStorage key:', key, e);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`catatan_guru_${key}_v1`, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage key:', key, e);
  }
}

// Data Getters & Setters
export function loadDataSekolah(): DataSekolah {
  return loadFromStorage<DataSekolah>('sekolah', initialDataSekolah);
}
export function saveDataSekolah(data: DataSekolah): void {
  saveToStorage('sekolah', data);
}

export function loadProfilGuru(): ProfilGuru {
  return loadFromStorage<ProfilGuru>('profil', initialProfilGuru);
}
export function saveProfilGuru(data: ProfilGuru): void {
  saveToStorage('profil', data);
}

export function loadMapelList(): Mapel[] {
  return loadFromStorage<Mapel[]>('mapel', initialMapelList);
}
export function saveMapelList(data: Mapel[]): void {
  saveToStorage('mapel', data);
}

export function loadKelasList(): Kelas[] {
  return loadFromStorage<Kelas[]>('kelas', initialKelasList);
}
export function saveKelasList(data: Kelas[]): void {
  saveToStorage('kelas', data);
}

export function loadSiswaList(): Siswa[] {
  return loadFromStorage<Siswa[]>('siswa', initialSiswaList);
}
export function saveSiswaList(data: Siswa[]): void {
  saveToStorage('siswa', data);
}

export function loadPresensiRecords(): PresensiRecord[] {
  return loadFromStorage<PresensiRecord[]>('presensi', initialPresensiRecords);
}
export function savePresensiRecords(data: PresensiRecord[]): void {
  saveToStorage('presensi', data);
}

export function loadNilaiRecords(): NilaiRecord[] {
  return loadFromStorage<NilaiRecord[]>('nilai', initialNilaiRecords);
}
export function saveNilaiRecords(data: NilaiRecord[]): void {
  saveToStorage('nilai', data);
}

export function loadJurnalRecords(): JurnalRecord[] {
  return loadFromStorage<JurnalRecord[]>('jurnal', initialJurnalRecords);
}
export function saveJurnalRecords(data: JurnalRecord[]): void {
  saveToStorage('jurnal', data);
}

// Google Apps Script Sync Integration
export async function saveAllAppDataToGas(allData: any): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    // Check if running inside Google Apps Script environment
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.script && (window as any).google.script.run) {
      (window as any).google.script.run
        .withSuccessHandler((response: any) => {
          resolve({ success: true, message: 'Data berhasil disinkronkan ke Google Spreadsheet!' });
        })
        .withFailureHandler((error: any) => {
          console.error('GAS save failed:', error);
          resolve({ success: false, message: 'Gagal menghubungkan ke Google Apps Script backend.' });
        })
        .saveAppData(JSON.stringify(allData));
    } else {
      // Standalone simulation save
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Data tersimpan di Local Storage & siap disinkronkan saat terhubung ke Google Apps Script!',
        });
      }, 500);
    }
  });
}

export async function loadAppDataFromGas(): Promise<any | null> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.script && (window as any).google.script.run) {
      (window as any).google.script.run
        .withSuccessHandler((rawJson: string) => {
          try {
            const data = JSON.parse(rawJson);
            resolve(data);
          } catch (e) {
            resolve(null);
          }
        })
        .withFailureHandler(() => {
          resolve(null);
        })
        .getAppData();
    } else {
      resolve(null);
    }
  });
}

// WhatsApp International Number Format Helper
export function formatWhatsAppUrl(phoneNumber: string, message?: string): string {
  if (!phoneNumber) return '#';
  let cleanNum = phoneNumber.replace(/\D/g, '');
  if (cleanNum.startsWith('0')) {
    cleanNum = '62' + cleanNum.slice(1);
  } else if (!cleanNum.startsWith('62') && cleanNum.length > 5) {
    cleanNum = '62' + cleanNum;
  }
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleanNum}${textParam}`;
}

// Excel Export Helper
export function exportToExcel(data: Record<string, any>[], fileName: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

// PDF Export Helper
export function exportToPdf(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  fileName: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title & Header Styling
  doc.setFontSize(16);
  doc.setTextColor(124, 58, 237); // Purple/Violet
  doc.text(title, 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(subtitle, 14, 22);

  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Catatan Seorang Guru`, 14, 28);

  autoTable(doc, {
    startY: 33,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237], // Purple #7c3aed
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`${fileName}.pdf`);
}
