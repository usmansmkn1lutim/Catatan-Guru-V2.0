export type ActiveTab =
  | 'dashboard'
  | 'sekolah'
  | 'profil'
  | 'konfigurasi'
  | 'mapel'
  | 'kelas'
  | 'siswa'
  | 'presensi'
  | 'nilai'
  | 'jurnal'
  | 'google_sheets'
  | 'gas_deploy';

export interface AppConfig {
  namaAplikasi: string;
  deskripsiAplikasi: string;
  logoAplikasiUrl: string;
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
  tpScores: Record<string, number>;
  uhScores: Record<string, number>;
  utsScore?: number;
  uasScore?: number;
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
