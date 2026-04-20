import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { 
  Niche, 
  Catalog, 
  BaseProduct, 
  Reseller, 
  ResellerProduct, 
  Order 
} from "../../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generic CRUD Services
export const firestoreService = {
  // Niches
  async getNiches() {
    const path = "niches";
    try {
      const q = query(collection(db, path), orderBy("name"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Niche));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createNiche(data: Omit<Niche, "id">) {
    const path = "niches";
    try {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateNiche(id: string, data: Partial<Niche>) {
    const path = `niches/${id}`;
    try {
      await updateDoc(doc(db, "niches", id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Catalogs
  async getCatalogs(nicheId?: string) {
    const path = "catalogs";
    try {
      let q = query(collection(db, path), orderBy("name"));
      if (nicheId) {
        q = query(collection(db, path), where("nicheId", "==", nicheId), orderBy("name"));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Catalog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createCatalog(data: Omit<Catalog, "id">) {
    const path = "catalogs";
    try {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Products (Base)
  async getProducts(catalogId?: string) {
    const path = "products";
    try {
      let q = query(collection(db, path), orderBy("name"));
      if (catalogId) {
        q = query(collection(db, path), where("catalogId", "==", catalogId), orderBy("name"));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BaseProduct));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createProduct(data: Omit<BaseProduct, "id">) {
    const path = "products";
    try {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Resellers
  async getResellerBySlug(slug: string) {
    const path = "resellers";
    try {
      const q = query(collection(db, path), where("slug", "==", slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Reseller;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async updateResellerSettings(uid: string, settings: Partial<Reseller>) {
    const path = `resellers/${uid}`;
    try {
      await updateDoc(doc(db, "resellers", uid), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Reseller Catalogs
  async getResellerCatalogs(resellerId: string) {
    const path = "reseller_catalogs";
    try {
      const q = query(collection(db, path), where("resellerId", "==", resellerId), where("active", "==", true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().catalogId as string);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Reseller Products
  async getResellerProducts(resellerId: string) {
    const path = "reseller_products";
    try {
      const q = query(collection(db, path), where("resellerId", "==", resellerId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResellerProduct));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async saveResellerProduct(data: Omit<ResellerProduct, "id">) {
    const path = "reseller_products";
    const id = `${data.resellerId}_${data.baseProductId}`;
    try {
      await setDoc(doc(db, path, id), { ...data, id });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Orders
  async createOrder(data: Omit<Order, "id">) {
    const path = "orders";
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getResellerOrders(resellerId: string) {
    const path = "orders";
    try {
      const q = query(
        collection(db, path), 
        where("resellerId", "==", resellerId), 
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async updateOrderStatus(orderId: string, status: Order["status"]) {
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
