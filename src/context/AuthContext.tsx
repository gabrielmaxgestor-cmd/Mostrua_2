import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserProfile, Reseller, Subscription, Plan } from "../types";
import { authService, RegisterData } from "../services/authService";
import { subscriptionService } from "../services/subscriptionService";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  reseller: Reseller | null;
  subscription: Subscription | null;
  plan: Plan | null;
  loading: boolean;
  isAdmin: boolean;
  isReseller: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  reseller: null,
  subscription: null,
  plan: null,
  loading: true,
  isAdmin: false,
  isReseller: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Force refresh token on login to get custom claims
          const tokenResult = await currentUser.getIdTokenResult(true);
          
          let role = "reseller"; // Default assumption
          
          if (tokenResult.claims.admin) {
             role = "admin";
          }
          
          const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            
            // Allow token claim to override DB role or fallback to DB role
            const finalRole = tokenResult.claims.admin ? "admin" : profileData.role;
            
            setProfile({ ...profileData, role: finalRole as any });
            
            if (finalRole === "reseller") {
              const resellerDoc = await getDoc(doc(db, "resellers", currentUser.uid));
              if (resellerDoc.exists()) {
                setReseller(resellerDoc.data() as Reseller);
                
                // Fetch subscription and plan
                const sub = await subscriptionService.getResellerSubscription(currentUser.uid);
                setSubscription(sub);
                if (sub) {
                  const p = await subscriptionService.getPlan(sub.planId);
                  setPlan(p);
                } else {
                  setPlan(null);
                }
              } else {
                setReseller(null);
                setSubscription(null);
                setPlan(null);
              }
            } else {
              setReseller(null);
              setSubscription(null);
              setPlan(null);
            }
          } else {
            // Profile doesn't exist, but maybe they are admin via claims
            if (tokenResult.claims.admin) {
               setProfile({ uid: currentUser.uid, email: currentUser.email || "", role: "admin", status: "active", createdAt: null as any });
               setReseller(null);
               setSubscription(null);
               setPlan(null);
            } else {
               setProfile(null);
               setReseller(null);
               setSubscription(null);
               setPlan(null);
            }
          }
        } catch (error) {
          console.error("Error refreshing token or fetching profile:", error);
          setProfile(null);
          setReseller(null);
        }
      } else {
        setProfile(null);
        setReseller(null);
        setSubscription(null);
        setPlan(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
  };

  const register = async (data: RegisterData) => {
    await authService.registerReseller(data);
  };

  const logout = async () => {
    await authService.logout();
  };

  const isAdmin = profile?.role === "admin";
  const isReseller = profile?.role === "reseller";

  return (
    <AuthContext.Provider value={{ user, profile, reseller, subscription, plan, loading, isAdmin, isReseller, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
