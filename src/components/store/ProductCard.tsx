import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag, Shirt, Smartphone, Watch, Laptop, Headphones, Book, Coffee, Dumbbell, Gift, Home, Camera, Check, ChevronRight, Bell } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';

export interface StoreProduct {
  id: string;
  name: string;
  customName?: string;
  description: string;
  customDescription?: string;
  images: string[];
  basePrice?: number;
  price?: number;
  customPrice?: number;
  promotionalPrice?: number;
  status?: boolean;
  stock?: number;
  category?: string;
  variations?: string[];
}

const getCategoryIcon = (categoryName?: string) => {
  if (!categoryName) return Tag;
  const lower = categoryName.toLowerCase();
  if (lower.includes('camisa') || lower.includes('camiseta') || lower.includes('t-shirt') || lower.includes('roupa') || lower.includes('vestuário')) return Shirt;
  if (lower.includes('celular') || lower.includes('smartphone') || lower.includes('telefone')) return Smartphone;
  if (lower.includes('relógio') || lower.includes('watch') || lower.includes('smartwatch')) return Watch;
  if (lower.includes('notebook') || lower.includes('laptop') || lower.includes('computador')) return Laptop;
  if (lower.includes('fone') || lower.includes('headphone') || lower.includes('áudio')) return Headphones;
  if (lower.includes('livro') || lower.includes('book')) return Book;
  if (lower.includes('café') || lower.includes('coffee')) return Coffee;
  if (lower.includes('fitness') || lower.includes('academia') || lower.includes('esporte')) return Dumbbell;
  if (lower.includes('presente') || lower.includes('gift')) return Gift;
  if (lower.includes('casa') || lower.includes('home') || lower.includes('móvel')) return Home;
  if (lower.includes('câmera') || lower.includes('foto')) return Camera;
  
  return Tag;
};

interface ProductCardProps {
  product: StoreProduct;
  storeSlug: string;
  onAddToCart: (product: StoreProduct) => void;
  onClick: (product: StoreProduct) => void;
  resellerPrimaryColor?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeSlug,
  onAddToCart,
  onClick,
  resellerPrimaryColor = '#16a34a',
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasVariations = product.variations && product.variations.length > 0;
  const isOutOfStock = product.stock === 0;
  const canAddToCart = !isOutOfStock && !hasVariations;

  const displayName = product.customName || product.name;
  const displayPrice = product.promotionalPrice ?? product.customPrice ?? product.basePrice ?? product.price ?? 0;
  const originalPrice = product.promotionalPrice ? (product.customPrice ?? product.basePrice ?? product.price ?? 0) : null;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(displayPrice);

  const formattedOriginalPrice = originalPrice ? new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(originalPrice) : null;

  const displayImage = hovered && product.images?.[1] ? product.images[1] : product.images?.[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAddToCart) return;
    onAddToCart({ ...product } as any);
    
    // Show visual confirmation
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleNotify = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = window.prompt("Seu WhatsApp para aviso (com DDD):", "");
    if (phone) {
      alert("Aviso configurado! Você será notificado quando o produto chegar.");
    }
  };

  const CategoryIcon = getCategoryIcon(product.category);

  return (
    <Link
      to={`/store/${storeSlug}/product/${product.id}`}
      onClick={(e) => {
        e.preventDefault();
        onClick(product);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-md transition-all flex flex-col"
    >
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        <ImageWithFallback
          src={displayImage}
          alt={displayName}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'opacity-50' : ''}`}
        />
        
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Esgotado
          </div>
        )}
        
        {product.promotionalPrice && originalPrice && !isOutOfStock && (
          <div 
            className="absolute top-2 right-2 text-white text-[10px] font-black px-2 py-1 rounded-full"
            style={{ backgroundColor: resellerPrimaryColor }}
          >
            -{Math.round((1 - product.promotionalPrice / originalPrice) * 100)}%
          </div>
        )}

        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {product.images.slice(0, 4).map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === 0 ? 'w-3 h-1.5' : 'w-1.5 h-1.5'} bg-white/80 shadow-sm`} />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {product.category && (
          <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
            <CategoryIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">{product.category}</span>
          </div>
        )}
        
        <h3 className="font-medium text-gray-900 text-sm mb-1 leading-tight line-clamp-2">
          {displayName}
        </h3>
        
        {hasVariations && !isOutOfStock && (
          <p className="text-[10px] text-gray-400 mt-0.5 mb-1.5 font-medium">
            {product.variations!.length} {product.variations!.length === 1 ? 'opção disponível' : 'opções disponíveis'}
          </p>
        )}
        
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex flex-col">
            {formattedOriginalPrice && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through leading-tight mb-0.5">
                {formattedOriginalPrice}
              </span>
            )}
            <span className="font-black text-base sm:text-lg leading-tight" style={{ color: resellerPrimaryColor }}>
              {formattedPrice}
            </span>
          </div>
          
          <div className="shrink-0 flex items-center justify-center">
            {isOutOfStock ? (
              <button
                onClick={handleNotify}
                title="Avisar quando chegar"
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
              >
                <Bell className="w-4 h-4" />
              </button>
            ) : hasVariations ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(product); }}
                title="Ver opções"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-95 hover:scale-105 shadow-sm"
                style={{ backgroundColor: resellerPrimaryColor }}
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAdded}
                title="Adicionar"
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-300 relative ${
                  isAdded ? 'scale-110' : 'active:scale-95 hover:scale-105 shadow-sm'
                }`}
                style={{ backgroundColor: isAdded ? '#22c55e' : resellerPrimaryColor }}
              >
                {isAdded ? (
                  <>
                    <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: '#22c55e' }} />
                    <Check className="w-4.5 h-4.5 animate-in zoom-in duration-200 relative z-10" />
                  </>
                ) : (
                  <Plus className="w-4.5 h-4.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
