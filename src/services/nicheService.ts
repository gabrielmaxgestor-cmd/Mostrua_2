import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { Niche } from "../types";

export const nicheService = {
  async getNiches(): Promise<Niche[]> {
    const snapshot = await getDocs(collection(db, "niches"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Niche));
  },

  async getActiveNiches(): Promise<Niche[]> {
    const q = query(collection(db, "niches"), where("active", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Niche));
  },

  async createNiche(data: Omit<Niche, "id" | "catalogsCount" | "productsCount" | "createdAt">): Promise<string> {
    const docRef = await addDoc(collection(db, "niches"), {
      ...data,
      catalogsCount: 0,
      productsCount: 0,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async updateNiche(id: string, data: Partial<Omit<Niche, "id" | "catalogsCount" | "productsCount" | "createdAt">>): Promise<void> {
    const docRef = doc(db, "niches", id);
    await updateDoc(docRef, data);
  },

  async deleteNiche(id: string, catalogsCount: number): Promise<void> {
    if (catalogsCount > 0) {
      throw new Error("Não é possível excluir um nicho que possui catálogos. Desative-o em vez disso.");
    }
    await deleteDoc(doc(db, "niches", id));
  },

  async toggleNicheStatus(id: string, currentStatus: boolean): Promise<void> {
    const docRef = doc(db, "niches", id);
    await updateDoc(docRef, { active: !currentStatus });
  }
};
