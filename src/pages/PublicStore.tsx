import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ShoppingCart, MessageCircle, X, Plus, Minus, Search, Store, ArrowLeft, ChevronRight } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { CartDrawer } from "../components/store/CartDrawer";
import { Checkout } from "../components/store/Checkout";
import { ProductCard } from "../components/store/ProductCard";
import { SearchBar } from "../components/store/SearchBar";
import { InstallBanner } from "../components/store/InstallBanner";
import { ErrorState } from "../components/ErrorState";
import { getCategories } from "../services/categoryService";
import { Category, Catalog } from "../types";
import { useProductSearch } from "../hooks/useProductSearch";
import { incrementStoreView, incrementProductView, incrementAddToCart } from "../services/analyticsService";
import { setMetaTags, resetMetaTags } from '../utils/setMetaTags';
import { useTenant } from "../hooks/useTenant";

export default function PublicStore() {
  const { reseller: tenantReseller, loading: tenantLoading, error: tenantError, slug } = useTenant();
  const [reseller, setReseller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Catálogos ativos com seus banners — usados para exibir banner antes dos produtos
  const [activeCatalogs, setActiveCatalogs] = useState<Catalog[]>([]);
  
  // Views: 'home', 'product', 'category'
  const [view, setView] = useState<'home' | 'product' | 'category'>('home');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storeInactive, setStoreInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Product page state
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      const images = selectedProduct?.images || [];
      if (diff > 0) {
        setCurrentImageIndex(prev => Math.min(prev + 1, images.length - 1));
      } else {
        setCurrentImageIndex(prev => Math.max(prev - 1, 0));
      }
    }
  };

  const { items: cart, addItem, removeItem, updateQuantity, clearCart, total, itemCount: totalItems } = useCart(reseller?.id || '');

  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Para bases com 1000+ produtos, migrar para Algolia ou Firebase Extension de search.
  const { filteredProducts: searchResults, isSearching } = useProductSearch(products, searchQuery);

  useEffect(() => {
    async function loadStore() {
      if (tenantLoading) return;
      
      if (tenantError || !tenantReseller) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const resellerData = tenantReseller;
        
        // Block if reseller is not active
        if (resellerData.status !== 'active') {
           setStoreInactive(true);
           setLoading(false);
           return;
        }

        // Check subscription
        const subSnap = await getDocs(query(
          collection(db, 'subscriptions'),
          where('resellerId', '==', resellerData.id)
        ));
        
        if (!subSnap.empty) {
          const sub = subSnap.docs[0].data();
          if (sub.status !== 'active' && sub.status !== 'trial') {
            setStoreInactive(true);
            setLoading(false);
            return;
          }
        }

        setReseller(resellerData);
        
        // Add meta tags
        setMetaTags({
          title: `${resellerData.storeName} — Catalogo Online`,
          description: resellerData.settings?.description || `Confira o catalogo de produtos de ${resellerData.storeName}`,
          image: resellerData.settings?.banner || resellerData.settings?.logo || undefined,
          url: window.location.href,
        });

        // 1. Buscar catalogs ativos do revendedor
        const rcSnap = await getDocs(
          query(collection(db, 'reseller_catalogs'),
            where('resellerId', '==', resellerData.id),
            where('active', '==', true))
        );
        const activeCatalogIds = rcSnap.docs.map(d => d.data().catalogId);

        if (activeCatalogIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return; // loja sem catalogos ativos
        }

        // 2. Buscar objetos completos dos catálogos (para obter bannerUrl e ordem)
        // Batches de 10 por limitação do Firestore 'in'
        const catalogBatchSize = 10;
        const catalogBatches = [];
        for (let i = 0; i < activeCatalogIds.length; i += catalogBatchSize) {
          const batch = activeCatalogIds.slice(i, i + catalogBatchSize);
          catalogBatches.push(getDocs(query(
            collection(db, 'catalogs'),
            where('__name__', 'in', batch)
          )));
        }
        const catalogBatchResults = await Promise.all(catalogBatches);
        const catalogObjects = catalogBatchResults
          .flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() } as Catalog)))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // Banner customizado do revendedor sobrepõe o banner do admin
        const customBanners: Record<string, string> = resellerData.settings?.customBanners || {};
        const catalogsWithBanners = catalogObjects.map(c => ({
          ...c,
          bannerUrl: customBanners[c.id] || c.bannerUrl || c.imageUrl || "",
        }));

        setActiveCatalogs(catalogsWithBanners);

        // 3. Buscar produtos base dos catalogs ativos (batches de 10)
        const batchSize = 10;
        const batches = [];
        for (let i = 0; i < activeCatalogIds.length; i += batchSize) {
          const batch = activeCatalogIds.slice(i, i + batchSize);
          batches.push(getDocs(query(
            collection(db, 'products'),
            where('catalogId', 'in', batch),
            where('active', '==', true)
          )));
        }
        
        const batchResults = await Promise.race([
          Promise.all(batches),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
        ]) as any[];
        
        const baseProducts = batchResults.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 4. Buscar reseller_products ativos
        const rpSnap = await getDocs(query(
          collection(db, 'reseller_products'),
          where('resellerId', '==', resellerData.id),
          where('active', '==', true)
        ));
        const rps = rpSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Merge
        const mergedProducts = rps.map((rp: any) => {
          const base: any = baseProducts.find(p => p.id === rp.baseProductId);
          if (!base) return null;
          return {
            ...base,
            ...rp,
            id: rp.baseProductId, // Use base product ID for consistency
            rpId: rp.id,
            name: rp.customName || base.name,
            description: rp.customDescription || base.description,
            price: rp.customPrice || base.priceBase,
          };
        }).filter(Boolean);

        setProducts(mergedProducts);
        
        try {
          const fetchedCategories = await getCategories(resellerData.nicheId);
          setCategories(fetchedCategories);
        } catch (err) {
          console.error("Error fetching categories:", err);
        }
        
        // Track store view
        incrementStoreView(resellerData.id);
        
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading store:", err);
        setError(err.message === 'timeout' ? 'Conexão lenta. Tente novamente.' : 'Erro ao carregar loja.');
        setLoading(false);
      }
    }
    loadStore();
    return () => { resetMetaTags(); };
  }, [tenantReseller, tenantLoading, tenantError]);

  const handleAddToCart = (product: any, variation?: string) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      variation,
      imageUrl: product.images?.[0],
      hasVariations: product.variations && product.variations.length > 0,
      stock: product.stock
    }, 1, useStockControl);
    setShowCart(true);
    
    // Track add to cart
    if (reseller?.id) {
      incrementAddToCart(reseller.id, product.id);
    }
  };

  const navigate = useNavigate();

  const handleCheckoutSuccess = (orderId: string) => {
    clearCart();
    setShowCheckout(false);
    setShowCart(false);
    navigate(`/store/${slug}/order-confirmed/${orderId}`);
  };

  const useStockControl = reseller?.settings?.useStockControl ?? true;
  const primaryColor = reseller?.settings?.primaryColor || "#16a34a";
  const secondaryColor = reseller?.settings?.secondaryColor || "#f0fdf4";

  useEffect(() => {
    if (reseller) {
      document.title = reseller.storeName || "Loja";
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", primaryColor);
      }
    }
  }, [reseller, primaryColor]);

  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm">
      <ErrorState message={error} onRetry={() => window.location.reload()} />
      {reseller && (
        <a href={`https://wa.me/55${reseller.settings?.whatsapp?.replace(/\D/g,'')}`} className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold">
          <MessageCircle className="w-5 h-5" /> Falar com o vendedor
        </a>
      )}
    </div>
  </div>;

  if (loading) {
    const pColor = tenantReseller?.settings?.primaryColor || "#16a34a";
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
           <div className="max-w-5xl mx-auto px-4 py-3 flex items-center">
              <div className="flex items-center gap-3">
                {tenantReseller?.settings?.logo ? (
                  <img src={tenantReseller.settings.logo} alt="Logo" className="h-10 w-auto object-contain max-w-[150px]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: pColor }}>
                    {tenantReseller?.storeName?.[0]?.toUpperCase() || 'L'}
                  </div>
                )}
                <h1 className="font-bold text-lg text-gray-900 truncate max-w-[180px]">{tenantReseller?.storeName || 'Carregando...'}</h1>
              </div>
           </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (storeInactive) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
         style={{ background: reseller?.settings?.primaryColor ? reseller.settings.primaryColor + '10' : '#f9fafb' }}>
      {reseller?.settings?.logo && <img src={reseller.settings.logo} className="w-20 h-20 rounded-full mb-4 object-cover" />}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{reseller?.storeName || 'Esta loja'}</h1>
      <p className="text-gray-500 mb-6">Esta loja esta temporariamente indisponivel.</p>
      {reseller?.settings?.whatsapp && (
        <a href={`https://wa.me/55${reseller.settings.whatsapp.replace(/\D/g,'')}`}
           target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-bold text-lg shadow-lg">
          Falar com o vendedor
        </a>
      )}
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <Store className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
      <p className="text-gray-500">O link que você acessou não existe ou está inativo.</p>
    </div>
  );

  const filteredProducts = searchResults.filter(p => {
    const matchesCategory = view === 'category' && selectedCategory ? p.categoryId === selectedCategory.id : true;
    return matchesCategory;
  });

  const goHome = () => {
    setView('home');
    setSearchQuery("");
    window.scrollTo(0, 0);
  };

  const goBack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (view === 'product' && selectedCategory) {
      setView('category');
    } else {
      goHome();
    }
    window.scrollTo(0, 0);
  };

  const openProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedVariation(product.variations?.[0] || "");
    setCurrentImageIndex(0);
    setView('product');
    window.scrollTo(0, 0);
    
    // Track product view
    if (reseller?.id) {
      incrementProductView(reseller.id, product.id);
    }
  };

  const openCategory = (category: Category) => {
    setSelectedCategory(category);
    setView('category');
    window.scrollTo(0, 0);
  };

  // Agrupa produtos por catalogId para exibição em seções
  const productsByCatalog = activeCatalogs.map(catalog => ({
    catalog,
    items: searchResults.filter(p => p.catalogId === catalog.id),
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header 
        className="sticky top-0 z-40 shadow-sm transition-colors"
        style={{ 
          backgroundColor: view === 'home' && !reseller?.settings?.banner && !reseller?.settings?.logo ? `${primaryColor}1A` : '#ffffff' 
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            {view !== 'home' ? (
              <div className="flex items-center gap-2">
                <button onClick={goBack}
                  className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Voltar">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-500 truncate max-w-[140px] cursor-pointer hover:text-gray-900" onClick={goHome}>
                  {reseller?.storeName}
                </span>
              </div>
            ) : (
              <div className="cursor-pointer flex items-center gap-3 flex-1" onClick={goHome}>
                {reseller?.settings?.logo ? (
                  <img src={reseller.settings.logo} alt="Logo" className="h-10 w-auto object-contain max-w-[150px]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0" style={{ backgroundColor: primaryColor }}>
                    {reseller?.storeName?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <h1 className="font-bold text-lg text-gray-900 truncate max-w-[200px] sm:max-w-[300px] leading-tight">{reseller?.storeName}</h1>
                  {reseller?.settings?.description && (
                    <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-[300px] mt-0.5">{reseller.settings.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {view === 'home' && (
               <span className="text-xs font-medium text-gray-400 hidden sm:inline-block">
                 {products.length} produtos
               </span>
            )}
            <button onClick={() => setShowCart(true)} className="relative p-2.5 bg-white rounded-full hover:bg-gray-50 transition-all shadow-sm border border-gray-100">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {(view === 'home' || view === 'category') && (
          <div className="max-w-5xl mx-auto px-4 pb-3">
            <SearchBar 
              value={searchQuery} 
              onChange={setSearchQuery} 
              primaryColor={primaryColor} 
              resultCount={filteredProducts.length}
              isSearching={isSearching}
            />
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto">
        {/* HOME VIEW */}
        {view === 'home' && (
          <>
            {/* Banner principal da loja (configurado pelo revendedor em StoreSettings) */}
            {reseller?.settings?.banner && !isSearching && (
              <div className="w-full aspect-[21/9] sm:aspect-[21/6] overflow-hidden bg-gray-200">
                <img src={reseller.settings.banner} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Filtro de categorias */}
            {!isSearching && categories.length > 0 && (
              <div className="px-4 py-6">
                <h2 className="font-bold text-gray-900 mb-4">Categorias</h2>
                <div className="relative">
                  <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                  <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 pr-8">
                    <button
                      onClick={goHome}
                      className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium border transition-colors shadow-sm ${
                        view === 'home' ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                      style={view === 'home' ? { backgroundColor: primaryColor } : {}}
                    >
                      Todos
                    </button>
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => openCategory(cat)}
                        className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium border transition-colors shadow-sm ${
                          selectedCategory?.id === cat.id ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-700'
                        }`}
                        style={selectedCategory?.id === cat.id ? { backgroundColor: primaryColor } : {}}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-4">
              {/* Estado de busca ativa — exibe todos os resultados juntos, sem separação por catálogo */}
              {isSearching && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h2 className="font-bold text-gray-900 text-lg">
                      {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'} para "{searchQuery}"
                    </h2>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-sm font-medium hover:text-gray-900 transition-colors px-3 py-1.5 bg-white border border-gray-200 rounded-full w-fit"
                      style={{ color: primaryColor }}
                    >
                      Limpar busca
                    </button>
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
                      <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
                      <p className="text-gray-500 mb-6">Tente usar outros termos ou palavras-chave.</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="px-6 py-2.5 rounded-full text-white font-bold transition-all shadow-sm mx-auto"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Ver todos os produtos
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                      {searchResults.map(product => (
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
                </>
              )}

              {/* Estado sem busca — produtos agrupados por catálogo com banner 16:9 */}
              {!isSearching && (
                <>
                  {products.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      {reseller?.settings?.logo && (
                        <img src={reseller.settings.logo} className="w-20 h-20 rounded-full object-cover mb-4 shadow-sm" />
                      )}
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Em breve novidades! 🎉</h2>
                      <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                        {reseller?.storeName} está preparando seu catálogo. Fale com a gente no WhatsApp para saber mais.
                      </p>
                      {reseller?.settings?.whatsapp && (
                        <a
                          href={`https://wa.me/55${reseller.settings.whatsapp.replace(/\D/g,'')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto px-6 py-3.5 rounded-full font-bold text-white shadow-lg active:scale-95 transition-all"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <MessageCircle className="w-5 h-5" /> Falar no WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    /* Seções por catálogo — cada catálogo exibe seu banner 16:9 seguido pelos produtos */
                    <div className="space-y-10">
                      {productsByCatalog.map(({ catalog, items }) => (
                        <section key={catalog.id}>
                          {/* Banner 16:9 do catálogo */}
                          {catalog.bannerUrl && (
                            <div className="w-full aspect-video overflow-hidden rounded-2xl mb-5 bg-gray-100 shadow-sm">
                              <img
                                src={catalog.bannerUrl}
                                alt={catalog.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* Nome do catálogo (só exibe se houver mais de um catálogo ativo) */}
                          {productsByCatalog.length > 1 && (
                            <h2 className="font-bold text-gray-900 text-lg mb-4">{catalog.name}</h2>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                            {items.map(product => (
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
                        </section>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* CATEGORY VIEW */}
        {view === 'category' && selectedCategory && (
          <div className="px-4 py-6">
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
              <button onClick={goHome} className="hover:text-gray-600 transition-colors">
                {reseller?.storeName}
              </button>
              <span>/</span>
              <span className="text-gray-700 font-medium">{selectedCategory?.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="font-bold text-xl text-gray-900">
                {isSearching ? `Resultados para "${searchQuery}" em ${selectedCategory.name}` : selectedCategory.name}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{filteredProducts.length} produtos</span>
                {isSearching && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-sm font-medium hover:text-gray-900 transition-colors px-3 py-1.5 bg-white border border-gray-200 rounded-full w-fit"
                    style={{ color: primaryColor }}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
            
            {filteredProducts.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
                  <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-500 mb-6">Tente usar outros termos ou palavras-chave.</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-2.5 rounded-full text-white font-bold transition-all shadow-sm mx-auto"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Ver todos da categoria
                  </button>
                </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.map(product => (
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
          </div>
        )}

        {/* PRODUCT VIEW */}
        {view === 'product' && selectedProduct && (
          <div className="bg-white min-h-screen pb-24">
            {/* Breadcrumb */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 text-xs text-gray-500 font-medium overflow-x-auto hide-scrollbar whitespace-nowrap">
              <span onClick={goHome} className="cursor-pointer hover:text-gray-900 transition-colors">
                 ← {reseller?.storeName}
              </span>
              {selectedProduct.category && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-900">{selectedProduct.category}</span>
                </>
              )}
            </div>

            {/* Image Slider com suporte a múltiplas fotos */}
            <div 
              className="relative aspect-square sm:aspect-[4/3] bg-gray-100"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {selectedProduct.images?.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10 shadow-sm backdrop-blur-sm">
                  {currentImageIndex + 1} / {selectedProduct.images.length}
                </div>
              )}
              
              {selectedProduct.images?.[currentImageIndex] ? (
                <img src={selectedProduct.images[currentImageIndex]} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Store className="w-16 h-16" /></div>
              )}
              
              {/* Dots de navegação entre fotos */}
              {selectedProduct.images?.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {selectedProduct.images.map((_: any, idx: number) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                      className={`h-2.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-2.5 bg-white/60'}`} />
                  ))}
                </div>
              )}

              {/* Setas de navegação lateral (desktop) */}
              {selectedProduct.images?.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => Math.max(prev - 1, 0))}
                    disabled={currentImageIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all disabled:opacity-0 backdrop-blur-sm hidden sm:flex"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => Math.min(prev + 1, selectedProduct.images.length - 1))}
                    disabled={currentImageIndex === selectedProduct.images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center transition-all disabled:opacity-0 backdrop-blur-sm hidden sm:flex"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas das fotos (thumbnail strip) */}
            {selectedProduct.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5 py-3 border-b border-gray-100 bg-white">
                {selectedProduct.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? 'border-gray-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="p-5">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h1>
                <p className="text-3xl font-black" style={{ color: primaryColor }}>R$ {Number(selectedProduct.price).toFixed(2)}</p>
              </div>

              {selectedProduct.variations?.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Opções disponíveis</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Selecione antes de adicionar ao carrinho</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.variations.map((v: string) => (
                      <button key={v} onClick={() => setSelectedVariation(v)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedVariation === v ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        style={selectedVariation === v ? { backgroundColor: primaryColor } : {}}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.description && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Descrição</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                </div>
              )}
            </div>

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 z-30 max-w-5xl mx-auto">
              <button onClick={() => handleAddToCart(selectedProduct, selectedVariation)} disabled={selectedProduct.stock === 0}
                className="flex-1 py-3.5 rounded-2xl font-bold border-2 transition-colors disabled:opacity-50 text-gray-700 hover:bg-gray-50 active:scale-95"
                style={selectedProduct.stock !== 0 ? { borderColor: primaryColor, color: primaryColor } : {}}>
                Adicionar
              </button>
              <button onClick={() => { handleAddToCart(selectedProduct, selectedVariation); setShowCart(false); setShowCheckout(true); }} disabled={selectedProduct.stock === 0}
                className="flex-[2] py-3.5 rounded-2xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                style={{ backgroundColor: primaryColor }}>
                <MessageCircle className="w-5 h-5" /> Comprar Agora
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating WhatsApp Button (Only on Home/Category) */}
      {view !== 'product' && reseller?.settings?.whatsapp && (
        <a 
          href={`https://wa.me/55${reseller.settings.whatsapp.replace(/\D/g, '')}`}
          target="_blank" rel="noreferrer"
          className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#25D366] text-white rounded-full shadow-xl hover:scale-105 transition-all z-30 overflow-hidden group"
          style={{ paddingRight: '16px', paddingLeft: '16px', paddingTop: '12px', paddingBottom: '12px' }}
        >
          <MessageCircle className="w-6 h-6 shrink-0" />
          <span className="text-sm font-bold max-w-0 group-hover:max-w-xs transition-all duration-300 overflow-hidden whitespace-nowrap">
            Dúvidas?
          </span>
        </a>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        updateQuantity={(pid, variation, qt, st) => updateQuantity(pid, variation, qt, st, useStockControl)}
        removeItem={removeItem}
        total={total}
        itemCount={totalItems}
        onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
        primaryColor={primaryColor}
        useStockControl={useStockControl}
      />

      {/* Checkout Modal */}
      <Checkout
        isOpen={showCheckout}
        onClose={() => { setShowCheckout(false); setShowCart(true); }}
        cart={cart}
        reseller={reseller}
        onSuccess={handleCheckoutSuccess}
        total={total}
        itemCount={totalItems}
      />

      <InstallBanner storeName={reseller?.storeName} primaryColor={primaryColor} />
    </div>
  );
}
