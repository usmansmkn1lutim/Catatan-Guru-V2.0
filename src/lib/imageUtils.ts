/**
 * Utility untuk kompresi dan konversi gambar yang diunggah.
 * Mengubah foto resolusi tinggi menjadi Base64 Data URL berukuran sangat kecil (~15KB - 40KB)
 * dengan dimensi maksimal 400x400 piksel.
 * Mencegah QuotaExceededError pada LocalStorage dan kegagalan sinkronisasi Google Sheets / GAS.
 */

export async function compressImage(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Jika SVG atau ukuran file sudah sangat kecil (< 60KB), langsung baca sebagai Data URL
    if (file.type === 'image/svg+xml' || file.size < 60 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    // 2. Baca file image dan kompres melalui Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung skala dimensi proporsional (aspect ratio tetap terjaga)
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback jika canvas context gagal
          resolve(event.target?.result as string);
          return;
        }

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Tentukan output format (Gunakan JPEG atau WEBP untuk foto, PNG jika transparan)
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(outputMime, quality);

        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
