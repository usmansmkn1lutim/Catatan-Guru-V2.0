import React, { useState } from 'react';
import { ProfilGuru } from '../types';
import { UserCheck, Save, Upload, User } from 'lucide-react';

interface ProfilGuruProps {
  guru?: ProfilGuru;
  profilGuru?: ProfilGuru;
  onSave?: (data: ProfilGuru) => void;
  onSaveProfilGuru?: (data: ProfilGuru) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ProfilGuruView: React.FC<ProfilGuruProps> = ({
  guru,
  profilGuru,
  onSave,
  onSaveProfilGuru,
  showToast,
}) => {
  const currentGuru = guru || profilGuru || {
    namaGuru: '',
    nip: '',
    nuptk: '',
    jenisKelamin: 'L',
    tempatLahir: '',
    tanggalLahir: '',
    nomorHp: '',
    email: '',
    alamat: '',
    fotoProfilUrl: '',
  };

  const [formData, setFormData] = useState<ProfilGuru>(currentGuru);
  const [fotoPreview, setFotoPreview] = useState<string>(currentGuru.fotoProfilUrl || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFotoPreview(result);
        setFormData((prev) => ({ ...prev, fotoProfilUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
    if (onSaveProfilGuru) onSaveProfilGuru(formData);
    showToast('Profil Guru berhasil diperbarui!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profil Guru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola biodata dan foto profil pendidik yang ditampilkan di header aplikasi
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Foto Profil Section */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
            Foto Profil Guru
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-violet-500/20">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto Profil Guru" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <label className="inline-flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-full hover:bg-violet-700 transition-colors cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Upload Foto (JPG / PNG)</span>
                <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gunakan foto formal rasio 1:1. Foto tersimpan otomatis di Google Drive.
              </p>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nama Lengkap & Gelar
            </label>
            <input
              type="text"
              name="namaGuru"
              value={formData.namaGuru}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              NIP (Nomor Induk Pegawai)
            </label>
            <input
              type="text"
              name="nip"
              value={formData.nip}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              NUPTK
            </label>
            <input
              type="text"
              name="nuptk"
              value={formData.nuptk}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Jenis Kelamin
            </label>
            <select
              name="jenisKelamin"
              value={formData.jenisKelamin}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Tempat Lahir
            </label>
            <input
              type="text"
              name="tempatLahir"
              value={formData.tempatLahir}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Tanggal Lahir
            </label>
            <input
              type="date"
              name="tanggalLahir"
              value={formData.tanggalLahir}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Nomor Handphone / WhatsApp
            </label>
            <input
              type="text"
              name="nomorHp"
              value={formData.nomorHp}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Email Pribadi / Edu
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Alamat Domisili
            </label>
            <textarea
              name="alamat"
              rows={2}
              value={formData.alamat}
              onChange={handleChange}
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
            <span>Simpan Profil Guru</span>
          </button>
        </div>
      </form>
    </div>
  );
};
