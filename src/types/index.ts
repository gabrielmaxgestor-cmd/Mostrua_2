import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "reseller";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  createdAt: Timestamp;
  asaasCustomerId?: string;
}

export interface Niche {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  active: boolean;
  catalogsCount: number;
  productsCount: number;
  createdAt?: Timestamp;
}

export interface Catalog {
  id: string;
  nicheId: string;
  nicheName: string;
  name: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  active: boolean;
  order: number;
  productsCount: number;
  createdAt?: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  nicheId: string;
  catalogId: string;
  order: number;
  status: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  createdAt?: Timestamp;
}

export interface ProductVariation {
  name: string;
  options: string[];
}

export interface BaseProduct {
  id: string;
  nicheId: string;
  catalogId: string;
  categoryId?: string;
  category: string;
  name: string;
  description: string;
  sku: string;
  images: string[];
  priceBase: number;
  variations: string[];
  active: boolean;
  resellersCount: number;
  createdAt?: Timestamp;
}

export interface ResellerSettings {
  logo: string;
  banner: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  whatsapp: string;
  instagram: string;
  address?: string;
  hours?: string;
  autoMessage?: string;
  customBanners?: Record<string, string>; // catalogId or categoryId -> bannerUrl
}

export interface Reseller {
  uid: string;
  name: string;
  email: string;
  phone: string;
  storeName: string;
  slug: string;
  nicheId: string;
  status: "active" | "inactive";
  settings: ResellerSettings;
  onboardingStep?: number;
  achievements?: string[];
}

export interface ResellerCatalog {
  id: string; // resellerId_catalogId
  resellerId: string;
  catalogId: string;
  active: boolean;
  createdAt?: Timestamp;
}

export interface ResellerProduct {
  id: string; // resellerId_baseProductId
  resellerId: string;
  baseProductId: string;
  customName: string;
  customDescription: string;
  customPrice: number;
  promotionalPrice?: number;
  featured: boolean;
  active: boolean;
  createdAt?: Timestamp;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "canceled";

export type SubscriptionStatus = "active" | "pending" | "canceled" | "expired" | "past_due" | "trial";

export interface Plan {
  id: string;
  name: string;
  price: number;
  productLimit: number;
  orderLimit: number;
  catalogLimit: number;
  features: string[];
  active: boolean;
  createdAt?: Timestamp;
}

export interface Subscription {
  id: string;
  resellerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  paymentProvider?: string;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  invoiceUrl?: string;
  createdAt?: Timestamp;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variation?: string;
}

export interface Order {
  id: string;
  resellerId: string;
  storeSlug: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  observations?: string;
  trackingLink?: string;
  total: number;
  status: OrderStatus;
  createdAt?: Timestamp;
  items: OrderItem[];
}

export interface AppNotification {
  id: string;
  resellerId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: Timestamp;
}
