import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
 
interface Props { message?: string; onRetry?: () => void; }
 
export function ErrorState({ message = 'Erro ao carregar. Verifique sua conexao.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      )}
    </div>
  );
}
