export const cloudinaryService = {
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    // CORREÇÃO: cloudName deve vir da variável de ambiente, não hardcoded
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "mostrua_uploads";

    if (!cloudName) {
      throw new Error("VITE_CLOUDINARY_CLOUD_NAME não configurado. Verifique as variáveis de ambiente no Vercel.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      if (onProgress) onProgress(10);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary upload failed:", errorData);
        throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
      }

      const data = await response.json();
      if (onProgress) onProgress(100);
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary request error:", error);
      throw error;
    }
  },

  async deleteImage(url: string): Promise<void> {
    console.warn("Cloudinary images must be deleted via Admin API or signature. URL:", url);
  }
};
