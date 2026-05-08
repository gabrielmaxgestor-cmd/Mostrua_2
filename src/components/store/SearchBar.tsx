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
        <Search className="absolute left-4 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full pl-11 pr-10 py-2.5 bg-[#13131C] border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:bg-[#13131C] transition-all"
          style={{ '--tw-ring-color': primaryColor } as any}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 p-1 rounded-full hover:bg-[#1A1A2E] text-white/40 hover:text-white/60 transition-colors"
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
        <p className="text-xs text-white/50 px-2">
          {resultCount === 0 
            ? `Nenhum produto encontrado para "${value}"`
            : `${resultCount} produto${resultCount === 1 ? '' : 's'} encontrado${resultCount === 1 ? '' : 's'}`
          }
        </p>
      </div>
    </div>
  );
}
