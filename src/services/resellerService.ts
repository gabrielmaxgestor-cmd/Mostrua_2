import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  getDoc,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { auth, db } from "../firebase";
import { Reseller } from "../types";
import { generateSlug, isSlugAvailable } from "../utils/slug";

export const resellerService = {
  async generateUniqueSlug(storeName: string): Promise<string> {
    const baseSlug = generateSlug(storeName);
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      isUnique = await isSlugAvailable(slug);
      if (!isUnique) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return slug;
  },

  async createResellerProfile(data: {
    uid: string;
    name: string;
    email: string;
    phone: string;
    storeName: string;
    slug: string;
    nicheId: string;
  }) {
    try {
      const batch = writeBatch(db);

      // User document
      const userRef = doc(db, "users", data.uid);
      batch.set(userRef, {
        email: data.email,
        role: "reseller",
        status: "active",
        createdAt: Timestamp.now()
      });

      // Reseller document
      const resellerRef = doc(db, "resellers", data.uid);
      const resellerData: Reseller = {
        uid: data.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        storeName: data.storeName,
        slug: data.slug,
        nicheId: data.nicheId,
        status: "active",
        settings: {
          logo: "",
          banner: "",
          primaryColor: "#2563eb",
          secondaryColor: "#1e40af",
          description: "",
          whatsapp: data.phone,
          instagram: ""
        }
      };

      batch.set(resellerRef, {
        ...resellerData,
        id: data.uid,
        createdAt: Timestamp.now()
      });

      await batch.commit();

      // Create trial subscription only if one doesn't exist
      const subscriptionRef = doc(db, 'subscriptions', data.uid);
      const existingSub = await getDoc(subscriptionRef);
      
      if (!existingSub.exists()) {
        const plansSnap = await getDocs(query(collection(db, 'plans'), where('name', '==', 'PRO')));
        let planId = 'plan_pro';
        if (!plansSnap.empty) planId = plansSnap.docs[0].id;

        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);

        await setDoc(subscriptionRef, {
          resellerId: data.uid,
          planId,
          status: 'trial',
          currentPeriodStart: Timestamp.now(),
          currentPeriodEnd: Timestamp.fromDate(trialEnd),
          paymentProvider: 'trial',
          createdAt: Timestamp.now()
        });
        
        console.log('[resellerService] Trial subscription criada para:', data.uid);
      }

      return { success: true, slug: data.slug };
    } catch (error: any) {
      console.error("Error creating reseller profile:", error);
      throw new Error(error.message || "Erro ao configurar a conta do revendedor.");
    }
  },

  /**
   * @deprecated Use `createResellerProfile` instead. This function creates redundant trial subscriptions and isn't used by RegisterPage.tsx anymore.
   */
  async registerReseller(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    storeName: string;
    slug: string;
    nicheId: string;
  }) {
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      try {
        // 2. Create documents using writeBatch
        const batch = writeBatch(db);

        // User document
        const userRef = doc(db, "users", user.uid);
        batch.set(userRef, {
          email: data.email,
          role: "reseller",
          status: "active",
          createdAt: Timestamp.now()
        });

        // Reseller document
        const resellerRef = doc(db, "resellers", user.uid);
        const resellerData: Reseller = {
          uid: user.uid,
          name: data.name,
          email: data.email,
          phone: data.phone,
          storeName: data.storeName,
          slug: data.slug,
          nicheId: data.nicheId,
          status: "active",
          settings: {
            logo: "",
            banner: "",
            primaryColor: "#2563eb",
            secondaryColor: "#1e40af",
            description: "",
            whatsapp: data.phone,
            instagram: ""
          }
        };

        batch.set(resellerRef, {
          ...resellerData,
          id: user.uid,
          createdAt: Timestamp.now()
        });

        await batch.commit();

        return { success: true, slug: data.slug };
      } catch (dbError) {
        // 3. If DB write fails, delete the auth user to prevent orphans
        await deleteUser(user);
        throw dbError;
      }
    } catch (error: any) {
      console.error("Error registering reseller:", error);
      throw new Error(error.message || "Erro ao registrar revendedor.");
    }
  },

  async createReseller(uid: string, data: {
    name: string;
    storeName: string;
    email: string;
    phone: string;
    plan: "pro" | "premium";
  }) {
    const slug = await this.generateUniqueSlug(data.storeName);
    
    const resellerData: Reseller = {
      uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      storeName: data.storeName,
      slug,
      status: "active",
      nicheId: "", // To be filled later or during onboarding
      settings: {
        logo: "",
        banner: "",
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af",
        description: "",
        whatsapp: data.phone,
        instagram: ""
      }
    };

    // Also store plan info in a separate field or within reseller
    const resellerDoc = {
      ...resellerData,
      plan: data.plan,
      subscriptionStatus: "active",
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, "resellers", uid), resellerDoc);
    return resellerDoc;
  }
};
