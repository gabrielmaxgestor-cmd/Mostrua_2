export const storageService = {
  async compressImage(file: File, maxWidth = 800, maxKB = 200, timeoutMs = 8000): Promise<File> {
    if (file.size / 1024 <= maxKB) return file;

    return new Promise((resolve) => {
      let isDone = false;
      const timeout = setTimeout(() => {
        if (isDone) return;
        isDone = true;
        resolve(file);
      }, timeoutMs);

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        if (isDone) return;
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');

          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(objectUrl);

          canvas.toBlob((blob) => {
            if (isDone) return;
            isDone = true;
            clearTimeout(timeout);
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name || 'image.jpg', {
              type: file.type || 'image/jpeg',
              lastModified: Date.now()
            }));
          }, file.type || 'image/jpeg', 0.8);
        } catch (error) {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeout);
          resolve(file);
        }
      };

      img.onerror = () => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  },

  async uploadImage(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary não configurado. Verifique as variáveis de ambiente.");
    }

    try {
      const compressedFile = await this.compressImage(file);

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', path);

      if (onProgress) onProgress(10);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro no upload');
      }

      if (onProgress) onProgress(100);

      const data = await response.json();
      return data.secure_url;

    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  },

  async deleteImage(_url: string): Promise<void> {
    // Deleção via Cloudinary requer backend — ignorada no client por segurança
    console.warn("Deleção de imagem não disponível no client. Configure via Cloudinary webhook se necessário.");
  }
};
