import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

export const storageService = {
  async compressImage(file: File, maxWidth = 800, maxKB = 200, timeoutMs = 8000): Promise<File> {
    // Skip compression if the file is already small enough
    if (file.size / 1024 <= maxKB) {
      return file;
    }

    return new Promise((resolve) => {
      let isDone = false;

      // Fallback timeout to ensure we NEVER hang infinitely
      const timeout = setTimeout(() => {
        if (isDone) return;
        isDone = true;
        console.warn("Image compression timed out. Using original file.");
        resolve(file); // Fallback to original
      }, timeoutMs);

      try {
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
            if (!ctx) {
              throw new Error('Canvas context not available');
            }
            
            ctx.drawImage(img, 0, 0, width, height);

            // Revoke after drawing!
            URL.revokeObjectURL(objectUrl);

            // One-pass compression for maximum speed
            const quality = 0.8;
                    
            canvas.toBlob(
              (blob) => {
                if (isDone) return;
                isDone = true;
                clearTimeout(timeout);

                if (!blob) {
                  console.warn('Blob creation failed, returning original file');
                  resolve(file);
                  return;
                }
                resolve(new File([blob], file.name || 'image.jpg', { type: file.type || 'image/jpeg', lastModified: Date.now() }));
              },
              file.type || 'image/jpeg',
              quality
            );
          } catch (error) {
            if (isDone) return;
            isDone = true;
            clearTimeout(timeout);
            console.error("Compression error:", error);
            resolve(file);
          }
        };
        
        img.onerror = (err) => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timeout);
          URL.revokeObjectURL(objectUrl);
          console.error("Image loading error:", err);
          resolve(file);
        };
        
        img.src = objectUrl;
      } catch (err) {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeout);
        console.error("Fatal compression error:", err);
        resolve(file);
      }
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
