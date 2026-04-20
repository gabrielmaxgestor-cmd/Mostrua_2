import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export const generateSlug = (storeName: string): string => {
  if (!storeName) return "";
  
  let slug = storeName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove duplicate hyphens
    .replace(/^-+|-+$/g, ""); // Remove hyphens at the start and end

  return slug.substring(0, 30);
};

export const validateSlug = (slug: string): boolean => {
  const pattern = /^[a-z0-9][a-z0-9-]{2,28}[a-z0-9]$/;
  return pattern.test(slug);
};

export const isSlugAvailable = async (slug: string): Promise<boolean> => {
  if (!slug) return false;
  
  try {
    const q = query(collection(db, "resellers"), where("slug", "==", slug));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return false;
  }
};
