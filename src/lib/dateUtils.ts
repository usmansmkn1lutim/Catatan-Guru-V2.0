/**
 * Utility functions for formatting and sanitizing dates and times.
 * Prevents Google Sheets / Google Apps Script Date object string conversion issues
 * (e.g., "Wed Aug 05 2026 00:00:00 GMT+0800" or "Sat Dec 30 1899 11:05:00 GMT+0757").
 */

export function formatDateString(input?: any): string {
  if (!input) return '';
  const str = String(input).trim();
  if (!str) return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Handle ISO string e.g. "2026-08-05T00:00:00.000Z"
  if (str.includes('T')) {
    const parts = str.split('T');
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
      return parts[0];
    }
  }

  // Handle Date object string e.g. "Wed Aug 05 2026 00:00:00 GMT+0800 (Waktu Indonesia Tengah)"
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    // Guard against 1899 epoch
    if (year > 1900) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return str;
}

export function formatTimeString(input?: any): string {
  if (!input) return '';
  const str = String(input).trim();
  if (!str) return '';

  // Already HH:mm (e.g. "07:30")
  if (/^\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  // Look for HH:mm pattern in string (e.g., "11:05:00" or "Sat Dec 30 1899 11:05:00 GMT...")
  const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }

  return str;
}

/**
 * Sanitizes all date and time fields in presensi records.
 */
export function sanitizePresensiRecord(record: any): any {
  if (!record || typeof record !== 'object') return record;
  return {
    ...record,
    tanggal: formatDateString(record.tanggal),
    waktuMulai: formatTimeString(record.waktuMulai),
    waktuSelesai: formatTimeString(record.waktuSelesai),
  };
}

/**
 * Sanitizes an array of presensi records.
 */
export function sanitizePresensiList(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizePresensiRecord);
}
