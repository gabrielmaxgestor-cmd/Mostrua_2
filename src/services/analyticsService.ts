import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';

// Função para gerar um hash pseudo-único para o visitante (sem expor IP real)
const getVisitorHash = async () => {
  try {
    // Tenta obter o IP via API pública
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return btoa(data.ip).slice(0, 8);
  } catch (e) {
    // Fallback: gera um ID aleatório e salva na sessão
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
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await setDoc(
      doc(db, 'store_views', resellerId, 'daily', today),
      { views: increment(1), date: today },
      { merge: true }
    );
  } catch (err) {
    console.warn('Analytics error (nao critico):', err);
  }
};

export const incrementProductView = async (resellerId: string, productId: string) => {
  if (!resellerId || !productId) return;
  try {
    const docRef = doc(db, `product_views/${resellerId}/products/${productId}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        views: increment(1),
        lastViewed: serverTimestamp()
      });
    } else {
      await setDoc(docRef, {
        productId,
        views: 1,
        addedToCart: 0,
        lastViewed: serverTimestamp()
      });
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
      await updateDoc(docRef, {
        addedToCart: increment(1),
        lastViewed: serverTimestamp()
      });
    } else {
      await setDoc(docRef, {
        productId,
        views: 0,
        addedToCart: 1,
        lastViewed: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error incrementing add to cart:", error);
  }
};
