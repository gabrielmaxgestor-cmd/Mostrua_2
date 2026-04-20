import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { ShoppingCart, Store, ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { useTenant } from "../../hooks/useTenant";
import { useCart } from "../../hooks/useCart";
import { Category } from "../../types";
import { ProductCard } from "../../components/store/ProductCard";
import { CartDrawer } from "../../components/store/CartDrawer";
import { Checkout } from "../../components/store/Checkout";
import { incrementProductView, incrementAddToCart } from "../../services/analyticsService";

export default function CategoryPage() {
  const { slug, categoryId } = useParams<{ slug?: string; categoryId: string }>();
  const navigate = useNavigate();
  const { reseller: tenantReseller, loading: tenantLoading } = useTenant();
  
  const [reseller, setReseller] = useState<any>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { items: cart, addItem, removeItem, updateQuantity, clearCart, total, itemCount: totalItems } = useCart(reseller?.id || '');
  
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    async function loadCategoryData() {
      if (tenantLoading) return;
      if (!tenantReseller || !categoryId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setReseller(tenantReseller);
      
      try {
        // Fetch specific Category
        const catRef = doc(db, "categories", categoryId);
        const catSnap = await getDoc(catRef);
        
        if (!catSnap.exists() || !catSnap.data().status) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        setCategory({ id: catSnap.id, ...catSnap.data() } as Category);

        // Fetch base products for the niche
        const pSnap = await getDocs(
          query(collection(db, "products"), 
          where("nicheId", "==", tenantReseller.nicheId), 
          where("active", "==", true))
        );
        const baseProducts = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch reseller overrides
        const rpSnap = await getDocs(
          query(collection(db, "reseller_products"), 
          where("resellerId", "==", tenantReseller.id), 
          where("active", "==", true))
        );
        const rps = rpSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Merge and filter
        const mergedProducts = rps.map((rp: any) => {
          const base: any = baseProducts.find(p => p.id === rp.baseProductId);
          if (!base) return null;
          return {
            ...base,
            ...rp,
            id: rp.baseProductId,
            rpId: rp.id,
            name: rp.customName || base.name,
            description: rp.customDescription || base.description,
            price: rp.customPrice || base.priceBase,
          };
        }).filter(Boolean);

        const categoryProducts = mergedProducts.filter((p: any) => p.categoryId === categoryId);
        setProducts(categoryProducts);

      } catch (err) {
        console.error("Erro ao carregar dados da categoria:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryData();
  }, [tenantReseller, tenantLoading, categoryId]);

  const primaryColor = reseller?.settings?.primaryColor || "#16a34a";
  const storeUrl = slug ? `/store/${slug}` : "/";

  useEffect(() => {
    if (category && reseller) {
      document.title = `${category.name} | ${reseller.storeName}`;
    }
  }, [category, reseller]);

  const handleAddToCart = (product: any, variation?: string) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      variation,
      imageUrl: product.images?.[0]
    });
    setShowCart(true);
    
    if (reseller?.id) {
      incrementAddToCart(reseller.id, product.id);
    }
  };

  const handleCheckoutSuccess = (orderId: string) => {
    setShowCheckout(false);
    setShowCart(false);
    navigate(`/store/${slug}/order-confirmed/${orderId}`);
  };

  const openProduct = (product: any) => {
    if (reseller?.id) {
      incrementProductView(reseller.id, product.id);
    }
    navigate(`/store/${slug}/product/${product.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
        <Store className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Categoria não encontrada</h1>
        <p className="text-gray-500 mb-6">Esta aba não existe ou está inativa.</p>
        <Link 
          to={storeUrl}
          className="px-6 py-3 rounded-xl text-white font-bold transition-all shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          Voltar para Início
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Minimalista (Similar to ProductPage) */}
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={storeUrl} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">{reseller?.storeName}</span>
          </Link>
          
          <button 
            onClick={() => setShowCart(true)} 
            className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {totalItems > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white" 
                style={{ backgroundColor: primaryColor }}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <Link to={storeUrl} className="hover:text-gray-900 transition-colors">Início</Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="font-medium text-gray-900">{category?.name}</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{category?.name}</h1>

        {products.length === 0 ? (
           <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
             <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
             <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum produto encontrado nesta categoria</h2>
             <p className="text-gray-500 mb-6">Em breve o revendedor adicionará mais itens.</p>
             <Link 
               to={storeUrl}
               className="inline-flex px-8 py-3 rounded-xl text-white font-bold transition-all shadow-sm"
               style={{ backgroundColor: primaryColor }}
             >
               Ver todos os produtos
             </Link>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={slug || ''}
                onAddToCart={(p) => handleAddToCart(p, p.variations?.[0])}
                onClick={openProduct}
                resellerPrimaryColor={primaryColor}
              />
            ))}
          </div>
        )}
      </main>

      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        total={total}
        itemCount={totalItems}
        onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
        primaryColor={primaryColor}
      />

      <Checkout
        isOpen={showCheckout}
        onClose={() => { setShowCheckout(false); setShowCart(true); }}
        cart={cart}
        reseller={reseller}
        onSuccess={handleCheckoutSuccess}
        total={total}
        itemCount={totalItems}
      />
    </div>
  );
}
