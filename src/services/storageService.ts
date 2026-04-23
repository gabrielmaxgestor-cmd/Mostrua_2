import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

export const storageService = {
  async compressImage(file: File, maxWidth = 800, maxKB = 200): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
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
          if (!ctx) {
            throw new Error('Canvas context not available');
          }
          
          ctx.drawImage(img, 0, 0, width, height);

          // One-pass compression for maximum speed
          const quality = 0.8;
                  
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Blob creation failed'));
                return;
              }
              resolve(new File([blob], file.name || 'image.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      
      img.src = objectUrl;
    });
  },

  async uploadImage(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const compressedFile = await this.compressImage(file);
      const storageRef = ref(storage, `${path}/${Date.now()}_${compressedFile.name}`);
      
      // Artificial progress for UI since uploadBytes doesn't support state_changed
      if (onProgress) onProgress(10);
      
      const snapshot = await uploadBytes(storageRef, compressedFile);
      if (onProgress) onProgress(100);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Storage upload error:", error);
      throw error;
    }
  },

  async deleteImage(url: string): Promise<void> {
    try {
      // Extract path from URL
      const decodedUrl = decodeURIComponent(url);
      const startIndex = decodedUrl.indexOf('/o/') + 3;
      const endIndex = decodedUrl.indexOf('?alt=media');
      if (startIndex > 2 && endIndex > -1) {
        const filePath = decodedUrl.substring(startIndex, endIndex);
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
};
