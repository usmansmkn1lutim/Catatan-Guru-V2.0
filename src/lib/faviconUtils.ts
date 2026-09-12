/**
 * Utility untuk memastikan favicon & app icon pada semua browser / media / device
 * tetap menggunakan aset favicon resmi yang telah disiapkan (bukan logo banner aplikasi).
 */
export function ensureStandardFavicons(): void {
  try {
    const setLinkTag = (rel: string, type: string | null, sizes: string | null, href: string) => {
      let selector = `link[rel="${rel}"]`;
      if (sizes) {
        selector += `[sizes="${sizes}"]`;
      }
      let link: HTMLLinkElement | null = document.querySelector(selector);
      
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (type) link.type = type;
        if (sizes) link.setAttribute('sizes', sizes);
        document.head.appendChild(link);
      }
      
      link.href = href;
    };

    // Pastikan semua tag favicon mengarah ke file favicon resmi dengan cache-busting v=4
    setLinkTag('icon', 'image/png', '96x96', '/favicon-96x96.png?v=4');
    setLinkTag('icon', 'image/svg+xml', null, '/favicon.svg?v=4');
    setLinkTag('shortcut icon', null, null, '/favicon.ico?v=4');
    setLinkTag('apple-touch-icon', null, '180x180', '/apple-touch-icon.png?v=4');
  } catch (err) {
    console.error('Gagal menyinkronkan favicon standar:', err);
  }
}

/**
 * Pertahankan fungsi updateDynamicFavicons untuk kompatibilitas,
 * tetapi tetap mengarahkan ke favicon standar agar logo banner tidak merusak favicon Chrome mobile.
 */
export function updateDynamicFavicons(_logoUrl?: string): void {
  ensureStandardFavicons();
}
