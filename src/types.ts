export type ActiveTab =
  | 'dashboard'
  | 'sekolah'
  | 'profil'
  | 'konfigurasi'
  | 'mapel'
  | 'kelas'
  | 'siswa'
  | 'jadwal'
  | 'presensi'
  | 'nilai'
  | 'jurnal'
  | 'google_sheets'
  | 'gas_deploy'
  | 'administrasi_menu'
  | 'akademik_menu'
  | 'setting_menu'
  | 'tampilan';

export type VisualStyle = 'solid' | 'glass';

export interface AppConfig {
  namaAplikasi: string;
  deskripsiAplikasi: string;
  logoAplikasiUrl: string;
  customBgImage?: string;
  customBgStyle?: string;
  customBgOpacity?: number;
}

export interface DataSekolah {
  npsn: string;
  namaSekolah: string;
  alamatLengkap: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  nomorKontak: string;
  email: string;
  website: string;
  akreditasi: string;
  namaKepalaSekolah: string;
  logoSekolahUrl: string;
}

export interface ProfilGuru {
  namaGuru: string;
  nip: string;
  nuptk: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  nomorHp: string;
  email: string;
  alamat: string;
  fotoProfilUrl: string;
}

export interface TujuanPembelajaran {
  id: string;
  kodeTp: string;
  deskripsi: string;
}

export type TPItem = TujuanPembelajaran;

export interface CapaianPembelajaran {
  id: string;
  kodeCp: string;
  deskripsi: string;
  tujuanPembelajaran: TujuanPembelajaran[];
}
export type CPItem = CapaianPembelajaran;


export interface Mapel {
  id: string;
  kodeMapel: string;
  namaMapel: string;
  jenjang?: string;
  tingkatKelas: string;
  fase: string;
  bebanJam: number;
  kkm: number;
  capaianPembelajaran: CapaianPembelajaran[];
}

export interface Kelas {
  id: string;
  namaKelas: string;
  waliKelas: string;
  ruangan: string;
}

export interface Siswa {
  id: string;
  nisn: string;
  nis: string;
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  namaKelas: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  namaOrangTua: string;
  kontakOrangTua: string;
}

export type PresensiStatus = 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpha';
export type StatusPresensi = PresensiStatus;

export interface PresensiItem {
  siswaId: string;
  nisn: string;
  namaSiswa: string;
  status: PresensiStatus;
  catatan?: string;
}
export type ItemPresensiSiswa = PresensiItem;


export interface PresensiSummary {
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alpha: number;
  totalSiswa: number;
}

export interface PresensiRecord {
  id: string;
  tanggal: string;
  kelas: string;
  kodeMapel: string;
  namaMapel: string;
  pertemuanKe: number;
  waktuMulai: string;
  waktuSelesai: string;
  catatanGlobal?: string;
  items: PresensiItem[];
  summary: PresensiSummary;
}

export interface NilaiItem {
  siswaId: string;
  nisn: string;
  namaSiswa: string;
  tpScores: Record<string, number | string>;
  uhScores: Record<string, number | string>;
  utsScore?: number | string;
  uasScore?: number | string;
  rataRata: number;
  isTuntas: boolean;
}
export type NilaiItemSiswa = NilaiItem;


export interface NilaiRecord {
  id: string;
  tanggal: string;
  kelas: string;
  kodeMapel: string;
  namaMapel: string;
  kkm: number;
  items: NilaiItem[];
}

export interface JurnalRecord {
  id: string;
  tanggal: string;
  kodeMapel: string;
  namaMapel: string;
  kelas: string;
  jamKe: string;
  pertemuanKe: number;
  materiPembelajaran: string;
  tujuanPembelajaran: string;
  prosesPembelajaran: string;
  catatanKendala: string;
  jumlahHadir: number;
  jumlahTidakHadir: number;
}

export type ScheduleCycle = 'Reguler' | 'A' | 'B';
export type ScheduleSystemType = 'REGULER' | 'BLOK';
export type ScheduleDay = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface JadwalRecord {
  id: string;
  cycle: ScheduleCycle;
  day: ScheduleDay;
  period: string; // e.g. "1 - 2"
  start: string; // "07:15"
  end: string; // "08:45"
  subject: string; // "Bahasa Inggris"
  kodeMapel?: string;
  class: string; // "X TKR 1"
  room?: string; // "Ruang 3"
  jpm: number; // 2
  catatan?: string;
}

export interface ScheduleConfig {
  systemType: ScheduleSystemType;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  anchorDate: string; // '2026-07-13'
  cyclePattern: 'A_FIRST' | 'B_FIRST';
  activeDays: string[];
}
