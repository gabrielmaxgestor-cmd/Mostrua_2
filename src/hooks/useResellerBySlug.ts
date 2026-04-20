import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export const useResellerBySlug = (slug: string | undefined) => {
  const [reseller, setReseller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReseller = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, "resellers"), where("slug", "==", slug), where("status", "==", "active"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setReseller({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setReseller(null);
        }
      } catch (err: any) {
        console.error("Error fetching reseller by slug:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReseller();
  }, [slug]);

  return { reseller, loading, error };
};
