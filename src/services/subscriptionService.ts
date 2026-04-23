import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Plan, Subscription } from "../types";

export const subscriptionService = {
  async getPlans(): Promise<Plan[]> {
    const q = query(collection(db, "plans"), where("active", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
  },

  async getPlan(planId: string): Promise<Plan | null> {
    const docRef = doc(db, "plans", planId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Plan;
  },

  async getResellerSubscription(resellerId: string): Promise<Subscription | null> {
    const q = query(collection(db, "subscriptions"), where("resellerId", "==", resellerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Subscription;
  },

  async createSubscription(resellerId: string, planId: string): Promise<{ subscriptionId: string, invoiceUrl: string }> {
    const plan = await this.getPlan(planId);
    if (!plan) throw new Error("Plano não encontrado");

    // We need the user's Asaas Customer ID.
    // Fetch the user document
    const userDoc = await getDoc(doc(db, "users", resellerId));
    const userData = userDoc.data();
    
    if (!userData?.asaasCustomerId) {
      throw new Error("Cliente não possui cadastro no Asaas. Por favor, atualize seu cadastro.");
    }

    const response = await fetch('/api/asaas/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerId: userData.asaasCustomerId,
        value: plan.price,
        description: `Assinatura do Plano ${plan.name}`,
        planId,
        resellerId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao criar assinatura no Asaas");
    }

    const data = await response.json();
    return {
      subscriptionId: data.subscription.id,
      invoiceUrl: data.invoiceUrl
    };
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await updateDoc(doc(db, "subscriptions", subscriptionId), {
      status: "canceled"
    });
  },

  async checkLimits(resellerId: string, type: 'products' | 'catalogs' | 'orders'): Promise<{ allowed: boolean; current: number; limit: number; planName: string }> {
    const sub = await this.getResellerSubscription(resellerId);
    if (!sub || sub.status !== "active" && sub.status !== "trial") {
      return { allowed: false, current: 0, limit: 0, planName: "Nenhum/Inativo" };
    }

    const plan = await this.getPlan(sub.planId);
    if (!plan) {
      return { allowed: false, current: 0, limit: 0, planName: "Desconhecido" };
    }

    let current = 0;
    let limit = 0;

    if (type === 'products') {
      const q = query(collection(db, "reseller_products"), where("resellerId", "==", resellerId), where("active", "==", true));
      const snap = await getDocs(q);
      current = snap.size;
      limit = plan.productLimit;
    } else if (type === 'catalogs') {
      const q = query(collection(db, "reseller_catalogs"), where("resellerId", "==", resellerId), where("active", "==", true));
      const snap = await getDocs(q);
      current = snap.size;
      limit = plan.catalogLimit;
    } else if (type === 'orders') {
      // For orders, we might want to check orders in the current billing period
      // But for simplicity, let's just count total or month orders based on requirements
      // Let's count orders in the current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const q = query(
        collection(db, "orders"), 
        where("resellerId", "==", resellerId),
        where("createdAt", ">=", Timestamp.fromDate(firstDayOfMonth))
      );
      const snap = await getDocs(q);
      current = snap.size;
      limit = plan.orderLimit;
    }

    return {
      allowed: current < limit,
      current,
      limit,
      planName: plan.name
    };
  },

  // Helper to seed initial plans if none exist
  async seedPlansIfEmpty() {
    const plans = await this.getPlans();
    if (plans.length > 0) return; // nunca sobrescreve planos existentes
    
    const defaultPlans = [
      {
        name: 'PRO',
        price: 49.90,
        productLimit: 999999, // ilimitado
        orderLimit: 999999,   // ilimitado
        catalogLimit: 1,
        features: [
          'Produtos ilimitados',
          '1 catalogo ativo',
          'Loja personalizada basica',
          'Link da loja',
          'Botao WhatsApp',
          'Receber pedidos',
          'Meu Painel administrativo',
          'Teste gratis de 7 dias'
        ],
        active: true,
        createdAt: Timestamp.now()
      },
      {
        name: 'PREMIUM',
        price: 89.90,
        productLimit: 999999,
        orderLimit: 999999,
        catalogLimit: 999999, // multiplos catalogos
        features: [
          'Tudo do PRO',
          'Relatorios de vendas',
          'CRM de clientes',
          'Cupons de desconto',
          'Multiplos catalogos e nichos',
          'Dominio proprio',
          'Pixel Facebook',
          'Google Analytics',
          'Controle de estoque',
          'Personalizacao avancada'
        ],
        active: true,
        recommended: true,
        createdAt: Timestamp.now()
      }
    ];
    
    for (const plan of defaultPlans) {
      await addDoc(collection(db, 'plans'), plan);
    }
  }
};
