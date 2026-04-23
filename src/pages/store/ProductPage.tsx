import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTenant } from "../../hooks/useTenant";
import { useProduct } from "../../hooks/useProduct";
import { useCart } from "../../hooks/useCart";
import { ChevronRight, ChevronLeft, Maximize2, ArrowLeft, Share2, Minus, Plus, ShoppingCart, MessageCircle, Store, X, Home } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ImageWithFallback } from "../../components/ui/ImageWithFallback";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { ProductCard } from "../../components/store/ProductCard";
import { CartDrawer } from "../../components/store/CartDrawer";
import { Checkout } from "../../components/store/Checkout";
import { setMetaTags } from "../../utils/setMetaTags";

export default function ProductPage() {
  const { slug, productId } = useParams<{ slug?: string; productId: string }>();
  const navigate = useNavigate();
  
  const { reseller, loading: resellerLoading } = useTenant();
  const { product, loading: productLoading } = useProduct(reseller?.id, productId);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  
  // WhatsApp Modal State
  const [showWaModal, setShowWaModal] = useState(false);
  const [waName, setWaName] = useState("");
  const [waPhone, setWaPhone] = useState("");

  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const { items: cart, addItem, removeItem, updateQuantity, clearCart, total, itemCount: totalItems } = useCart(reseller?.id || '');

  const useStockControl = reseller?.settings?.useStockControl ?? true;
  const primaryColor = reseller?.settings?.primaryColor || "#16a34a";
  
  const storeUrl = slug ? `/store/${slug}` : "/";

  const handleCheckoutSuccess = (orderId: string) => {
    setShowCheckout(false);
    setShowCart(false);
    navigate(`/store/${slug}/order-confirmed/${orderId}`);
  };

  useEffect(() => {
    if (product && reseller) {
      setMetaTags({
        title: `${product.name} — ${reseller.storeName}`,
        description: product.description || undefined,
        image: product.images?.[0] || undefined,
        url: window.location.href,
      });
    }
  }, [product, reseller]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!reseller?.id || !product?.category) return;
      
      try {
        const q = query(
          collection(db, "products"), 
          where("nicheId", "==", reseller.nicheId),
          where("category", "==", product.category),
          where("active", "==", true),
          limit(5)
        );
        const snap = await getDocs(q);
        const related = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.id !== product.id)
          .slice(0, 4);
        
        const formattedRelated = related.map((p: any) => ({
          ...p,
          price: p.priceBase
        }));
        setRelatedProducts(formattedRelated);
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    };
    if (product && reseller) fetchRelated();
  }, [reseller, product]);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
    setSelectedVariation("");
    setCurrentImageIndex(0);
  }, [productId]);

  if (resellerLoading || productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }} />
      </div>
    );
  }

  if (!reseller || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
        <Store className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
        <p className="text-gray-500 mb-6">Este produto pode ter sido removido ou está indisponível.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium mb-3 w-full max-w-xs flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
        <Link to={storeUrl} className="px-6 py-3 bg-gray-200 text-gray-900 rounded-xl font-medium w-full max-w-xs flex items-center justify-center gap-2">
          <Home className="w-5 h-5" /> Ir para o Início
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      alert("Por favor, selecione uma opção antes de adicionar ao carrinho.");
      return;
    }
    
    addItem({
        productId: product.id,
        name: product.name,
        price: product.promotionalPrice ?? product.price ?? 0,
        variation: selectedVariation,
        imageUrl: product.images?.[0],
        stock: product.stock
      }, quantity, useStockControl);
    
    setShowCart(true);
  };

  const handleWhatsAppBuy = () => {
    if (product.variations && product.variations.length > 0 && !selectedVariation) {
      alert("Por favor, selecione uma opção.");
      return;
    }
    setShowWaModal(true);
  };

  const submitWhatsAppBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waName || !waPhone) return;

    const resellerPhone = reseller.settings?.whatsapp?.replace(/\D/g, '');
    if (!resellerPhone) {
      alert("O lojista não configurou um número de WhatsApp.");
      return;
    }

    const displayPriceToWa = product.promotionalPrice ?? product.price ?? 0;
    const formattedPriceWa = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayPriceToWa);
    const variationText = selectedVariation ? ` - ${selectedVariation}` : "";
    
    const message = `Olá! Tenho interesse no produto:\n\n*${product.name}*${variationText}\nQuantidade: ${quantity}\nValor: ${formattedPriceWa}\n\nMeu nome: ${waName}`;
    
    const url = `https://wa.me/55${resellerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setShowWaModal(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} | ${reseller.storeName}`,
      text: product.description,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado para a área de transferência!");
    }
  };

  const displayPrice = product.promotionalPrice ?? product.price ?? 0;
  const originalPrice = product.promotionalPrice ? product.price : null;

  const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayPrice);
  const formattedOriginalPrice = originalPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalPrice) : null;
  const isOutOfStock = useStockControl && product.stock !== undefined && product.stock === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Voltar">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to={storeUrl} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Início da Loja">
              <Home className="w-5 h-5" />
            </Link>
          </div>
          <h1 className="font-bold text-lg text-gray-900 truncate max-w-[200px]">{reseller.storeName}</h1>
          <div className="flex items-center">
            <button onClick={() => setShowCart(true)} className="relative p-2.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white" style={{ backgroundColor: primaryColor }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center text-sm text-gray-500 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <Link to={storeUrl} className="hover:text-gray-900 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            {reseller.storeName}
          </Link>
          <ChevronRight className="w-4 h-4 mx-1 shrink-0" />
          {product.category && (
            <>
              <span className="hover:text-gray-900">{product.category}</span>
              <ChevronRight className="w-4 h-4 mx-1 shrink-0" />
            </>
          )}
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column - Gallery */}
          <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col gap-4">
            <div 
              className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 group cursor-pointer"
              onClick={() => setIsZoomModalOpen(true)}
            >
              <ImageWithFallback 
                src={product.images?.[currentImageIndex]} 
                alt={product.name}
                className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-full opacity-0 md:group-hover:opacity-100 transition-all duration-300 shadow-sm transform scale-90 md:group-hover:scale-100">
                  <Maximize2 className="w-6 h-6" />
                </div>
              </div>
              {isOutOfStock && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10">
                  Sem estoque
                </div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x">
                {product.images.map((img: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all p-0.5 snap-start ${
                      currentImageIndex === idx ? 'border-gray-900 shadow-sm ring-1 ring-gray-900' : 'border-transparent hover:border-gray-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50">
                      <ImageWithFallback src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Info */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <button onClick={handleShare} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors shrink-0">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6 flex flex-col p-6 rounded-3xl bg-opacity-10" style={{ backgroundColor: `${reseller?.settings?.secondaryColor || '#e5e7eb'}20` }}>
              {formattedOriginalPrice && (
                <span className="text-lg md:text-xl text-gray-500 line-through mb-1">
                  {formattedOriginalPrice}
                </span>
              )}
              <span className="text-3xl md:text-4xl font-black" style={{ color: primaryColor }}>
                {formattedPrice}
              </span>
            </div>

            {product.description && (
              <div className="mb-8">
                <p className={`text-gray-600 leading-relaxed whitespace-pre-wrap ${!isDescExpanded && product.description.length > 200 ? 'line-clamp-3' : ''}`}>
                  {product.description}
                </p>
                {product.description.length > 200 && (
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-sm font-bold mt-2 hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {isDescExpanded ? 'Ler menos' : 'Ler mais'}
                  </button>
                )}
              </div>
            )}

            <hr className="border-gray-100 mb-8" />

            {/* Options and Quantity Wrapper */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Variations */}
              {product.variations && product.variations.length > 0 && (
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-900">Variação (Cor/Tamanho)</h3>
                    {!selectedVariation && <span className="text-xs text-red-500 font-medium">Obrigatório</span>}
                  </div>
                  
                  {product.variations.length > 4 ? (
                    <select
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:ring-2 focus:ring-gray-900 outline-none text-gray-900 font-bold transition-all disabled:opacity-50"
                      value={selectedVariation}
                      onChange={(e) => setSelectedVariation(e.target.value)}
                      disabled={isOutOfStock}
                      style={selectedVariation ? { borderColor: primaryColor } : {}}
                    >
                      <option value="" disabled>Selecione uma opção...</option>
                      {product.variations.map((v: string) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {product.variations.map((v: string) => (
                        <button 
                          key={v}
                          onClick={() => setSelectedVariation(v)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                            selectedVariation === v 
                              ? 'border-transparent text-white shadow-md' 
                              : isOutOfStock 
                                ? 'border-gray-200 text-gray-400 line-through opacity-50 cursor-not-allowed'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                          }`}
                          style={selectedVariation === v ? { backgroundColor: primaryColor } : {}}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="shrink-0 w-full sm:w-auto">
                <h3 className="font-bold text-gray-900 mb-3">Quantidade</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 w-full sm:w-auto justify-between sm:justify-start">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center font-bold text-gray-900 text-lg">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                      disabled={isOutOfStock || (product.stock !== undefined && quantity >= product.stock)}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Estoque Indicator (Moved below if there are variations) */}
            {useStockControl && product.stock !== undefined && product.stock > 0 && (
                <div className="mb-6 -mt-4 text-sm text-gray-500 font-medium">
                  {product.stock} unidades disponíveis no estoque
                </div>
            )}

            <div className="mt-auto flex flex-col gap-3">
              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full py-4 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingCart className="w-5 h-5" />
                Adicionar ao Carrinho
              </button>
              
              <button 
                onClick={handleWhatsAppBuy}
                disabled={isOutOfStock}
                className="w-full py-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                <MessageCircle className="w-5 h-5" />
                Comprar pelo WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Você também pode gostar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  storeSlug={slug || ''}
                  onAddToCart={(prod) => {
                    addItem({
                      productId: prod.id,
                      name: prod.name,
                      price: prod.price || 0,
                      variation: prod.variations?.[0],
                      imageUrl: prod.images?.[0]
                    });
                    alert("Produto adicionado ao carrinho!");
                  }}
                  onClick={() => {
                    // Navigation is handled by the Link inside ProductCard
                  }}
                  resellerPrimaryColor={primaryColor}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* WhatsApp Modal */}
      {showWaModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-full">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#25D366]/10 shrink-0">
                <h3 className="font-bold text-lg text-[#25D366] flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" /> Finalizar pelo WhatsApp
                </h3>
                <button onClick={() => setShowWaModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={submitWhatsAppBuy} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                <input 
                  type="text" 
                  required
                  value={waName}
                  onChange={e => setWaName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#25D366] outline-none"
                  placeholder="Como devemos te chamar?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu WhatsApp</label>
                <input 
                  type="tel" 
                  required
                  value={waPhone}
                  onChange={e => setWaPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#25D366] outline-none"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="mt-2 shrink-0 border-t border-gray-100 pt-4">
                <button 
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2"
                >
                  Enviar Mensagem
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer & Checkout */}
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

      <Checkout
        isOpen={showCheckout}
        onClose={() => { setShowCheckout(false); setShowCart(true); }}
        cart={cart}
        reseller={reseller}
        onSuccess={handleCheckoutSuccess}
        total={total}
        itemCount={totalItems}
      />

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {isZoomModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10 backdrop-blur-md">
            <button 
              onClick={() => setIsZoomModalOpen(false)} 
              className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full flex flex-col items-center justify-center"
            >
              {product.images?.[currentImageIndex] && (
                <img 
                  src={product.images[currentImageIndex]} 
                  alt={product.name}
                  className="max-h-full max-w-full object-contain select-none shadow-2xl"
                  draggable={false}
                />
              )}
              
              {product.images && product.images.length > 1 && (
                <>
                  <button 
                    className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => prev === 0 ? product.images!.length - 1 : prev - 1);
                    }}
                  >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                  <button 
                    className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => prev === product.images!.length - 1 ? 0 : prev + 1);
                    }}
                  >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                </>
              )}
              
              {/* Modal Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/50 backdrop-blur-md rounded-2xl max-w-[90vw] overflow-x-auto hide-scrollbar shadow-xl">
                  {product.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all p-0.5 ${
                        currentImageIndex === idx ? 'border-white ring-1 ring-white' : 'border-transparent opacity-40 hover:opacity-100'
                      }`}
                    >
                      <div className="w-full h-full rounded-lg overflow-hidden bg-gray-900">
                        <ImageWithFallback src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
