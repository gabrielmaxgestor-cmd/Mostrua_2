import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronRight, Grid } from 'lucide-react';

export interface TimelineProduct {
  id: string;
  name: string;
  image: string;
  price: number;
}

export interface TimelineCollection {
  season: string;
  year: number;
  products: TimelineProduct[];
  isRetro: boolean;
  highlight?: string; // ex: "Temporada do Título"
}

export interface TimelineTeam {
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

interface CollectionTimelineProps {
  team: TimelineTeam;
  collections: TimelineCollection[];
}

// Framer Motion Variants for sequence animation
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.9 },
  show: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 } 
  }
};

export const CollectionTimeline: React.FC<CollectionTimelineProps> = ({ team, collections }) => {
  // Ordered collections by year ascending (optional, ensures timeline is left to right)
  const sortedCollections = [...collections].sort((a, b) => a.year - b.year);
  const [activeSeason, setActiveSeason] = useState<string>(sortedCollections[sortedCollections.length - 1]?.season);

  const activeCollection = sortedCollections.find(c => c.season === activeSeason);

  // Helper to format currency
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  return (
    <div 
      className="w-full py-12 bg-white flex flex-col"
      style={{
        '--team-primary': team.primaryColor,
        '--team-secondary': team.secondaryColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="px-4 md:px-8 mb-10 flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <div className="w-4 h-8 rounded-sm" style={{ backgroundColor: 'var(--team-primary)' }} />
          Histórico de Mantos
        </h2>
        <span className="text-sm font-bold text-gray-400 opacity-70 uppercase tracking-wider hidden sm:block">
          Linha do Tempo
        </span>
      </div>

      {/* Timeline Scroll Area */}
      <div className="w-full relative">
        <div className="overflow-x-auto hide-scrollbar scroll-smooth pl-4 md:pl-8 pr-12 pb-4 pt-10">
          
          <motion.div 
            className="flex min-w-max relative gap-[3rem]"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            {/* The horizontal connecting line */}
            <div className="absolute top-[85px] left-0 right-0 h-1 bg-gray-100 z-0 rounded-full" />

            {sortedCollections.map((col, index) => {
              const isSelected = activeSeason === col.season;
              const hasHighlight = !!col.highlight;

              return (
                <motion.button
                  key={col.season}
                  variants={itemVariants}
                  onClick={() => setActiveSeason(col.season)}
                  className="relative flex flex-col items-center group shrink-0 outline-none w-20"
                >
                  {/* Highlight Box Floating */}
                  {hasHighlight && (
                    <div className="absolute -top-10 whitespace-nowrap bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg z-20 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity animate-bounce-slight" style={{ animationDuration: '3s' }}>
                      <Trophy className="w-3 h-3 text-amber-100" /> {col.highlight}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-500 rotate-45" />
                    </div>
                  )}

                  {/* Thumbnail Image Wrapper */}
                  <div className={`
                    relative w-[72px] h-[88px] rounded-xl p-[3px] bg-white shadow-md transition-all duration-300 z-10
                    ${isSelected ? 'ring-2 font-bold ring-offset-2 ring-[var(--team-primary)] scale-110 shadow-lg' : 'ring-1 ring-gray-200 group-hover:scale-105 group-hover:shadow-[var(--team-primary)]/20'}
                    ${col.isRetro ? 'sepia-[.4] contrast-125 saturate-50' : ''}
                  `}>
                    <img 
                      src={col.products[0]?.image || 'https://via.placeholder.com/150'} 
                      alt={col.season}
                      className="w-full h-full object-cover rounded-lg bg-gray-50"
                    />
                    
                    {col.isRetro && (
                       <div className="absolute inset-0 bg-yellow-900/10 mix-blend-multiply rounded-lg pointer-events-none" />
                    )}
                  </div>

                  {/* Node Dot on Line */}
                  <div className={`
                    w-[14px] h-[14px] rounded-full mt-4 mb-2 z-10 border-2 transition-all duration-300
                    ${isSelected ? 'bg-[var(--team-primary)] border-white scale-[1.3] shadow-[0_0_10px_var(--team-primary)]/50' : 'bg-gray-200 border-white group-hover:bg-gray-400 group-hover:scale-110'}
                  `} />

                  {/* Season Label Text */}
                  <span className={`text-xs font-black transition-colors ${isSelected ? 'text-[var(--team-primary)]' : 'text-gray-400'}`}>
                    {col.season}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
        
        {/* Right Gradient hint for scroll on mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Expanded Products Area */}
      <div className="mt-8 px-4 md:px-8 bg-gray-50/50 py-8 min-h-[300px]">
        {activeCollection && (
          <div className="w-full max-w-5xl mx-auto">
            {/* Context Header */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
               <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     {activeCollection.isRetro && <span className="text-xs bg-gray-800 text-white px-2 py-0.5 rounded font-bold uppercase">Retro</span>}
                     Temporada {activeCollection.season}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                     <Grid className="w-4 h-4" /> {activeCollection.products.length} Manto{activeCollection.products.length > 1 ? 's' : ''} nesta coleção
                  </p>
               </div>
               {activeCollection.highlight && (
                 <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-2">
                   <Trophy className="w-4 h-4" /> {activeCollection.highlight}
                 </span>
               )}
            </div>

            {/* Products Grid animated entry */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSeason} // Trigger remount/animation on season change
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.15 } }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {activeCollection.products.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="aspect-[4/5] rounded-xl bg-gray-100 overflow-hidden relative mb-4">
                       {/* Subtle retro overlay for products inside a retro collection */}
                       {activeCollection.isRetro && (
                         <div className="absolute inset-0 bg-yellow-900/10 mix-blend-multiply z-10 pointer-events-none" />
                       )}
                       <img 
                          src={product.image} 
                          alt={product.name} 
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${activeCollection.isRetro ? 'sepia-[.2]' : ''}`} 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-end p-4">
                         <span className="text-white text-xs font-bold flex items-center gap-1 backdrop-blur-sm bg-white/20 px-2 py-1 rounded">
                           Ver Detalhes <ChevronRight className="w-3 h-3" />
                         </span>
                       </div>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h4>
                    <p className="font-black text-lg mt-2" style={{ color: 'var(--team-primary)' }}>
                       {formatPrice(product.price)}
                    </p>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
