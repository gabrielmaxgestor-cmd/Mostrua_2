import { collection, doc, getDocs, query, where, addDoc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { Category } from "../types";

export const getCategories = async (nicheId: string): Promise<Category[]> => {
  const q = query(
    collection(db, "categories"),
    where("nicheId", "==", nicheId),
    where("status", "==", true),
    orderBy("order", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const getCategoriesByCatalog = async (catalogId: string): Promise<Category[]> => {
  const q = query(
    collection(db, "categories"),
    where("catalogId", "==", catalogId),
    orderBy("order", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const createCategory = async (data: Omit<Category, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, "categories"), {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<void> => {
  const docRef = doc(db, "categories", id);
  await updateDoc(docRef, data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const docRef = doc(db, "categories", id);
  await updateDoc(docRef, { status: false });
};
