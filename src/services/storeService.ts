import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { Reseller, ResellerProduct, BaseProduct } from "../types";

import { subscriptionService } from "./subscriptionService";

// --- Store Service ---
export const storeService = {
  async getStoreBySlug(slug: string): Promise<Reseller | null> {
    const q = query(collection(db, "resellers"), where("slug", "==", slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Reseller;
  },

  async getStoreProducts(resellerId: string): Promise<(ResellerProduct & { base?: BaseProduct })[]> {
    // 1. Get active reseller products
    const q = query(
      collection(db, "reseller_products"), 
      where("resellerId", "==", resellerId),
      where("active", "==", true)
    );
    const snapshot = await getDocs(q);
    const resellerProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ResellerProduct));

    if (resellerProducts.length === 0) return [];

    // 2. Fetch base products to get images and other info
    const baseProductIds = resellerProducts.map(rp => rp.baseProductId);
    const baseProducts: any = {};

    // Firestore 'in' query supports up to 10 elements. Chunk the array.
    const chunkSize = 10;
    for (let i = 0; i < baseProductIds.length; i += chunkSize) {
      const chunk = baseProductIds.slice(i, i + chunkSize);
      const baseQ = query(collection(db, "products"), where("__name__", "in", chunk), where("active", "==", true));
      const baseSnapshot = await getDocs(baseQ);
      baseSnapshot.docs.forEach(d => {
        baseProducts[d.id] = d.data();
      });
    }

    return resellerProducts.map(rp => ({
      ...rp,
      base: baseProducts[rp.baseProductId]
    }));
  }
};

// --- Order Service ---
export interface OrderData {
  resellerId: string;
  storeSlug: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  observations?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variation?: string;
  }[];
  total: number;
}

export const orderService = {
  async createOrder(data: OrderData) {
    // Check limits before creating order
    const limitCheck = await subscriptionService.checkLimits(data.resellerId, 'orders');
    if (!limitCheck.allowed) {
      throw new Error((limitCheck as any).reason || "O lojista atingiu o limite de pedidos do plano atual.");
    }

    // Call the secure backend endpoint to create the order
    const response = await fetch('/api/public/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erro ao criar pedido");
    }

    return result.id;
  }
};

// --- WhatsApp Service ---
export const whatsappService = {
  generateWhatsAppLink(phone: string, orderData: OrderData, autoMessage?: string) {
    let message = autoMessage ? `${autoMessage}\n\n` : "Olá, gostaria de fazer o pedido:\n\n";
    
    orderData.items.forEach(item => {
      message += `Produto: ${item.name}\n`;
      if (item.variation) {
        message += `Variação: ${item.variation}\n`;
      }
      message += `Quantidade: ${item.quantity}\n`;
      message += `Preço: R$ ${item.price.toFixed(2)}\n\n`;
    });

    message += `Total: R$ ${orderData.total.toFixed(2)}\n\n`;
    message += `Nome: ${orderData.customerName}\n`;
    message += `Telefone: ${orderData.customerPhone}\n`;
    if (orderData.customerAddress) {
      message += `Endereço: ${orderData.customerAddress}\n`;
    }
    if (orderData.observations) {
      message += `\nObservações: ${orderData.observations}`;
    }

    const encodedMessage = encodeURIComponent(message);
    // Remove non-digits from phone
    const cleanPhone = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
};
