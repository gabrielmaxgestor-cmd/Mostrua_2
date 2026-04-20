import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  primaryColor?: string;
  resultCount?: number;
  isSearching?: boolean;
}

export function SearchBar({ value, onChange, primaryColor = '#16a34a', resultCount, isSearching }: SearchBarProps) {
  return (
    <div className="w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full pl-11 pr-10 py-2.5 bg-gray-100 border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all"
          style={{ '--tw-ring-color': primaryColor } as any}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Feedback de busca com transição suave */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isSearching ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <p className="text-xs text-gray-500 px-2">
          {resultCount === 0 
            ? `Nenhum produto encontrado para "${value}"`
            : `${resultCount} produto${resultCount === 1 ? '' : 's'} encontrado${resultCount === 1 ? '' : 's'}`
          }
        </p>
      </div>
    </div>
  );
}
