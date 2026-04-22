'use client';

import React from 'react';

// Se estivéssemos numa app Next.js puramente server-components 
// você importaria useSearchParams de 'next/navigation'.
// Como estamos focados em código performático e isomorfo (React puro para rodar tanto 
// no app Vite que temos quanto portável para Next), faremos state callback com URL update visual.

export interface LeagueOption {
  id: string;
  name: string;
  logoUrl: string; // Ex: /leagues/premier.png ou SVG
}

interface FilterByLeagueProps {
  leagues: LeagueOption[];
  productsCountByLeague: Record<string, number>; // Ex: { 'premier-league': 45 }
  selectedLeagueId: string | null;
  onSelectLeague: (leagueId: string | null) => void;
}

export const FilterByLeague: React.FC<FilterByLeagueProps> = ({
  leagues,
  productsCountByLeague,
  selectedLeagueId,
  onSelectLeague
}) => {
  const handleLeagueClick = (id: string) => {
    // Toggle behavior: clica na ligar ativa = desmarca (volta pra ver tudo)
    const newLeagueId = selectedLeagueId === id ? null : id;
    onSelectLeague(newLeagueId);

    // Opcional: Atualizar URL params de forma Vanilla sem quebrar a árvore React
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newLeagueId) {
        url.searchParams.set('league', newLeagueId);
      } else {
        url.searchParams.delete('league');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <div className="w-full bg-white py-6 border-b border-gray-100">
      <div className="px-4 md:px-8 mb-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
          Filtrar por Competição
        </h3>
      </div>

      <div className="w-full relative">
        <div className="overflow-x-auto hide-scrollbar scroll-smooth pl-4 md:pl-8 pr-12 pb-2">
          <div className="flex min-w-max gap-3">
            
            {/* Opção inicial "Todas" */}
            <button
              onClick={() => handleLeagueClick('all_override')}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all shrink-0
                ${!selectedLeagueId 
                  ? 'border-gray-900 bg-gray-900 text-white shadow-md' 
                  : 'border-gray-100 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              <span className="font-bold">Todas as Ligas</span>
            </button>

            {leagues.map((league) => {
              const isSelected = selectedLeagueId === league.id;
              const count = productsCountByLeague[league.id] || 0;

              return (
                <button
                  key={league.id}
                  onClick={() => handleLeagueClick(league.id)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all shrink-0 group
                    ${isSelected 
                      ? 'border-blue-600 bg-blue-50/50 shadow-md transform scale-[1.02]' 
                      : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {/* Aspect Ratio rígido para segurar os logos horizontal/vertical perfeitamente */}
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <img 
                      src={league.logoUrl} 
                      alt={`Logo ${league.name}`} 
                      className={`max-w-full max-h-full object-contain mix-blend-multiply transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} 
                    />
                  </div>
                  
                  <div className="text-left flex flex-col justify-center">
                    <span className={`text-sm font-bold leading-none ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {league.name}
                    </span>
                    <span className={`text-[10px] font-bold mt-1 tracking-wider uppercase ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                      {count} Produtos
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right fade edge for mobile scrolling hint */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
