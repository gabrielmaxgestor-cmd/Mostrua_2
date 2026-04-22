import React, { useEffect, useState } from 'react';
import { statsService } from '../../services/statsService';
import { ProductCard } from './ProductCard'; // Usando o seu ProductCard original
import { TrendingUp, Loader2 } from 'lucide-react';

interface TrendingSectionProps {
  catalogId?: string;
  storeSlug: string;
  primaryColor?: string;
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({ 
  catalogId, 
  storeSlug, 
  primaryColor = '#16a34a',
  onProductClick,
  onAddToCart
}) => {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const top = await statsService.getTrendingProducts(catalogId);
        setTrending(top);
      } catch (error) {
        console.error("Erro ao carregar os hypes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [catalogId]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (trending.length === 0) return null;

  return (
    <section className="w-full py-8 overflow-hidden">
      <div className="px-4 mb-4 flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-500" /> Em Alta
        </h2>
        <span className="text-sm font-medium text-gray-500 hidden sm:block">
          As camisas mais desejadas da semana
        </span>
      </div>

      {/* Carrossel Horizontal Mobile-First (Baseado em scroll snap) */}
      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 pb-4 snap-x snap-mandatory">
        {trending.map((product) => (
          <div key={product.id} className="min-w-[240px] md:min-w-[280px] snap-center shrink-0">
            {/* O card padrão renderiza o botão + informações  */}
            <ProductCard 
              product={product}
              storeSlug={storeSlug}
              resellerPrimaryColor={primaryColor}
              onClick={() => {
                // Intercepta e conta a visualização antes de abrir o sheet/modal
                if (catalogId) {
                  statsService.incrementView(catalogId, product.id);
                }
                onProductClick(product);
              }}
              onAddToCart={(p) => {
                // Intercepta e conta a adição ao carrinho
                if (catalogId) {
                  statsService.incrementOrder(catalogId, product.id);
                }
                onAddToCart(p);
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
