import { collection, getDocs, doc, updateDoc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export const adminService = {
  async getResellersList() {
    const snapshot = await getDocs(collection(db, "resellers"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async toggleResellerStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const docRef = doc(db, "resellers", id);
    await updateDoc(docRef, { status: newStatus });
  },

  async getDashboardStats() {
    const nichesSnap = await getDocs(query(collection(db, "niches"), where("active", "==", true)));
    const catalogsSnap = await getDocs(collection(db, "catalogs"));
    const productsSnap = await getDocs(collection(db, "products"));
    const resellersSnap = await getDocs(query(collection(db, "resellers"), where("status", "==", "active")));
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ordersSnap = await getDocs(query(collection(db, "orders"), where("createdAt", ">", Timestamp.fromDate(yesterday))));
    
    const recentOrdersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
    const recentOrders = recentOrdersSnap.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      activeNiches: nichesSnap.size,
      totalCatalogs: catalogsSnap.size,
      totalProducts: productsSnap.size,
      activeResellers: resellersSnap.size,
      recentOrdersCount: ordersSnap.size,
      recentOrders
    };
  }
};
