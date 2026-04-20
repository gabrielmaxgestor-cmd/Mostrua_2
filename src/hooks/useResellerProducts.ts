import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { ResellerProduct } from "../types";

export const useResellerProducts = (resellerId: string | undefined, catalogId?: string) => {
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!resellerId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, "reseller_products"),
      where("resellerId", "==", resellerId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ResellerProduct[];
        
        // Se precisar filtrar por catalogId, faremos no client-side por enquanto,
        // já que o reseller_product pode não ter o catalogId salvo diretamente.
        // O ideal seria salvar o catalogId no reseller_product para poder fazer a query no Firestore.
        // Vamos assumir que o catalogId não está no reseller_product por enquanto,
        // e que a filtragem será feita no componente se necessário.
        
        setProducts(productsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching reseller products:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [resellerId, catalogId]);

  return { products, loading, error };
};
