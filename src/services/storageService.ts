import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

export const storageService = {
  async compressImage(file: File, maxWidth = 800, maxKB = 200): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
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
        if (!ctx) return reject(new Error('Canvas context not available'));
        
        ctx.drawImage(img, 0, 0, width, height);

        // One-pass compression for maximum speed
        const quality = 0.8;
                
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Blob creation failed'));
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    });
  },

  async uploadImage(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    const compressedFile = await this.compressImage(file);
    const storageRef = ref(storage, `${path}/${Date.now()}_${compressedFile.name}`);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
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
