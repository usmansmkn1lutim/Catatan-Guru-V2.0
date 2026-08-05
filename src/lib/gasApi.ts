/**
 * Helper API untuk berkomunikasi langsung dengan Google Apps Script (GAS) Web App
 * Mencegah masalah OAuth popup, token expired, dan blokir browser iframe.
 */

export interface GasSyncPayload {
  dataSekolah?: any;
  profilGuru?: any;
  mapelList?: any[];
  kelasList?: any[];
  siswaList?: any[];
  presensiList?: any[];
  nilaiList?: any[];
  jurnalList?: any[];
  appConfig?: any;
}

const GAS_URL_KEY = 'catatan_guru_gas_url_v1';

export function getStoredGasUrl(): string {
  try {
    return localStorage.getItem(GAS_URL_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setStoredGasUrl(url: string): void {
  try {
    localStorage.setItem(GAS_URL_KEY, url.trim());
  } catch (e) {
    console.error('Error saving GAS URL:', e);
  }
}

/**
 * Mengirim request ke Google Apps Script Web App Endpoint.
 * Menggunakan mode text/plain untuk menghindari batasan preflight CORS pada GAS.
 */
async function callGasEndpoint(url: string, payload: any): Promise<any> {
  const trimmedUrl = url ? url.trim() : '';

  if (!trimmedUrl) {
    throw new Error('URL Google Apps Script belum dimasukkan.');
  }

  if (trimmedUrl.includes('docs.google.com/spreadsheets')) {
    throw new Error('URL yang Anda masukkan adalah URL Google Spreadsheet. Harap masukkan URL Web App Apps Script (yang berakhiran /exec).');
  }

  if (trimmedUrl.includes('/edit') || trimmedUrl.includes('/d/')) {
    throw new Error('URL yang Anda masukkan adalah URL Editor Apps Script. Harap gunakan URL Web App hasil Deploy (klik Deploy > New Deployment > Web app, salin URL yang berakhiran /exec).');
  }

  if (trimmedUrl.endsWith('/dev')) {
    throw new Error('URL berakhiran /dev tidak bisa diakses publik. Harap gunakan URL hasil Deploy yang berakhiran /exec.');
  }

  if (!trimmedUrl.startsWith('https://script.google.com/')) {
    throw new Error('URL Google Apps Script harus diawali dengan https://script.google.com/');
  }

  try {
    const response = await fetch(trimmedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      const match = text.match(/Exception: (.*?)(<\/body>|<br|\n)/i) || text.match(/<div class="errorMessage"[^>]*>([\s\S]*?)<\/div>/i);
      const errDetail = match ? match[1].replace(/<[^>]+>/g, '').trim() : '';
      if (errDetail) {
        throw new Error(`Error pada Google Apps Script: ${errDetail}`);
      }
      throw new Error(
        'Akses ditolak atau error pada Google Apps Script. Pastikan saat Deploy Web App, pengaturan "Who has access" (Siapa yang memiliki akses) diatur ke "Anyone" (Siapa saja).'
      );
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Respon dari GAS bukan JSON valid: ${text.slice(0, 150)}`);
    }

    if (json && json.status === 'error') {
      throw new Error(json.message || 'Error pada Google Apps Script');
    }

    return json;
  } catch (err: any) {
    console.error('GAS Call Failed:', err);
    const msg = String(err?.message || err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('TypeError')) {
      throw new Error(
        'Koneksi Gagal (Failed to fetch).\n\n' +
        'Penyebab & Solusi Utama:\n' +
        '1. Pengaturan "Who has access" (Siapa yang memiliki akses) BELUM diubah menjadi "Anyone" (Siapa Saja) saat Deploy.\n' +
        '2. Anda belum menyelesaikan langkah "Authorize Access" (Izin Akses Google) saat Deploy.\n' +
        '3. Pastikan URL hasil Deploy berakhiran "/exec", BUKAN "/dev" atau link Spreadsheet.'
      );
    }
    throw new Error(msg || 'Gagal menghubungi Google Apps Script Web App');
  }
}

/**
 * Menguji koneksi URL Google Apps Script Web App
 */
export async function testGasConnection(url: string): Promise<boolean> {
  const trimmedUrl = url ? url.trim() : '';

  // 1. Try POST ping first
  try {
    const result = await callGasEndpoint(trimmedUrl, { action: 'ping' });
    if (result && result.status === 'success') return true;
  } catch (e) {
    // 2. Try GET ping fallback
    try {
      const pingUrl = trimmedUrl + (trimmedUrl.includes('?') ? '&' : '?') + 'action=ping';
      const res = await fetch(pingUrl, { method: 'GET', redirect: 'follow' });
      if (res.ok) {
        const text = await res.text();
        const json = JSON.parse(text);
        if (json && json.status === 'success') return true;
      }
    } catch (getErr) {
      // Ignore GET error and propagate primary error
    }
    throw e;
  }
  return false;
}

/**
 * Menyimpan / Sinkronisasi seluruh data ke Google Spreadsheet via GAS
 */
export async function saveAppDataToGasUrl(url: string, data: GasSyncPayload): Promise<any> {
  return await callGasEndpoint(url, {
    action: 'save',
    data: data,
  });
}

/**
 * Membaca / Mengimpor data dari Google Spreadsheet via GAS
 */
export async function loadAppDataFromGasUrl(url: string): Promise<GasSyncPayload | null> {
  const result = await callGasEndpoint(url, {
    action: 'load',
  });
  if (result && result.status === 'success' && result.data) {
    return result.data;
  }
  return null;
}
