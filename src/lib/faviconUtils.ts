/**
 * Utility untuk menyinkronkan dynamic favicon & app icon pada semua media / device
 * ketika ada perubahan logo di Konfigurasi Aplikasi.
 */
export function updateDynamicFavicons(logoUrl: string | undefined): void {
  if (!logoUrl) return;

  try {
    // Helper untuk mengubah atau menambahkan link tag
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
      
      // Update href dengan logoUrl yang baru
      link.href = href;
    };

    // Update semua media tag favicon & touch icon
    setLinkTag('icon', 'image/png', '96x96', logoUrl);
    setLinkTag('icon', 'image/svg+xml', null, logoUrl);
    setLinkTag('shortcut icon', null, null, logoUrl);
    setLinkTag('apple-touch-icon', null, '180x180', logoUrl);
  } catch (err) {
    console.error('Gagal memperbarui dynamic favicon:', err);
  }
}
