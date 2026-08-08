/**
 * Utility untuk kompresi dan konversi gambar yang diunggah.
 * Mengolah foto/logo resolusi tinggi menjadi Base64 Data URL berkualitas tinggi tanpa patah/blur,
 * sekaligus mengoptimalkan memori untuk LocalStorage dan Google Sheets (Cell limit <= 50,000 karakter).
 */

export function isCorruptImageDataUrl(url?: string): boolean {
  if (!url) return false;
  const str = url.trim();
  if (str.startsWith('data:image/')) {
    // Cell limit Google Sheets adalah 50,000 karakter. Jika mendekati 48,000+, hampir pasti terpotong/korup
    if (str.length >= 48000) return true;
    const parts = str.split(';base64,');
    if (parts.length !== 2 || parts[1].length < 20) return true;
    // Periksa apakah ada karakter ilegal dalam string base64
    if (/[^A-Za-z0-9+/=]/.test(parts[1])) return true;
  }
  return false;
}

export async function compressImage(
  file: File,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    
    // Jika SVG dan ukurannya kecil (< 30KB), langsung gunakan SVG asli
    if (isSvg && file.size < 30 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let currentWidth = img.width;
        let currentHeight = img.height;
        let currentQuality = quality;

        // Tentukan batas dimensi awal (300px sangat tajam untuk tampilan logo/avatar)
        let targetMaxW = Math.min(maxWidth, 320);
        let targetMaxH = Math.min(maxHeight, 320);

        if (currentWidth > targetMaxW || currentHeight > targetMaxH) {
          if (currentWidth > currentHeight) {
            currentHeight = Math.round((currentHeight * targetMaxW) / currentWidth);
            currentWidth = targetMaxW;
          } else {
            currentWidth = Math.round((currentWidth * targetMaxH) / currentHeight);
            currentHeight = targetMaxH;
          }
        }

        let isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        let outputMime = isPng ? 'image/png' : 'image/jpeg';

        let resultDataUrl = '';
        const MAX_CHAR_LIMIT = 32000; // Sangat aman dari batas 50,000 sel Google Sheets

        // Iterasi kompresi otomatis jika hasilnya masih > 32,000 karakter
        for (let attempt = 0; attempt < 6; attempt++) {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(currentWidth, 40);
          canvas.height = Math.max(currentHeight, 40);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          // Jika mengkonversi PNG berukuran besar ke JPEG, berikan latar belakang putih
          if (outputMime === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Anti-aliasing / smoothing kualitas tinggi
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
          resultDataUrl = canvas.toDataURL(outputMime, isPng ? undefined : currentQuality);

          if (resultDataUrl.length <= MAX_CHAR_LIMIT) {
            break;
          }

          // Jika PNG terlalu besar (>32,000 char), ubah ke JPEG agar kompresi dapat dilakukan
          if (isPng && attempt >= 1) {
            isPng = false;
            outputMime = 'image/jpeg';
          }

          // Kurangi dimensi & kualitas secara bertahap
          currentWidth = Math.round(currentWidth * 0.8);
          currentHeight = Math.round(currentHeight * 0.8);
          currentQuality = Math.max(0.60, currentQuality - 0.1);
        }

        resolve(resultDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}


