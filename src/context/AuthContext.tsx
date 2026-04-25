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

      if (!currentUser) {
        setProfile(null);
        setReseller(null);
        setSubscription(null);
        setPlan(null);
        setLoading(false);
        return;
      }

      try {
        console.log("[AuthContext] Usuário logado:", currentUser.uid);

        // CORREÇÃO: token refresh com fallback para evitar travamento
        let tokenResult;
        try {
          tokenResult = await currentUser.getIdTokenResult(true);
          console.log("[AuthContext] Token refreshed com sucesso");
        } catch (tokenError) {
          console.warn("[AuthContext] Falha no refresh do token, usando cache:", tokenError);
          tokenResult = await currentUser.getIdTokenResult(false);
        }

        const isAdminClaim = !!tokenResult.claims.admin;
        console.log("[AuthContext] isAdmin:", isAdminClaim);

        // Buscar perfil do usuário
        let profileDoc;
        try {
          profileDoc = await getDoc(doc(db, "users", currentUser.uid));
          console.log("[AuthContext] Profile existe:", profileDoc.exists());
        } catch (profileError) {
          console.error("[AuthContext] Erro ao buscar perfil:", profileError);
          // Se admin por claim, continua mesmo sem profile no Firestore
          if (isAdminClaim) {
            setProfile({ uid: currentUser.uid, email: currentUser.email || "", role: "admin", status: "active", createdAt: null as any });
            setReseller(null);
            setSubscription(null);
            setPlan(null);
            setLoading(false);
            return;
          }
          throw profileError;
        }

        if (profileDoc.exists()) {
          const profileData = profileDoc.data() as UserProfile;
          const finalRole = isAdminClaim ? "admin" : profileData.role;
          setProfile({ ...profileData, role: finalRole as any });
          console.log("[AuthContext] Role final:", finalRole);

          if (finalRole === "reseller") {
            // Buscar dados do revendedor
            try {
              const resellerDoc = await getDoc(doc(db, "resellers", currentUser.uid));
              console.log("[AuthContext] Reseller existe:", resellerDoc.exists());

              if (resellerDoc.exists()) {
                setReseller(resellerDoc.data() as Reseller);
              } else {
                setReseller(null);
              }
            } catch (resellerError) {
              console.error("[AuthContext] Erro ao buscar reseller:", resellerError);
              setReseller(null);
            }

            // Buscar subscription — isolado para não bloquear o loading
            try {
              const sub = await subscriptionService.getResellerSubscription(currentUser.uid);
              console.log("[AuthContext] Subscription:", sub?.status ?? "não encontrada");
              setSubscription(sub);

              if (sub) {
                try {
                  const p = await subscriptionService.getPlan(sub.planId);
                  setPlan(p);
                } catch (planError) {
                  console.error("[AuthContext] Erro ao buscar plano:", planError);
                  setPlan(null);
                }
              } else {
                setPlan(null);
              }
            } catch (subError) {
              console.error("[AuthContext] Erro ao buscar subscription:", subError);
              setSubscription(null);
              setPlan(null);
            }

          } else {
            setReseller(null);
            setSubscription(null);
            setPlan(null);
          }

        } else {
          // Profile não existe no Firestore
          if (isAdminClaim) {
            setProfile({ uid: currentUser.uid, email: currentUser.email || "", role: "admin", status: "active", createdAt: null as any });
          } else {
            setProfile(null);
          }
          setReseller(null);
          setSubscription(null);
          setPlan(null);
        }

      } catch (error) {
        console.error("[AuthContext] Erro crítico no carregamento do perfil:", error);
        setProfile(null);
        setReseller(null);
        setSubscription(null);
        setPlan(null);
      } finally {
        // CORREÇÃO: setLoading(false) garantido no finally — nunca fica preso
        console.log("[AuthContext] setLoading(false)");
        setLoading(false);
      }
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
