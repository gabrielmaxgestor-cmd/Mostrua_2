import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// =====================================
// EXISTING TRACKING FUNCTIONS
// =====================================
const getVisitorHash = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return btoa(data.ip).slice(0, 8);
  } catch (e) {
    let hash = sessionStorage.getItem('visitor_hash');
    if (!hash) {
      hash = Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('visitor_hash', hash);
    }
    return hash;
  }
};

export const incrementStoreView = async (resellerId: string) => {
  if (!resellerId) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    await setDoc(
      doc(db, 'store_views', resellerId, 'daily', today),
      { views: increment(1), date: today },
      { merge: true }
    );
  } catch (err) {
    console.warn('Analytics error:', err);
  }
};

export const incrementProductView = async (resellerId: string, productId: string) => {
  if (!resellerId || !productId) return;
  try {
    const docRef = doc(db, `product_views/${resellerId}/products/${productId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { views: increment(1), lastViewed: serverTimestamp() });
    } else {
      await setDoc(docRef, { productId, views: 1, addedToCart: 0, lastViewed: serverTimestamp() });
    }
  } catch (error) {
    console.error("Error incrementing product view:", error);
  }
};

export const incrementAddToCart = async (resellerId: string, productId: string) => {
  if (!resellerId || !productId) return;
  try {
    const docRef = doc(db, `product_views/${resellerId}/products/${productId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { addedToCart: increment(1), lastViewed: serverTimestamp() });
    } else {
      await setDoc(docRef, { productId, views: 0, addedToCart: 1, lastViewed: serverTimestamp() });
    }
  } catch (error) {
    console.error("Error incrementing add to cart:", error);
  }
};

// =====================================
// NOVO: DASHBOARD ANALYTICS (SUMMARY)
// =====================================

export type PeriodType = '7d' | '30d' | '90d';

export interface TopProduct {
  id: string;
  name: string;
  team: string;
  views: number;
  orders: number;
  conversion: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalOrders: number;
  topTeam: string;
  topTeams: { team: string; views: number }[];
  categoryDistribution: { name: string; value: number }[];
  topProducts: TopProduct[];
}

export const getDashboardStats = async (catalogId: string, period: PeriodType): Promise<AnalyticsSummary> => {
  if (!catalogId) {
    return getSimulatedData(period);
  }

  // Expects summary pre-calculated by Cloud Function at: /catalogs/{catalogId}/analytics/summary_{period}
  const summaryRef = doc(db, 'catalogs', catalogId, 'analytics', `summary_${period}`);
  
  try {
    const snap = await getDoc(summaryRef);
    
    if (snap.exists()) {
       // Append formatted conversion % on the fly
       const data = snap.data() as any;
       if (data.topProducts) {
         data.topProducts = data.topProducts.map((p: any) => ({
           ...p,
           conversion: p.views > 0 ? Number(((p.orders / p.views) * 100).toFixed(1)) : 0
         }));
       }
       return data as AnalyticsSummary;
    }

    // Se o resumo não estiver lá, devolvemos dados simulados realistas para fim de layout e teste
    return getSimulatedData(period);

  } catch (error) {
    console.error("Erro ao buscar analytics do dashboard:", error);
    return getSimulatedData(period);
  }
};

// MOCK para exibir tela mesmo sem backend preenchido
function getSimulatedData(period: PeriodType): AnalyticsSummary {
  const m = period === '7d' ? 1 : period === '30d' ? 4.2 : 12.5;
  
  const topProducts = [
    { id: "1", name: "Camisa Titular 24/25", team: "Flamengo", views: Math.floor(450*m), orders: Math.floor(52*m) },
    { id: "2", name: "Manto 3 Especial", team: "Palmeiras", views: Math.floor(310*m), orders: Math.floor(25*m) },
    { id: "3", name: "Bellingham #5 AWAY", team: "Real Madrid", views: Math.floor(280*m), orders: Math.floor(30*m) },
    { id: "4", name: "Retrô 1981 Mundial", team: "Flamengo", views: Math.floor(190*m), orders: Math.floor(14*m) },
    { id: "5", name: "Camisa Treino 24", team: "Corinthians", views: Math.floor(150*m), orders: Math.floor(8*m) }
  ].map(p => ({ ...p, conversion: p.views > 0 ? Number(((p.orders / p.views) * 100).toFixed(1)) : 0 }));

  return {
    totalViews: Math.floor(1240 * m),
    totalOrders: Math.floor(86 * m),
    topTeam: "Flamengo",
    topTeams: [
      { team: "Flamengo", views: Math.floor(640 * m) },
      { team: "Palmeiras", views: Math.floor(310 * m) },
      { team: "Real Madrid", views: Math.floor(280 * m) },
      { team: "Corinthians", views: Math.floor(150 * m) },
      { team: "Seleção BR", views: Math.floor(120 * m) }
    ],
    categoryDistribution: [
      { name: "Torcedor", value: Math.floor(800*m) },
      { name: "Jogador", value: Math.floor(300*m) },
      { name: "Retrô", value: Math.floor(100*m) },
      { name: "Treino", value: Math.floor(40*m) },
    ],
    topProducts
  };
}
