import React, { useState, useEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Trash2,
  Upload,
  Eye,
  CheckCircle2,
  Maximize2,
  Layers,
  Type,
  Sun,
  Moon,
  Sparkle,
} from 'lucide-react';

interface AppearanceLayoutProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  setDarkMode?: (dark: boolean) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export type BgStyleType = 'cover' | 'fill' | 'stretch' | 'center' | 'contain' | 'repeat';

export const AppearanceLayout: React.FC<AppearanceLayoutProps> = ({
  darkMode = false,
  onToggleDarkMode,
  setDarkMode,
  onShowToast,
}) => {
  // State for Appearance & Layout
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('app_font_size');
    return saved ? parseInt(saved, 10) : 16;
  });

  const [glassBlur, setGlassBlur] = useState<number>(() => {
    const saved = localStorage.getItem('glass_blur');
    return saved !== null ? parseInt(saved, 10) : 16;
  });

  const [glassOpacity, setGlassOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('glass_opacity');
    return saved !== null ? parseFloat(saved) : 0.65;
  });

  // State for Custom Background
  const [bgImage, setBgImage] = useState<string>(() => {
    return localStorage.getItem('app_custom_bg_image') || '';
  });

  const [bgStyle, setBgStyle] = useState<BgStyleType>(() => {
    return (localStorage.getItem('app_custom_bg_style') as BgStyleType) || 'cover';
  });

  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('app_custom_bg_opacity');
    return saved !== null ? parseFloat(saved) : 0.85;
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply CSS variables to root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-font-size', `${fontSize}px`);
    root.style.setProperty('--glass-blur', `${glassBlur}px`);
    root.style.setProperty('--glass-opacity', glassOpacity.toString());
    root.style.setProperty('--bg-opacity', bgOpacity.toString());

    // Save to localStorage
    localStorage.setItem('app_font_size', fontSize.toString());
    localStorage.setItem('glass_blur', glassBlur.toString());
    localStorage.setItem('glass_opacity', glassOpacity.toString());
    localStorage.setItem('app_custom_bg_opacity', bgOpacity.toString());
    localStorage.setItem('app_custom_bg_style', bgStyle);

    // Dispatch a custom event so App.tsx can update its background image seamlessly
    window.dispatchEvent(
      new CustomEvent('app_appearance_changed', {
        detail: { fontSize, glassBlur, glassOpacity, bgImage, bgStyle, bgOpacity },
      })
    );
  }, [fontSize, glassBlur, glassOpacity, bgOpacity, bgStyle, bgImage]);

  // Handle Mode Change
  const handleSelectMode = (isDark: boolean) => {
    if (setDarkMode) {
      setDarkMode(isDark);
    } else if (onToggleDarkMode && isDark !== darkMode) {
      onToggleDarkMode();
    }
    if (onShowToast) {
      onShowToast(
        isDark ? 'Mode Dark Glassmorphism aktif!' : 'Mode Light Glassmorphism aktif!',
        'success'
      );
    }
  };

  // Handle File Upload
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      if (onShowToast) onShowToast('Harap pilih file gambar (JPG, PNG, WebP, SVG, dll)', 'error');
      return;
    }

    // Limit check for localStorage (~5MB warning)
    if (file.size > 7 * 1024 * 1024) {
      if (onShowToast) onShowToast('Ukuran gambar terlalu besar (maksimal 7MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setBgImage(result);
        try {
          localStorage.setItem('app_custom_bg_image', result);
          if (onShowToast) onShowToast('Foto background berhasil diterapkan!', 'success');
        } catch (err) {
          if (onShowToast) onShowToast('Gagal menyimpan foto ke memori lokal browser (kuota penuh).', 'error');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveBg = () => {
    setBgImage('');
    localStorage.removeItem('app_custom_bg_image');
    if (onShowToast) onShowToast('Foto background berhasil dihapus.', 'success');
  };

  const handleResetGlass = () => {
    setGlassBlur(16);
    setGlassOpacity(0.65);
    setFontSize(16);
    if (onShowToast) onShowToast('Efek kaca dan ukuran font dikembalikan ke default!', 'success');
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Header Banner with Light & Dark Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/70 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/15 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-400/30 text-blue-600 dark:text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalisasi Tampilan & Antarmuka</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Appearance & Layout
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
              Pilih mode tema <strong>Light Glassmorphism</strong> atau <strong>Dark Glassmorphism</strong>, sesuaikan ukuran tipografi, intensitas blur kaca, serta pasang foto latar belakang kustom.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleResetGlass}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/60 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white border border-slate-200 dark:border-white/20 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>
      </div>

      {/* THEME MODE SELECTOR: Light Glassmorphism vs Dark Glassmorphism */}
      <div className="rounded-3xl p-6 sm:p-7 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/70 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-400/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Pilihan Mode Tema Glassmorphism
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih estetika kaca transparan sesuai kenyamanan visual Anda
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20">
            Aktif: {darkMode ? 'Dark Glassmorphism' : 'Light Glassmorphism'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Option 1: Light Glassmorphism */}
          <button
            type="button"
            onClick={() => handleSelectMode(false)}
            className={`relative p-5 rounded-2xl border transition-all text-left flex flex-col justify-between group ${
              !darkMode
                ? 'bg-white/80 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                : 'bg-white/30 hover:bg-white/50 border-white/60 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 dark:border-white/10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Light Glassmorphism
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Mode Terang (Frosted Crystal)</p>
                  </div>
                </div>
                {!darkMode && (
                  <span className="flex items-center space-x-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dipilih</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tampilan kaca putih transparan (*frosted glass*), bingkai putih lembut, dan teks gelap berkontras tinggi untuk penggunaan siang hari.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
              <span>Klik untuk terapkan</span>
              <Sparkle className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Option 2: Dark Glassmorphism */}
          <button
            type="button"
            onClick={() => handleSelectMode(true)}
            className={`relative p-5 rounded-2xl border transition-all text-left flex flex-col justify-between group ${
              darkMode
                ? 'bg-slate-900/90 border-violet-500 ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/20'
                : 'bg-white/30 hover:bg-white/50 border-white/60 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 dark:border-white/10'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-950/80 text-violet-400 border border-violet-700/50 flex items-center justify-center shadow-sm">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Dark Glassmorphism
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Mode Gelap (Obsidian Glass)</p>
                  </div>
                </div>
                {darkMode && (
                  <span className="flex items-center space-x-1 text-xs font-bold text-violet-300 bg-violet-950/80 px-2.5 py-0.5 rounded-full border border-violet-700/50">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dipilih</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tampilan kaca hitam kosmik (*deep obsidian*), pendaran aksen neon lembut, dan tipografi putih bersih untuk kenyamanan mata.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-violet-600 dark:text-violet-400">
              <span>Klik untuk terapkan</span>
              <Sparkle className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARD 1: Appearance & Layout (Font & Dual Glass Sliders) */}
        <div className="flex flex-col justify-between rounded-3xl p-6 sm:p-7 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/70 dark:border-white/20 hover:border-blue-500/40 transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-6">
          <div className="space-y-6">
            {/* Card Title */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-600/30 border border-blue-500/20 dark:border-blue-400/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-md">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                    Tipografi & Efek Kaca
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Atur ukuran font dasar dan intensitas glassmorphism</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-blue-400/30">
                CSS Root
              </span>
            </div>

            {/* Section 1: Ukuran Font Keseluruhan (12px - 120px) */}
            <div className="space-y-3 bg-white/50 dark:bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/60 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                  <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Ukuran Font Keseluruhan</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/15 text-slate-800 dark:text-white border border-slate-200 dark:border-white/20 font-mono text-xs font-bold shadow-sm">
                    {fontSize}px
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="12"
                max="120"
                step="1"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 focus:outline-none"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                <span>12px (Kecil)</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Default: 16px</span>
                <span>120px (Besar)</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mr-1">Preset Cepat:</span>
                {[14, 16, 18, 20, 24].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      fontSize === sz
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500'
                        : 'bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-slate-700 dark:text-white border border-slate-200 dark:border-white/20'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Dual Slider Efek Kaca */}
            <div className="space-y-4 bg-white/50 dark:bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/60 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs sm:text-sm font-semibold">
                  <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-slate-800 dark:text-white font-bold">Efek Kaca (Glassmorphism)</span>
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">Blur & Transparansi</span>
              </div>

              {/* Slider 1: Blur */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Tingkat Blur (Glass Blur)</span>
                  <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-cyan-300/60 dark:border-cyan-400/30">{glassBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={glassBlur}
                  onChange={(e) => setGlassBlur(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-cyan-600 dark:accent-cyan-400 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>0px (Jernih)</span>
                  <span>16px (Medium)</span>
                  <span>30px (Buram Tebal)</span>
                </div>
              </div>

              {/* Slider 2: Opacity */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Transparansi Kaca (Glass Opacity)</span>
                  <span className="font-mono text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-blue-300/60 dark:border-blue-400/30">{Math.round(glassOpacity * 100)}% ({glassOpacity.toFixed(2)})</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.01"
                  value={glassOpacity}
                  onChange={(e) => setGlassOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>10% (Sangat Tembus)</span>
                  <span>65% (Standar)</span>
                  <span>95% (Solid)</span>
                </div>
              </div>
            </div>

            {/* Interactive Live Glass Preview */}
            <div
              className="p-4 rounded-2xl border transition-all flex items-center justify-between"
              style={{
                backgroundColor: darkMode
                  ? `rgba(15, 23, 42, ${glassOpacity})`
                  : `rgba(255, 255, 255, ${glassOpacity})`,
                backdropFilter: `blur(${glassBlur}px)`,
                WebkitBackdropFilter: `blur(${glassBlur}px)`,
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                boxShadow: darkMode
                  ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
                  : '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Live Glass Preview ({darkMode ? 'Dark Glass' : 'Light Glass'})
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Refleksi aktif blur <code className="text-cyan-600 dark:text-cyan-300 font-mono font-bold">{glassBlur}px</code> & opasitas <code className="text-blue-600 dark:text-blue-300 font-mono font-bold">{glassOpacity}</code>.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-400/30 text-blue-700 dark:text-white text-xs font-bold">
                Preview Aktif
              </div>
            </div>
          </div>

          {/* Reset Action Button */}
          <div className="pt-2">
            <button
              onClick={handleResetGlass}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Efek Kaca & Font ke Default</span>
            </button>
          </div>
        </div>

        {/* CARD 2: Latar Belakang Kustom (Custom Background) */}
        <div className="flex flex-col justify-between rounded-3xl p-6 sm:p-7 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/70 dark:border-white/20 hover:border-orange-500/40 transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-6">
          <div className="space-y-6">
            {/* Card Title */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-600/30 border border-orange-500/20 dark:border-orange-400/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-md">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                    Latar Belakang Kustom
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Unggah foto latar dan sesuaikan tata letaknya</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/20 dark:border-orange-400/30">
                Local Storage
              </span>
            </div>

            {/* Upload Area */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold flex items-center space-x-2 text-slate-800 dark:text-white">
                <Upload className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Foto Background (Image File)</span>
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                  isDragging
                    ? 'border-orange-500 bg-orange-500/15'
                    : 'border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 hover:border-orange-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />

                {bgImage ? (
                  <div className="w-full space-y-3">
                    <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-white/20 shadow-inner group">
                      <img
                        src={bgImage}
                        alt="Background Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-lg">
                          Klik untuk ganti gambar
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-300 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Foto latar aktif tersimpan di browser
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 dark:border-orange-400/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        Klik untuk unggah atau seret foto ke sini
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Mendukung PNG, JPG, JPEG, WEBP (disimpan lokal)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dropdown Gaya Foto */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-bold flex items-center justify-between text-slate-800 dark:text-white">
                <span className="flex items-center space-x-2">
                  <Maximize2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Gaya Foto (Background Fit & Position)</span>
                </span>
              </label>

              <select
                value={bgStyle}
                onChange={(e) => setBgStyle(e.target.value as BgStyleType)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                <option value="cover" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">Cover / Penuhi Layar (Proporsional & Terpotong Rapi)</option>
                <option value="fill" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">Fill / Isi Penuh (100% Lebar & Tinggi Layar)</option>
                <option value="stretch" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">Stretch / Tarik Sesuai Layar</option>
                <option value="center" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">Center / Di Tengah Layar</option>
                <option value="contain" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">Contain / Muat Utuh Tanpa Terpotong</option>
                <option value="repeat" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">Tile / Ulangi Pola (Repeat Pattern)</option>
              </select>
            </div>

            {/* Slider Transparansi Foto Latar */}
            <div className="space-y-2 bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-white/60 dark:border-white/10">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center space-x-2 text-slate-800 dark:text-white">
                  <Eye className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-medium">Transparansi Foto Latar</span>
                </span>
                <span className="font-mono text-orange-700 dark:text-orange-300 font-bold bg-orange-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-orange-300/60 dark:border-orange-400/30">{Math.round(bgOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-orange-600 dark:accent-orange-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>5% (Sangat Halus)</span>
                <span>85% (Optimal)</span>
                <span>100% (Maksimal)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {bgImage ? (
              <button
                onClick={handleRemoveBg}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Foto Latar</span>
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all active:scale-98"
              >
                <Upload className="w-4 h-4" />
                <span>Pilih Foto Background</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

