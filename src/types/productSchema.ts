import { Timestamp } from 'firebase/firestore';

export interface ProductPrice {
  current: number;
  original?: number;
}

export interface ProductStock {
  size: string;
  inStock: boolean;
  quantity?: number;
}

export interface JerseyProductSchema {
  id: string;
  name: string;
  team: string; // Ex: "Flamengo"
  
  // Categorização & Filtros
  leagues: string[]; // Ex: ["brasileirao-a", "libertadores"]
  season: string; // Ex: "24/25"
  type: 'torcedor' | 'jogador' | 'retro' | 'treino';
  
  // Sistema de Lançamento (NOVO)
  releaseDate: Timestamp | null; // Data no futuro para countdown, null = já lançado
  isComingSoon: boolean; // Flag de interface manual
  
  // Especificações
  fabric: string;
  technology: string[];
  sizes: ProductStock[];
  
  // Imagens & Design
  images: string[];
  badgeUrl?: string; // URL do escudo do time (opcional)
  
  // Valores & Stats
  price: ProductPrice;
  isNew: boolean;
  isBestSeller: boolean;
  
  // Base Relations
  catalogId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
