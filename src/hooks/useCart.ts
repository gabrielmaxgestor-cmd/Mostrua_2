import { useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variation?: string;
  imageUrl?: string;
  hasVariations?: boolean;
  stock?: number;
}

export function useCart(resellerId: string | undefined) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Constants
  const getCartKey = () => `cart_${resellerId}`;

  // Load from localStorage
  useEffect(() => {
    if (!resellerId) {
      setItems([]);
      return;
    }

    const loadCart = () => {
      try {
        const saved = localStorage.getItem(getCartKey());
        if (saved) {
          setItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to parse cart from local storage', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadCart();

    // Listen to changes in other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === getCartKey() && e.newValue) {
        try {
          setItems(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Error parsing cart data from other tab", err);
        }
      } else if (e.key === getCartKey() && !e.newValue) {
        setItems([]);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [resellerId]);

  // Save to localStorage
  useEffect(() => {
    if (!resellerId || !isLoaded) return;
    
    try {
      localStorage.setItem(getCartKey(), JSON.stringify(items));
    } catch (e: any) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('Quota exceeded in localStorage. Clearing cart and retrying.');
        // If quota exceeded, we can try to clear older items or just clear completely, 
        // to simplify we can clear the whole cart or remove the oldest items.
        localStorage.removeItem(getCartKey());
        try {
          // As fallback, we store an empty array or at least drop image URLs to save space
          const smallerItems = items.map(({ imageUrl, ...rest }) => rest);
          localStorage.setItem(getCartKey(), JSON.stringify(smallerItems));
        } catch (retryError) {
          console.error('Retry failed. Cart could not be saved to localStorage.', retryError);
        }
      } else {
        console.error('Failed to save cart to local storage', e);
      }
    }
  }, [items, resellerId, isLoaded]);

  const addItem = (product: Omit<CartItem, 'quantity'> & { stock?: number }, quantityToAdd: number = 1, useStockControl: boolean = true) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === product.productId && i.variation === product.variation
      );
      
      const currentQuantity = existing ? existing.quantity : 0;
      const newQuantity = currentQuantity + quantityToAdd;
      
      if (useStockControl && product.stock !== undefined && newQuantity > product.stock) {
        alert(`Não foi possível adicionar ${quantityToAdd} unidade(s). Estoque insuficiente (disponível: ${product.stock}, no carrinho: ${currentQuantity}).`);
        return prev;
      }

      if (existing) {
        return prev.map((i) =>
          i.productId === product.productId && i.variation === product.variation
            ? { ...i, quantity: newQuantity }
            : i
        );
      }
      return [...prev, { ...product, quantity: quantityToAdd }];
    });
  };

  const removeItem = (productId: string, variation?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variation === variation))
    );
  };

  const updateQuantity = (productId: string, variation: string | undefined, quantity: number, stock?: number, useStockControl: boolean = true) => {
    if (quantity <= 0) {
      removeItem(productId, variation);
      return;
    }
    
    if (useStockControl && stock !== undefined && quantity > stock) {
        alert("Quantidade solicitada excede o estoque disponível.");
        return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variation === variation
          ? { ...i, quantity }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = items.length === 0;

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    isEmpty
  };
}
