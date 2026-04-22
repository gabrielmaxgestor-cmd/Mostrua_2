import { doc, updateDoc, increment, serverTimestamp, setDoc, collectionGroup, query, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Modelos Base (adapte com os seus modelos originais de produto)
export interface SellingStats {
  productId: string;
  catalogId: string;
  views: number;
  orders: number;
  lastUpdated: Date;
}

const getStatsRef = (catalogId: string, productId: string) => 
  doc(db, 'catalogs', catalogId, 'products', productId, 'stats', 'metrics');

export const statsService = {
  // 1. Contador de visualizações (Incremento Atômico)
  incrementView: async (catalogId: string, productId: string) => {
    const ref = getStatsRef(catalogId, productId);
    try {
      await updateDoc(ref, {
        views: increment(1),
        lastUpdated: serverTimestamp()
      });
    } catch (error: any) {
      if (error.code === 'not-found') {
        // Inicializa se não existir
        await setDoc(ref, {
          productId, // Denormalizamos o ID para facilitar a query collectionGroup depois
          catalogId,
          views: 1,
          orders: 0,
          lastUpdated: serverTimestamp()
        });
      } else {
        console.error("Erro ao incrementar views:", error);
      }
    }
  },

  // 2. Contador de pedidos (WhatsApp Click)
  incrementOrder: async (catalogId: string, productId: string) => {
    const ref = getStatsRef(catalogId, productId);
    try {
      await updateDoc(ref, {
        orders: increment(1),
        lastUpdated: serverTimestamp()
      });
    } catch (error: any) {
      if (error.code === 'not-found') {
        await setDoc(ref, {
          productId,
          catalogId,
          views: 0,
          orders: 1,
          lastUpdated: serverTimestamp()
        });
      }
    }
  },

  // 3. Retornar top 6 produtos (Últimos 7 dias)
  // Utiliza collectionGroup para buscar de todos os catálogos (ou passa where('catalogId', '==', id))
  getTrendingProducts: async (catalogId?: string): Promise<any[]> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Dica para Firestore: Requer um Índice Composto Index(lastUpdated: desc, orders: desc)
    let q = query(
      collectionGroup(db, 'stats'),
      orderBy('orders', 'desc'),
      limit(6)
    );

    const snapshot = await getDocs(q);
    const topProducts = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Filtra manualmente por data (ou use where no query se suportado sem erro de index imediato)
      const lastUpdate = data.lastUpdated?.toDate();
      if (lastUpdate && lastUpdate >= sevenDaysAgo) {
        if (!catalogId || data.catalogId === catalogId) {
          // Busca o produto pai na árvore
          const parentProductRef = docSnap.ref.parent.parent;
          if (parentProductRef) {
            const productSnap = await getDoc(parentProductRef);
            if (productSnap.exists()) {
              topProducts.push({
                id: productSnap.id,
                ...productSnap.data(),
                trendingStats: data
              });
            }
          }
        }
      }
    }

    return topProducts;
  }
};
