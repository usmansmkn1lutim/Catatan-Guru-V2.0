/**
 * Utility untuk kompresi dan konversi gambar yang diunggah.
 * Mengolah foto/logo resolusi tinggi menjadi Base64 Data URL berkualitas tinggi tanpa patah/blur,
 * sekaligus mengoptimalkan memori untuk LocalStorage dan Google Sheets (Cell limit <= 50,000 karakter).
 */

export async function compressImage(
  file: File,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.85
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

        // Tentukan batas dimensi awal (360px sangat tajam untuk tampilan logo/avatar 40px-120px)
        let targetMaxW = Math.min(maxWidth, 400);
        let targetMaxH = Math.min(maxHeight, 400);

        if (currentWidth > targetMaxW || currentHeight > targetMaxH) {
          if (currentWidth > currentHeight) {
            currentHeight = Math.round((currentHeight * targetMaxW) / currentWidth);
            currentWidth = targetMaxW;
          } else {
            currentWidth = Math.round((currentWidth * targetMaxH) / currentHeight);
            currentHeight = targetMaxH;
          }
        }

        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const outputMime = isPng ? 'image/png' : 'image/jpeg';

        let resultDataUrl = '';
        const MAX_CHAR_LIMIT = 38000; // Aman dari batas 50,000 sel Google Sheets

        // Iterasi kompresi otomatis jika hasilnya masih > 38,000 karakter
        for (let attempt = 0; attempt < 5; attempt++) {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(currentWidth, 50);
          canvas.height = Math.max(currentHeight, 50);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          // Anti-aliasing / smoothing kualitas tinggi
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
          resultDataUrl = canvas.toDataURL(outputMime, isPng ? undefined : currentQuality);

          if (resultDataUrl.length <= MAX_CHAR_LIMIT) {
            break;
          }

          // Kurangi dimensi & kualitas secara bertahap jika melebihi batas karakter
          currentWidth = Math.round(currentWidth * 0.85);
          currentHeight = Math.round(currentHeight * 0.85);
          currentQuality = Math.max(0.65, currentQuality - 0.1);
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

