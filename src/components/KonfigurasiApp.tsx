import React, { useState } from 'react';
import { AppConfig } from '../types';
import { Sliders, Save, Upload, RotateCcw, Image as ImageIcon, Sparkles } from 'lucide-react';

interface KonfigurasiAppProps {
  appConfig: AppConfig;
  onSaveAppConfig: (config: AppConfig) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const KonfigurasiAppView: React.FC<KonfigurasiAppProps> = ({
  appConfig,
  onSaveAppConfig,
  showToast,
}) => {
  const [formData, setFormData] = useState<AppConfig>(appConfig);
  const [logoPreview, setLogoPreview] = useState<string>(appConfig.logoAplikasiUrl || '');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (jpg, png, svg, etc.)
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.svg')) {
        showToast('Format file harus JPG, PNG, atau SVG', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData((prev) => ({ ...prev, logoAplikasiUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    setLogoPreview('');
    setFormData((prev) => ({ ...prev, logoAplikasiUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaAplikasi.trim()) {
      showToast('Nama aplikasi tidak boleh kosong', 'error');
      return;
    }
    onSaveAppConfig(formData);
    showToast('Konfigurasi aplikasi berhasil diperbarui!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Konfigurasi Aplikasi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Atur nama, deskripsi, dan logo aplikasi sesuai kebutuhan instansi / personal Anda
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm"
      >
        {/* Logo Configuration */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
            Logo Aplikasi
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo Aplikasi"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-[10px] font-bold mt-1">Default Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <label className="inline-flex items-center space-x-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-violet-500/20">
                  <Upload className="w-4 h-4" />
                  <span>Upload Logo (JPG / PNG / SVG)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml,image/webp,.jpg,.jpeg,.png,.svg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Gunakan Logo Default</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Format yang didukung: <strong className="text-slate-700 dark:text-slate-300">JPG, PNG, atau SVG</strong>. Ukuran direkomendasikan rasio 1:1 (persegi). Logo akan ditampilkan pada Sidebar dan Navigasi Header.
              </p>
            </div>
          </div>
        </div>

        {/* Name & Description Inputs */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Nama Aplikasi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="namaAplikasi"
              value={formData.namaAplikasi}
              onChange={handleChange}
              placeholder="Contoh: Catatan Guru, SiGuru Mandiri, dll."
              required
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Deskripsi / Subtitle Aplikasi
            </label>
            <input
              type="text"
              name="deskripsiAplikasi"
              value={formData.deskripsiAplikasi}
              onChange={handleChange}
              placeholder="Contoh: Administrasi & Catatan Mengajar Guru"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Pratinjau Tampilan Sidebar</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3 max-w-sm">
            {logoPreview ? (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs">
                <img
                  src={logoPreview}
                  alt="Preview"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden">
                S
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                {formData.namaAplikasi || 'Catatan Guru'}
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider truncate">
                {formData.deskripsiAplikasi || 'Administrasi'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Konfigurasi</span>
          </button>
        </div>
      </form>
    </div>
  );
};
