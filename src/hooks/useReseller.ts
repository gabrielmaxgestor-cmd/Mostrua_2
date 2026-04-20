import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Reseller } from "../types";

export const useReseller = (uid: string | undefined) => {
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setReseller(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "resellers", uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setReseller({ uid: docSnap.id, ...docSnap.data() } as Reseller);
        } else {
          setReseller(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching reseller:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { reseller, loading, error };
};
