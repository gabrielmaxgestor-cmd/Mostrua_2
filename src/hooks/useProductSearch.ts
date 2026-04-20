import { useState, useMemo, useEffect } from 'react';

// Função para remover acentos e converter para minúsculas
const normalizeString = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export function useProductSearch(products: any[], searchTerm: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchTerm);

  // Debounce da busca (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return products;
    }

    const query = normalizeString(debouncedQuery);

    return products
      .map((product) => {
        const name = normalizeString(product.name || '');
        const customName = normalizeString(product.customName || '');
        const description = normalizeString(product.description || '');
        const customDescription = normalizeString(product.customDescription || '');
        const sku = normalizeString(product.sku || '');

        // Calcula um "score" para ordenação (match no nome tem prioridade)
        let score = 0;
        if (name.includes(query) || customName.includes(query)) {
          score = 2;
        } else if (
          description.includes(query) ||
          customDescription.includes(query) ||
          sku.includes(query)
        ) {
          score = 1;
        }

        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score) // Ordena por score (maior primeiro)
      .map((item) => item.product);
  }, [products, debouncedQuery]);

  return {
    filteredProducts,
    isSearching: debouncedQuery.trim().length > 0,
  };
}
