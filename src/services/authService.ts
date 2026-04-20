import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  UserCredential 
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { resellerService } from "./resellerService";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  storeName: string;
  phone: string;
  plan: "pro" | "premium";
}

export const authService = {
  async registerReseller(data: RegisterData): Promise<UserCredential> {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCredential.user.uid;

    // 1. Create user profile in 'users' collection
    await setDoc(doc(db, "users", uid), {
      uid,
      email: data.email,
      role: "reseller",
      status: "active",
      createdAt: Timestamp.now()
    });

    // 2. Create reseller profile in 'resellers' collection
    await resellerService.createReseller(uid, {
      name: data.name,
      storeName: data.storeName,
      email: data.email,
      phone: data.phone,
      plan: data.plan
    });

    // 3. Create Asaas customer
    try {
      await fetch('/api/asaas/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          uid
        })
      });
    } catch (error) {
      console.error("Failed to create Asaas customer", error);
      // We don't block registration if Asaas fails, we can retry later or handle it
    }

    return userCredential;
  },

  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  async logout(): Promise<void> {
    await signOut(auth);
  }
};
