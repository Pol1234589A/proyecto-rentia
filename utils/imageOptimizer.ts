
/**
 * Comprime y redimensiona una imagen antes de subirla.
 * - Máximo ancho: 1920px (Full HD es suficiente para inmobiliaria)
 * - Calidad: 0.8 (Buen balance peso/calidad)
 * - Formato: JPEG (Compatibilidad universal)
 */
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const maxWidth = 1920;
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
        
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a Blob (JPEG comprimido)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          'image/jpeg',
          0.80 // Calidad del 80%
        );
      };
      
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
