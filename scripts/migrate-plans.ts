import { collection, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../src/firebase";

export async function migratePlans() {
  const plansSnap = await getDocs(collection(db, 'plans'));
  for (const doc of plansSnap.docs) {
    const data = doc.data();
    if (data.name === 'Pro' && data.price === 99.90) {
      await updateDoc(doc.ref, { name: 'PREMIUM', price: 89.90 });
    }
    if (data.name === 'Basico') {
      await updateDoc(doc.ref, { name: 'PRO', price: 49.90 });
    }
    if (data.name === 'Ilimitado') {
      await deleteDoc(doc.ref); // remover plano nao documentado
    }
  }
}
