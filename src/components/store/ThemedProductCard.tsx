import React from 'react';
import { useTeamTheme } from '../../theme/useTeamTheme';

type Product = {
  id: string;
  name: string;
  image: string;
  price: string;
};

export const ThemedProductCard = ({ product }: { product: Product }) => {
  const { activeTeam } = useTeamTheme();

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 hover:-translate-y-1 hover:shadow-2xl transition-transform duration-300">
      
      {/* Imagem + Efeito Dinâmico via CSS Var */}
      <div className="h-64 w-full bg-gray-100 relative group overflow-hidden">
        {/* Camada sutil do gradiente do time sobrepondo a imagem ao passar o mouse */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity z-10"
          style={{ background: 'var(--theme-gradient)' }}
        />
        
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover relative z-0 transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badge Flutuante do Time que altera instantaneamente pela escolha no Header/FilterBar */}
        <img 
          src={activeTeam.badgeUrl} 
          alt={activeTeam.name} 
          className="absolute top-4 right-4 w-12 h-12 drop-shadow-xl z-20 object-contain"
        />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold mb-1 text-gray-900 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-2xl font-black mb-4" style={{ color: 'var(--theme-primary)' }}>
          {product.price}
        </p>
        
        <div className="flex gap-2 mb-6">
          <span 
            className="px-3 py-1 text-xs font-bold rounded-full border"
            style={{ 
               color: 'var(--theme-primary)', 
               borderColor: 'var(--theme-primary)',
               backgroundColor: 'transparent'
            }}
          >
            Lançamento
          </span>
          <span 
            className="px-3 py-1 text-xs font-bold rounded-full"
            style={{ 
               backgroundColor: 'var(--theme-secondary)', 
               color: activeTeam.colors.secondaryColor === '#FFFFFF' ? '#111' : '#FFFFFF' 
            }}
          >
            Oficial
          </span>
        </div>

        {/* CTA Button com Gradiente Exclusivo do Clube */}
        <button 
          className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white shadow-xl hover:opacity-90 active:scale-95 flex justify-center items-center gap-2 relative overflow-hidden"
          style={{ background: 'var(--theme-gradient)' }}
        >
          <span className="relative z-10" style={{ color: 'var(--theme-text)' }}>
            Comprar Agora
          </span>
        </button>
      </div>
    </div>
  );
};
