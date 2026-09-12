/**
 * Utility untuk kompresi dan konversi gambar yang diunggah.
 * Mengolah foto/logo resolusi tinggi menjadi Base64 Data URL berkualitas tinggi tanpa patah/blur,
 * sekaligus mengoptimalkan memori untuk LocalStorage dan Google Sheets.
 */

export async function compressImage(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Jika SVG atau ukuran file sudah terjangkau (< 200KB), langsung gunakan data URL asli
    // untuk menjamin tajam 100% tanpa risiko penurunan kualitas.
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (isSvg || file.size < 200 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    // 2. Baca file image dan olah melalui Canvas dengan high quality smoothing
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung skala dimensi proporsional (aspect ratio tetap terjaga)
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Aktifkan high-quality image smoothing agar scaling tidak menghasilkan gerigi / patah-patah
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Pertahankan format PNG untuk gambar transparan/logo agar warna & tepi tajam sempurna
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const outputMime = isPng ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(outputMime, isPng ? undefined : quality);

        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
