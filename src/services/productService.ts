import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { BaseProduct } from "../types";

export const productService = {
  async getProducts(): Promise<BaseProduct[]> {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BaseProduct));
  },

  async getProductsByCatalog(catalogId: string): Promise<BaseProduct[]> {
    const q = query(
      collection(db, "products"), 
      where("catalogId", "==", catalogId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BaseProduct));
  },

  async getProductsByNiche(nicheId: string): Promise<BaseProduct[]> {
    const q = query(
      collection(db, "products"), 
      where("nicheId", "==", nicheId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BaseProduct));
  },

  async createProduct(data: Omit<BaseProduct, "id" | "resellersCount" | "createdAt">): Promise<string> {
    const batch = writeBatch(db);
    
    // Create new product reference
    const newProductRef = doc(collection(db, "products"));
    
    // Set product data
    batch.set(newProductRef, {
      ...data,
      resellersCount: 0,
      createdAt: serverTimestamp()
    });

    // Increment productsCount in the corresponding catalog
    if (data.catalogId) {
      const catalogRef = doc(db, "catalogs", data.catalogId);
      batch.update(catalogRef, {
        productsCount: increment(1)
      });
    }

    // Increment productsCount in the corresponding niche
    if (data.nicheId) {
      const nicheRef = doc(db, "niches", data.nicheId);
      batch.update(nicheRef, {
        productsCount: increment(1)
      });
    }

    await batch.commit();
    return newProductRef.id;
  },

  async updateProduct(
    id: string, 
    oldCatalogId: string, 
    oldNicheId: string, 
    data: Partial<Omit<BaseProduct, "id" | "resellersCount" | "createdAt">>
  ): Promise<void> {
    const batch = writeBatch(db);
    const productRef = doc(db, "products", id);
    
    batch.update(productRef, data);

    // If catalog changed, update counts
    if (data.catalogId && data.catalogId !== oldCatalogId) {
      if (oldCatalogId) {
        const oldCatalogRef = doc(db, "catalogs", oldCatalogId);
        batch.update(oldCatalogRef, { productsCount: increment(-1) });
      }
      const newCatalogRef = doc(db, "catalogs", data.catalogId);
      batch.update(newCatalogRef, { productsCount: increment(1) });
    }

    // If niche changed, update counts
    if (data.nicheId && data.nicheId !== oldNicheId) {
      if (oldNicheId) {
        const oldNicheRef = doc(db, "niches", oldNicheId);
        batch.update(oldNicheRef, { productsCount: increment(-1) });
      }
      const newNicheRef = doc(db, "niches", data.nicheId);
      batch.update(newNicheRef, { productsCount: increment(1) });
    }

    await batch.commit();
  },

  async deleteProduct(id: string, resellersCount: number, catalogId: string, nicheId: string): Promise<void> {
    if (resellersCount > 0) {
      throw new Error("Não é possível excluir um produto que está sendo usado por revendedores. Desative-o em vez disso.");
    }

    const batch = writeBatch(db);
    
    // Delete product
    const productRef = doc(db, "products", id);
    batch.delete(productRef);

    // Decrement productsCount in catalog
    if (catalogId) {
      const catalogRef = doc(db, "catalogs", catalogId);
      batch.update(catalogRef, {
        productsCount: increment(-1)
      });
    }

    // Decrement productsCount in niche
    if (nicheId) {
      const nicheRef = doc(db, "niches", nicheId);
      batch.update(nicheRef, {
        productsCount: increment(-1)
      });
    }

    await batch.commit();
  },

  async toggleProductStatus(id: string, currentStatus: boolean): Promise<void> {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, { active: !currentStatus });
  }
};
