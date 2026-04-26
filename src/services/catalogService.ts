import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  increment,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import { Catalog } from "../types";

export const catalogService = {
  async getCatalogs(): Promise<Catalog[]> {
    const q = query(collection(db, "catalogs"), orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Catalog));
  },

  async getCatalogsByNiche(nicheId: string): Promise<Catalog[]> {
    const q = query(
      collection(db, "catalogs"), 
      where("nicheId", "==", nicheId),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Catalog));
  },

  async createCatalog(data: Omit<Catalog, "id" | "productsCount" | "createdAt">): Promise<string> {
    const batch = writeBatch(db);
    
    const newCatalogRef = doc(collection(db, "catalogs"));
    
    batch.set(newCatalogRef, {
      ...data,
      productsCount: 0,
      createdAt: serverTimestamp()
    });

    const nicheRef = doc(db, "niches", data.nicheId);
    batch.update(nicheRef, {
      catalogsCount: increment(1)
    });

    await batch.commit();
    return newCatalogRef.id;
  },

  async updateCatalog(id: string, oldNicheId: string, data: Partial<Omit<Catalog, "id" | "productsCount" | "createdAt">>): Promise<void> {
    const batch = writeBatch(db);
    const catalogRef = doc(db, "catalogs", id);
    
    batch.update(catalogRef, data);

    if (data.nicheId && data.nicheId !== oldNicheId) {
      const oldNicheRef = doc(db, "niches", oldNicheId);
      const newNicheRef = doc(db, "niches", data.nicheId);
      
      batch.update(oldNicheRef, { catalogsCount: increment(-1) });
      batch.update(newNicheRef, { catalogsCount: increment(1) });
    }

    await batch.commit();
  },

  async deleteCatalog(id: string, nicheId: string): Promise<void> {
    const batch = writeBatch(db);

    // Deletar todos os produtos do catálogo
    const productsSnap = await getDocs(
      query(collection(db, "products"), where("catalogId", "==", id))
    );
    productsSnap.docs.forEach(p => batch.delete(p.ref));

    // Deletar o catálogo
    batch.delete(doc(db, "catalogs", id));

    // Decrementar contador no nicho
    batch.update(doc(db, "niches", nicheId), {
      catalogsCount: increment(-1)
    });

    await batch.commit();
  },

  async toggleCatalogStatus(id: string, currentStatus: boolean): Promise<void> {
    const docRef = doc(db, "catalogs", id);
    await updateDoc(docRef, { active: !currentStatus });
  }
};
