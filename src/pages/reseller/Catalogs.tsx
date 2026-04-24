import React, { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, writeBatch, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { useResellerProducts } from "../../hooks/useResellerProducts";
import { cloudinaryService } from "../../services/cloudinaryService";
import { Catalog, BaseProduct } from "../../types";
import { Layers, Loader2, Check, Image as ImageIcon } from "lucide-react";

export const Catalogs = () => {
  const { user } = useAuth();
  const { reseller } = useReseller(user?.uid);
  const { products: resellerProducts } = useResellerProducts(user?.uid);
  
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBannerId, setUploadingBannerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalogs = async () => {
      if (!reseller?.nicheId) return;
      
      try {
        const q = query(
          collection(db, "catalogs"),
          where("nicheId", "==", reseller.nicheId),
          where("active", "==", true)
        );
        const snapshot = await getDocs(q);
        setCatalogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Catalog)));
      } catch (error) {
        console.error("Error fetching catalogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, [reseller?.nicheId]);

  // Verifica se o catálogo está ativo para o revendedor
  // Consideramos ativo se houver pelo menos um produto do catálogo ativo na loja do revendedor
  // Como não temos catalogId no reseller_product, vamos assumir que o status do catálogo
  // é baseado em uma coleção separada ou campo no reseller.
  // Para simplificar, vamos verificar se existe algum produto base desse catálogo
  // que esteja ativo no reseller_products.
  // Isso requer buscar os produtos base do catálogo.
  // Uma abordagem melhor é ter uma coleção reseller_catalogs ou um array no reseller.
  // Vamos usar um array de catalogIds ativos no objeto reseller.settings ou similar,
  // ou buscar os produtos e ver se algum tem o catalogId (se adicionarmos ao reseller_product).
  // Para este MVP, vamos buscar os baseProducts do catálogo e ver se estão no resellerProducts.
  
  const isCatalogActive = (catalogId: string) => {
    // Isso é uma simplificação. O ideal é ter o catalogId no reseller_product.
    // Como não temos, vamos assumir que se o revendedor ativou, ele tem produtos.
    // Vamos usar um estado local para simular por enquanto, ou melhor, 
    // vamos buscar os produtos base do catálogo e ver se estão ativos no resellerProducts.
    // Para evitar muitas queries, vamos apenas verificar se há produtos no resellerProducts
    // que correspondam aos produtos do catálogo.
    // Como isso é complexo sem o catalogId, vamos adicionar catalogId ao reseller_product na criação.
    return resellerProducts.some(rp => rp.active && rp.id.includes(catalogId)); // Assumindo que o ID tem o catalogId, mas não tem.
  };

  // Nova abordagem: vamos buscar os produtos do catálogo quando renderizar
  const [catalogStatus, setCatalogStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.uid || catalogs.length === 0) return;
      
      const status: Record<string, boolean> = {};
      
      for (const catalog of catalogs) {
        // Buscar produtos base do catálogo
        const q = query(collection(db, "products"), where("catalogId", "==", catalog.id));
        const snap = await getDocs(q);
        const baseProductIds = snap.docs.map(d => d.id);
        
        // Verificar se algum desses produtos está ativo no resellerProducts
        const isActive = resellerProducts.some(rp => 
          baseProductIds.includes(rp.baseProductId) && rp.active
        );
        
        status[catalog.id] = isActive;
      }
      
      setCatalogStatus(status);
    };
    
    checkStatus();
  }, [catalogs, resellerProducts, user?.uid]);

  const toggleCatalog = async (catalog: Catalog) => {
    if (!user?.uid) return;
    
    setProcessingId(catalog.id);
    const currentlyActive = catalogStatus[catalog.id];
    
    try {
      const batch = writeBatch(db);
      
      // Buscar produtos base do catálogo
      const q = query(collection(db, "products"), where("catalogId", "==", catalog.id), where("active", "==", true));
      const snap = await getDocs(q);
      const baseProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as BaseProduct));
      
      if (!currentlyActive) {
        // ATIVAR: Criar/Atualizar reseller_products para true
        baseProducts.forEach(bp => {
          const rpId = `${user.uid}_${bp.id}`;
          const rpRef = doc(db, "reseller_products", rpId);
          
          // Verifica se já existe no estado local
          const existing = resellerProducts.find(rp => rp.id === rpId);
          
          if (existing) {
            batch.update(rpRef, { active: true });
          } else {
            batch.set(rpRef, {
              resellerId: user.uid,
              baseProductId: bp.id,
              customName: bp.name,
              customDescription: bp.description,
              customPrice: bp.priceBase,
              active: true,
              featured: false,
              createdAt: new Date()
            });
          }
        });
      } else {
        // DESATIVAR: Atualizar reseller_products para false
        baseProducts.forEach(bp => {
          const rpId = `${user.uid}_${bp.id}`;
          const rpRef = doc(db, "reseller_products", rpId);
          
          const existing = resellerProducts.find(rp => rp.id === rpId);
          if (existing) {
            batch.update(rpRef, { active: false });
          }
        });
      }
      
      await batch.commit();
      
      // Atualizar estado local otimista
      setCatalogStatus(prev => ({ ...prev, [catalog.id]: !currentlyActive }));
      
    } catch (error) {
      console.error("Error toggling catalog:", error);
      alert("Erro ao alterar status do catálogo.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !uploadingBannerId || !user?.uid) return;
    
    const file = e.target.files[0];
    const catalogId = uploadingBannerId;
    setProcessingId(catalogId);
    
    try {
      const bannerUrl = await cloudinaryService.uploadImage(file);
      
      const customBanners = reseller?.settings?.customBanners || {};
      customBanners[catalogId] = bannerUrl;
      
      await updateDoc(doc(db, "resellers", user.uid), {
        "settings.customBanners": customBanners
      });
      
      alert("Banner atualizado com sucesso na loja principal.");
    } catch (error) {
      console.error("Error uploading custom banner:", error);
      alert("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setProcessingId(null);
      setUploadingBannerId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const activeCatalogs = catalogs.filter(c => catalogStatus[c.id]);
  const availableCatalogs = catalogs.filter(c => !catalogStatus[c.id]);

  const renderCatalogCard = (catalog: Catalog, isActive: boolean) => {
    const isProcessing = processingId === catalog.id;
    const customBanner = reseller?.settings?.customBanners?.[catalog.id];
    const displayBanner = customBanner || catalog.bannerUrl || catalog.imageUrl;
    return (
      <div key={catalog.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
        <div className="aspect-video relative bg-gray-100 group">
          {displayBanner ? (
            <img src={displayBanner} alt={catalog.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layers className="w-12 h-12 text-gray-300" />
            </div>
          )}
          
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
            {catalog.productsCount || 0} produtos
          </div>

          {isActive && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => {
                  setUploadingBannerId(catalog.id);
                  fileInputRef.current?.click();
                }}
                disabled={isProcessing}
                className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                {customBanner ? 'Alterar Banner Customizado' : 'Adicionar Banner Customizado'}
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{catalog.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 flex-1">{catalog.description}</p>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className={`text-sm font-bold ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
               {isActive ? 'Ativo na sua loja' : 'Inativo'}
            </span>
            
            <button
              onClick={() => toggleCatalog(catalog)}
              disabled={isProcessing}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                isActive ? 'bg-green-500' : 'bg-gray-200'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogos</h1>
        <p className="text-gray-500">Gerencie os catálogos ativos na sua loja e descubra novos disponibilizados pelos administradores.</p>
      </div>

      {catalogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
          <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Nenhum catálogo disponível</h3>
          <p className="text-gray-500 mt-2">Não há catálogos ativos para o seu nicho no momento.</p>
        </div>
      ) : (
        <>
          {/* Seção: Da sua loja (Ativos) */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Da sua loja (Ativos)
            </h2>
            {activeCatalogs.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
                Você ainda não ativou nenhum catálogo. Ative um abaixo!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCatalogs.map(catalog => renderCatalogCard(catalog, true))}
              </div>
            )}
          </section>

          {/* Seção: Dos Administradores (Disponíveis) */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Dos Administradores (Disponíveis)
            </h2>
            {availableCatalogs.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
                Todos os catálogos disponíveis já estão ativos na sua loja.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCatalogs.map(catalog => renderCatalogCard(catalog, false))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Hidden file input for banner uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleBannerUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};
