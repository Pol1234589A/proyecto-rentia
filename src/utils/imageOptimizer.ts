
/**
 * Comprime, redimensiona y convierte una imagen a WebP antes de subirla.
 * - Máximo ancho: 1440px (Balance perfecto calidad/velocidad para web)
 * - Calidad: 0.80
 * - Formato: WebP (Soportado por navegadores modernos, 30% más ligero que JPEG)
 */
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // 1440px es suficiente para pantallas de alta resolución en web
    const maxWidth = 1440;
    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspecto
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'));
            return;
        }
        
        // Suavizado de imagen para mejor calidad al reducir
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Blob (WebP comprimido)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback a JPEG si WebP falla (raro en navegadores modernos)
              canvas.toBlob((backupBlob) => {
                  if (backupBlob) resolve(backupBlob);
                  else reject(new Error('Error al comprimir la imagen'));
              }, 'image/jpeg', 0.8);
            }
          },
          'image/webp',
          0.80 // Calidad 80% en WebP es excelente y muy ligera
        );
      };
      
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
