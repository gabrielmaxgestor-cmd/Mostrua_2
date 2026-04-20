import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  Timestamp,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { Catalog, BaseProduct, ResellerProduct, ResellerCatalog } from "../types";

// --- Catalog Services ---
export const catalogService = {
  async getCatalogsByNiche(nicheId: string): Promise<Catalog[]> {
    const q = query(collection(db, "catalogs"), where("nicheId", "==", nicheId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Catalog));
  }
};

export const resellerCatalogService = {
  async toggleCatalog(resellerId: string, catalogId: string, active: boolean) {
    const id = `${resellerId}_${catalogId}`;
    const docRef = doc(db, "reseller_catalogs", id);
    
    if (active) {
      await setDoc(docRef, {
        resellerId,
        catalogId,
        active: true,
        createdAt: serverTimestamp()
      });
    } else {
      await deleteDoc(docRef);
    }
  },

  async getActiveCatalogs(resellerId: string): Promise<string[]> {
    const q = query(collection(db, "reseller_catalogs"), where("resellerId", "==", resellerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().catalogId);
  }
};

// --- Product Services ---
export const productService = {
  async getProductsByCatalogs(catalogIds: string[]): Promise<BaseProduct[]> {
    if (catalogIds.length === 0) return [];
    
    const allProducts: BaseProduct[] = [];
    const chunkSize = 10;
    
    for (let i = 0; i < catalogIds.length; i += chunkSize) {
      const chunk = catalogIds.slice(i, i + chunkSize);
      const q = query(collection(db, "products"), where("catalogId", "in", chunk), where("active", "==", true));
      const snap = await getDocs(q);
      allProducts.push(...snap.docs.map(d => ({ id: d.id, ...d.data() } as BaseProduct)));
    }
    
    return allProducts;
  }
};

export const resellerProductService = {
  async createOrUpdateResellerProduct(resellerId: string, baseProductId: string, data: Partial<ResellerProduct>) {
    const id = `${resellerId}_${baseProductId}`;
    const docRef = doc(db, "reseller_products", id);
    
    await setDoc(docRef, {
      resellerId,
      baseProductId,
      ...data,
      createdAt: serverTimestamp() // merge will keep existing or create new
    }, { merge: true });
  },

  async getResellerProducts(resellerId: string): Promise<Record<string, ResellerProduct>> {
    const q = query(collection(db, "reseller_products"), where("resellerId", "==", resellerId));
    const snap = await getDocs(q);
    const products: Record<string, ResellerProduct> = {};
    snap.docs.forEach(d => {
      const data = d.data() as ResellerProduct;
      products[data.baseProductId] = { id: d.id, ...data };
    });
    return products;
  }
};
