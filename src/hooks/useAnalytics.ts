import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useAnalytics(resellerId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [dailyViews, setDailyViews] = useState<{date: string, views: number}[]>([]);
  const [topViewedProducts, setTopViewedProducts] = useState<any[]>([]);
  const [topCartProducts, setTopCartProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    current7DaysViews: 0,
    previous7DaysViews: 0,
    viewsChange: 0,
    conversionRate: 0,
    averageTicket: 0,
    totalOrders: 0
  });

  useEffect(() => {
    async function fetchAnalytics() {
      if (!resellerId) return;
      setLoading(true);
      try {
        // 1. Buscar visualizações diárias dos últimos 14 dias
        const today = new Date();
        const dates: string[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          dates.push(d.toISOString().split('T')[0]);
        }

        const viewsRef = collection(db, `store_views/${resellerId}/daily`);
        const viewsQuery = query(viewsRef, where('date', '>=', dates[0]), orderBy('date', 'asc'));
        const viewsSnap = await getDocs(viewsQuery);
        
        const viewsMap = new Map<string, number>();
        viewsSnap.forEach(doc => {
          viewsMap.set(doc.data().date, doc.data().views || 0);
        });

        const dailyData = dates.map(date => ({
          date,
          views: viewsMap.get(date) || 0
        }));

        setDailyViews(dailyData);

        // Calcular estatísticas de 7 dias
        const current7 = dailyData.slice(7, 14).reduce((acc, curr) => acc + curr.views, 0);
        const previous7 = dailyData.slice(0, 7).reduce((acc, curr) => acc + curr.views, 0);
        let viewsChange = 0;
        if (previous7 > 0) {
          viewsChange = ((current7 - previous7) / previous7) * 100;
        } else if (current7 > 0) {
          viewsChange = 100;
        }

        // 2. Buscar produtos mais visualizados
        const productsRef = collection(db, `product_views/${resellerId}/products`);
        const topViewedQuery = query(productsRef, orderBy('views', 'desc'), limit(5));
        const topViewedSnap = await getDocs(topViewedQuery);
        const topViewed = topViewedSnap.docs.map(d => d.data());

        // 3. Buscar produtos mais adicionados ao carrinho
        const topCartQuery = query(productsRef, orderBy('addedToCart', 'desc'), limit(5));
        const topCartSnap = await getDocs(topCartQuery);
        const topCart = topCartSnap.docs.map(d => d.data());

        // Função auxiliar para enriquecer os dados dos produtos com nome e imagem
        const enrichProducts = async (items: any[]) => {
          const enriched = [];
          for (const item of items) {
            let name = 'Produto Desconhecido';
            let image = '';
            
            // Tenta buscar no reseller_products primeiro
            const rpQuery = query(collection(db, 'reseller_products'), where('resellerId', '==', resellerId), where('baseProductId', '==', item.productId));
            const rpSnap = await getDocs(rpQuery);
            
            if (!rpSnap.empty) {
              const rpData = rpSnap.docs[0].data();
              if (rpData.customName) name = rpData.customName;
            }
            
            // Busca o produto base para pegar a imagem e o nome (se não houver customName)
            try {
              const bpRef = doc(db, 'products', item.productId);
              const bpSnap = await getDoc(bpRef);
              if (bpSnap.exists()) {
                const bpData = bpSnap.data();
                if (name === 'Produto Desconhecido') name = bpData.name;
                image = bpData.images?.[0] || '';
              }
            } catch (e) {
              console.error("Erro ao buscar produto base:", e);
            }

            enriched.push({ ...item, name, image });
          }
          return enriched;
        };

        const enrichedTopViewed = await enrichProducts(topViewed);
        const enrichedTopCart = await enrichProducts(topCart);

        setTopViewedProducts(enrichedTopViewed);
        setTopCartProducts(enrichedTopCart);

        // 4. Buscar pedidos para taxa de conversão e ticket médio (últimos 7 dias)
        const ordersRef = collection(db, 'orders');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const ordersQuery = query(ordersRef, where('resellerId', '==', resellerId), where('createdAt', '>=', sevenDaysAgo));
        const ordersSnap = await getDocs(ordersQuery);
        
        const totalOrders = ordersSnap.size;
        let totalRevenue = 0;
        ordersSnap.forEach(doc => {
          totalRevenue += doc.data().total || 0;
        });

        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const conversionRate = current7 > 0 ? (totalOrders / current7) * 100 : 0;

        setStats({
          current7DaysViews: current7,
          previous7DaysViews: previous7,
          viewsChange,
          conversionRate,
          averageTicket,
          totalOrders
        });

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [resellerId]);

  return { loading, dailyViews, topViewedProducts, topCartProducts, stats };
}
