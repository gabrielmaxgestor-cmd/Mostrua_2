import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag, Shirt, Smartphone, Watch, Laptop, Headphones, Book, Coffee, Dumbbell, Gift, Home, Camera, Check } from 'lucide-react';
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
  const [selectedVariation, setSelectedVariation] = useState<string>('');

  const hasVariations = product.variations && product.variations.length > 0;
  const isOutOfStock = product.stock === 0;
  const canAddToCart = !isOutOfStock && (!hasVariations || !!selectedVariation);

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAddToCart) return;
    onAddToCart({ ...product, variation: selectedVariation } as any);
    
    // Show visual confirmation
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const CategoryIcon = getCategoryIcon(product.category);

  return (
    <Link
      to={`/store/${storeSlug}/product/${product.id}`}
      onClick={(e) => {
        e.preventDefault();
        onClick(product);
      }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-md transition-all flex flex-col"
    >
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        <ImageWithFallback
          src={product.images?.[0]}
          alt={displayName}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">Esgotado</span>
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
        <h3 className="font-medium text-gray-900 text-sm mb-1 leading-tight line-clamp-2 flex-1">
          {displayName}
        </h3>
        <div className="mt-2 flex flex-col gap-2">
          {hasVariations && (
            <div className="mt-1">
              <p className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Tamanho <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.variations!.map((v: string) => {
                  const isSelected = selectedVariation === v;
                  return (
                    <button key={v}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isOutOfStock) setSelectedVariation(v); }}
                      disabled={isOutOfStock}
                      className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all relative overflow-hidden flex items-center gap-1 ${
                        isSelected
                          ? 'text-white border-transparent shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                      } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                      style={isSelected ? { backgroundColor: resellerPrimaryColor } : {}}
                    >
                      {v}
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
              {!selectedVariation && (
                <p className="text-[10px] text-red-500 mt-1">Selecione um tamanho</p>
              )}
            </div>
          )}
        
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              {formattedOriginalPrice && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  {formattedOriginalPrice}
                </span>
              )}
              <span className="font-bold text-base sm:text-lg" style={{ color: resellerPrimaryColor }}>
                {formattedPrice}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdded || !canAddToCart}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-300 relative ${
                isAdded ? 'scale-110' : 'active:scale-95 hover:scale-105'
              } ${!canAddToCart ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
              style={{ backgroundColor: isAdded ? '#22c55e' : resellerPrimaryColor }}
            >
              {isAdded ? (
                <>
                  <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: '#22c55e' }} />
                  <Check className="w-4 h-4 animate-in zoom-in duration-200 relative z-10" />
                </>
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
