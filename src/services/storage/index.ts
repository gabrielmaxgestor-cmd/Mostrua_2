import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

export const storageService = {
  async uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image", error);
      throw error;
    }
  }
};
