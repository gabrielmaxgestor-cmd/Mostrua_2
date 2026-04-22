import React from 'react';
import { Flame } from 'lucide-react';

interface TrendingBadgeProps {
  ordersToday?: number;
  className?: string;
}

export const TrendingBadge: React.FC<TrendingBadgeProps> = ({ ordersToday = 0, className = "" }) => {
  // Mostra o badge apenas se houver uma tração decente (> 2 pedidos)
  if (ordersToday <= 2) return null;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 animate-pulse ${className}`}
      title={`${ordersToday} clientes confirmaram interesse hoje!`}
    >
      <Flame className="w-3.5 h-3.5 fill-current" />
      <span>{ordersToday} pedidos iniciados hoje</span>
    </div>
  );
};
