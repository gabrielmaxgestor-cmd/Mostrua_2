import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { StoreProduct } from "../components/store/ProductCard";

export const useProduct = (resellerId: string | undefined, productId: string | undefined) => {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!resellerId || !productId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch base product
        const baseProductRef = doc(db, "products", productId);
        const baseProductSnap = await getDoc(baseProductRef);

        if (!baseProductSnap.exists()) {
          setProduct(null);
          setLoading(false);
          return;
        }

        const baseProduct = { id: baseProductSnap.id, ...baseProductSnap.data() } as any;

        // Fetch reseller product override
        const rpId = `${resellerId}_${productId}`;
        const rpRef = doc(db, "reseller_products", rpId);
        const rpSnap = await getDoc(rpRef);

        let rpData = null;
        if (rpSnap.exists()) {
          rpData = rpSnap.data();
        } else {
          // Tenta buscar por query caso o ID seja diferente
          const q = query(
            collection(db, "reseller_products"),
            where("resellerId", "==", resellerId),
            where("baseProductId", "==", productId)
          );
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            rpData = qSnap.docs[0].data();
          }
        }

        const mergedProduct: StoreProduct = {
          ...baseProduct,
          ...(rpData || {}),
          id: productId,
          name: rpData?.customName || baseProduct.name,
          description: rpData?.customDescription || baseProduct.description,
          price: rpData?.customPrice ?? baseProduct.priceBase ?? baseProduct.suggestedPrice ?? 0,
          basePrice: baseProduct.priceBase,
        };

        setProduct(mergedProduct);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        if (err.code === 'permission-denied') {
          setProduct(null); // Product is likely inactive or doesn't exist
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resellerId, productId]);

  return { product, loading, error };
};
