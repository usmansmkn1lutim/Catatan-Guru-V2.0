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

export function formatDateDMY(input?: any): string {
  if (!input) return '';
  const ymd = formatDateString(input);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const [year, month, day] = ymd.split('-');
    return `${day}-${month}-${year}`;
  }
  return String(input);
}

export function formatTimeString(input?: any): string {
  if (!input) return '';
  const str = String(input).trim();
  if (!str) return '';

  // Standard clean HH:mm format
  if (/^\d{2}:\d{2}$/.test(str)) {
    return str;
  }

  // Find all time patterns (HH:mm) in the input string
  const timeMatches = Array.from(str.matchAll(/(\d{1,2}):(\d{2})/g));
  if (timeMatches.length === 1) {
    const hours = timeMatches[0][1].padStart(2, '0');
    const minutes = timeMatches[0][2];
    return `${hours}:${minutes}`;
  } else if (timeMatches.length >= 2) {
    // If input contains multiple times e.g. "Sat Dec 30 1899 08:05:00 ... - Sat Dec 30 1899 09:15:00 ..."
    const t1 = `${timeMatches[0][1].padStart(2, '0')}:${timeMatches[0][2]}`;
    const t2 = `${timeMatches[1][1].padStart(2, '0')}:${timeMatches[1][2]}`;
    return `${t1} - ${t2}`;
  }

  return str;
}

/**
 * Sanitizes all date and time fields in schedule records.
 */
export function sanitizeScheduleRecord(record: any): any {
  if (!record || typeof record !== 'object') return record;
  let start = formatTimeString(record.start || record.waktuMulai || '');
  let end = formatTimeString(record.end || record.waktuSelesai || '');

  if (start.includes(' - ')) {
    const parts = start.split(' - ');
    start = parts[0];
    if (!end || end === record.start) {
      end = parts[1];
    }
  }

  return {
    ...record,
    start: start || '07:00',
    end: end || '08:30',
  };
}

/**
 * Sanitizes an array of schedule records.
 */
export function sanitizeScheduleList(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeScheduleRecord);
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
