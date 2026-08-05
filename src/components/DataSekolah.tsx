import React, { useState } from 'react';
import { DataSekolah } from '../types';
import { Building2, Save, Upload, CheckCircle2 } from 'lucide-react';

interface DataSekolahProps {
  sekolah?: DataSekolah;
  dataSekolah?: DataSekolah;
  onSave?: (data: DataSekolah) => void;
  onSaveDataSekolah?: (data: DataSekolah) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DataSekolahView: React.FC<DataSekolahProps> = ({
  sekolah,
  dataSekolah,
  onSave,
  onSaveDataSekolah,
  showToast,
}) => {
  const currentSekolah = sekolah || dataSekolah || {
    npsn: '',
    namaSekolah: '',
    alamatLengkap: '',
    kelurahan: '',
    kecamatan: '',
    kabupatenKota: '',
    provinsi: '',
    nomorKontak: '',
    email: '',
    website: '',
    akreditasi: '',
    namaKepalaSekolah: '',
    logoSekolahUrl: '',
  };

  const [formData, setFormData] = useState<DataSekolah>(currentSekolah);
  const [logoPreview, setLogoPreview] = useState<string>(currentSekolah.logoSekolahUrl || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData((prev) => ({ ...prev, logoSekolahUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
    if (onSaveDataSekolah) onSaveDataSekolah(formData);
    showToast('Data Sekolah berhasil disimpan & disinkronisasi!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Sekolah</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola informasi profil satuan pendidikan yang tersimpan di Google Spreadsheet
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Logo Section */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
            Logo Sekolah
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Sekolah" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <label className="inline-flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Upload Logo (JPG / PNG)</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Disimpan secara permanen di Google Drive dan terhubung langsung ke Google Spreadsheet.
              </p>
            </div>
          </div>
        </div>

        {/* Identitas Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              NPSN
            </label>
            <input
              type="text"
              name="npsn"
              value={formData.npsn}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nama Sekolah
            </label>
            <input
              type="text"
              name="namaSekolah"
              value={formData.namaSekolah}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Alamat Lengkap
            </label>
            <textarea
              name="alamatLengkap"
              rows={2}
              value={formData.alamatLengkap}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Kelurahan / Desa
            </label>
            <input
              type="text"
              name="kelurahan"
              value={formData.kelurahan}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Kecamatan
            </label>
            <input
              type="text"
              name="kecamatan"
              value={formData.kecamatan}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Kabupaten / Kota
            </label>
            <input
              type="text"
              name="kabupatenKota"
              value={formData.kabupatenKota}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Provinsi
            </label>
            <input
              type="text"
              name="provinsi"
              value={formData.provinsi}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nomor Kontak / Telepon
            </label>
            <input
              type="text"
              name="nomorKontak"
              value={formData.nomorKontak}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Email Resmi
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Website Resmi
            </label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Akreditasi
            </label>
            <select
              name="akreditasi"
              value={formData.akreditasi}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="A (Unggul)">A (Unggul)</option>
              <option value="B (Baik)">B (Baik)</option>
              <option value="C (Cukup)">C (Cukup)</option>
              <option value="Belum Terakreditasi">Belum Terakreditasi</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nama Kepala Sekolah
            </label>
            <input
              type="text"
              name="namaKepalaSekolah"
              value={formData.namaKepalaSekolah}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-full hover:bg-violet-700 transition-colors shadow-md shadow-violet-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Data Sekolah</span>
          </button>
        </div>
      </form>
    </div>
  );
};
