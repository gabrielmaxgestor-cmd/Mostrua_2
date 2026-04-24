export const cloudinaryService = {
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const cloudName = "mostrua_uploads";
    // Many times the default unsigned preset in Cloudinary is "ml_default"
    // If it fails, the user will need to configure an unsigned preset in Cloudinary named "ml_default"
    // or provide the correct name via env variable VITE_CLOUDINARY_UPLOAD_PRESET
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";

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
    // Client-side delete is not supported by default in Cloudinary without a backend token/signature.
    // We'll leave it as a no-op or log a warning.
    console.warn("Cloudinary images must be deleted via Admin API or signature. URL:", url);
  }
};
