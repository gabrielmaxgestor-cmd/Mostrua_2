import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CartItem } from '../hooks/useCart';

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  variation?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  resellerId: string;
  customer: Customer;
  items: OrderItem[];
  total: number;
  status: 'novo' | 'confirmed' | 'shipped' | 'cancelled';
  createdAt: any;
}

export interface CreateOrderParams {
  resellerId: string;
  customer: Customer;
  items: CartItem[];
  total: number;
}

export const orderService = {
  async createOrder({ resellerId, customer, items, total }: CreateOrderParams): Promise<string> {
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderId = `ORD-${Date.now()}-${randomSuffix}`;
      
      const orderItems: OrderItem[] = items.map(item => ({
        productId: item.productId,
        name: item.name,
        qty: item.quantity,
        price: item.price,
        variation: item.variation,
        imageUrl: item.imageUrl
      }));

      const orderData: Order = {
        id: orderId,
        resellerId,
        customer,
        items: orderItems,
        total,
        status: 'novo',
        createdAt: serverTimestamp()
      };

      const orderRef = doc(db, 'orders', orderId);
      await setDoc(orderRef, orderData);

      return orderId;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const docSnap = await import('firebase/firestore').then(m => m.getDoc(orderRef));
      if (docSnap.exists()) {
        return docSnap.data() as Order;
      }
      return null;
    } catch (error) {
      console.error('Erro ao processar busca de pedido:', error);
      return null;
    }
  }
};
