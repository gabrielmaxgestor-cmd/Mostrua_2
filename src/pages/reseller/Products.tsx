import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { useResellerProducts } from "../../hooks/useResellerProducts";
import { Catalog, BaseProduct, ResellerProduct } from "../../types";
import { Package, Search, Filter, Loader2, Edit2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Products = () => {
  const { user } = useAuth();
  const { reseller } = useReseller(user?.uid);
  const { products: resellerProducts, loading: rpLoading } = useResellerProducts(user?.uid);
  
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [baseProducts, setBaseProducts] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCatalog, setFilterCatalog] = useState("all");
  
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{rp: ResellerProduct, bp: BaseProduct} | null>(null);
  const [formData, setFormData] = useState({
    customName: "",
    customDescription: "",
    customPrice: 0,
    promotionalPrice: "",
    active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!reseller?.nicheId) return;
      
      try {
        // Buscar catálogos do nicho
        const qCatalogs = query(collection(db, "catalogs"), where("nicheId", "==", reseller.nicheId), where("active", "==", true));
        const snapCatalogs = await getDocs(qCatalogs);
        const catalogsData = snapCatalogs.docs.map(d => ({ id: d.id, ...d.data() } as Catalog));
        setCatalogs(catalogsData);
        
        // Buscar todos os produtos base do nicho
        const qProducts = query(collection(db, "products"), where("nicheId", "==", reseller.nicheId), where("active", "==", true));
        const snapProducts = await getDocs(qProducts);
        setBaseProducts(snapProducts.docs.map(d => ({ id: d.id, ...d.data() } as BaseProduct)));
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reseller?.nicheId]);

  // Combinar produtos base com reseller_products
  const combinedProducts = baseProducts.map(bp => {
    const rp = resellerProducts.find(r => r.baseProductId === bp.id);
    return {
      bp,
      rp: rp || {
        id: `${user?.uid}_${bp.id}`,
        resellerId: user?.uid || "",
        baseProductId: bp.id,
        customName: bp.name,
        customDescription: bp.description,
        customPrice: bp.priceBase,
        active: false, // Se não existe, está inativo
        featured: false
      } as ResellerProduct
    };
  });

  const filteredProducts = combinedProducts.filter(({ bp, rp }) => {
    const matchesSearch = 
      rp.customName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bp.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCatalog = filterCatalog === "all" || bp.catalogId === filterCatalog;
    return matchesSearch && matchesCatalog;
  });

  const handlePriceEditStart = (rp: ResellerProduct) => {
    setEditingPriceId(rp.id);
    setEditPriceValue(rp.customPrice.toString());
  };

  const handlePriceEditSave = async (rp: ResellerProduct, bp: BaseProduct) => {
    if (!user?.uid) return;
    
    const newPrice = parseFloat(editPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      setEditingPriceId(null);
      return;
    }

    try {
      const rpRef = doc(db, "reseller_products", rp.id);
      const exists = resellerProducts.some(r => r.id === rp.id);
      
      if (exists) {
        await updateDoc(rpRef, { customPrice: newPrice });
      } else {
        // Criar se não existir
        await writeBatch(db).set(rpRef, {
          ...rp,
          customPrice: newPrice,
          createdAt: new Date()
        }).commit();
      }
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Erro ao atualizar preço.");
    } finally {
      setEditingPriceId(null);
    }
  };

  const toggleStatus = async (rp: ResellerProduct, bp: BaseProduct) => {
    if (!user?.uid) return;
    
    try {
      const rpRef = doc(db, "reseller_products", rp.id);
      const exists = resellerProducts.some(r => r.id === rp.id);
      
      if (exists) {
        await updateDoc(rpRef, { active: !rp.active });
      } else {
        await writeBatch(db).set(rpRef, {
          ...rp,
          active: true,
          createdAt: new Date()
        }).commit();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Erro ao alterar status.");
    }
  };

  const openModal = (rp: ResellerProduct, bp: BaseProduct) => {
    setEditingProduct({ rp, bp });
    setFormData({
      customName: rp.customName,
      customDescription: rp.customDescription,
      customPrice: rp.customPrice,
      promotionalPrice: rp.promotionalPrice ? rp.promotionalPrice.toString() : "",
      active: rp.active
    });
    setIsModalOpen(true);
  };

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !editingProduct) return;
    
    setIsSubmitting(true);
    try {
      const rpRef = doc(db, "reseller_products", editingProduct.rp.id);
      const exists = resellerProducts.some(r => r.id === editingProduct.rp.id);
      
      const parsedPromo = parseFloat(formData.promotionalPrice);
      const finalPromo = !isNaN(parsedPromo) && parsedPromo > 0 ? parsedPromo : null;

      if (exists) {
        await updateDoc(rpRef, {
          customName: formData.customName,
          customDescription: formData.customDescription,
          customPrice: Number(formData.customPrice),
          promotionalPrice: finalPromo,
          active: formData.active
        });
      } else {
        await writeBatch(db).set(rpRef, {
          ...editingProduct.rp,
          customName: formData.customName,
          customDescription: formData.customDescription,
          customPrice: Number(formData.customPrice),
          promotionalPrice: finalPromo,
          active: formData.active,
          createdAt: new Date()
        }).commit();
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erro ao salvar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || rpLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500">Gerencie os preços e detalhes dos produtos na sua loja.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterCatalog}
              onChange={(e) => setFilterCatalog(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
            >
              <option value="all">Todos os Catálogos</option>
              {catalogs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Catálogo</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Preço Base</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Meu Preço</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(({ bp, rp }) => {
                const catalog = catalogs.find(c => c.id === bp.catalogId);
                const isEditingPrice = editingPriceId === rp.id;
                
                return (
                  <tr key={bp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          {bp.images && bp.images.length > 0 ? (
                            <img src={bp.images[0]} alt={rp.customName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400 m-auto mt-3" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{rp.customName}</p>
                          <p className="text-xs text-gray-500">SKU: {bp.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{catalog?.name || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-sm text-gray-500">R$ {bp.priceBase.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isEditingPrice ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-gray-500">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            onBlur={() => handlePriceEditSave(rp, bp)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePriceEditSave(rp, bp)}
                            autoFocus
                            className="w-24 px-2 py-1 border border-blue-500 rounded-lg outline-none text-right font-bold text-blue-600"
                          />
                        </div>
                      ) : (
                        <div 
                          className="flex flex-col items-end cursor-pointer group"
                          onClick={() => handlePriceEditStart(rp)}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${rp.promotionalPrice ? 'text-gray-400 line-through text-xs' : 'text-gray-900'}`}>
                              R$ {rp.customPrice.toFixed(2)}
                            </span>
                            {!rp.promotionalPrice && <Edit2 className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />}
                          </div>
                          {rp.promotionalPrice && (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">R$ {rp.promotionalPrice.toFixed(2)}</span>
                              <Edit2 className="w-3 h-3 text-gray-300 group-hover:text-green-500 transition-colors" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleStatus(rp, bp)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          rp.active ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            rp.active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => openModal(rp, bp)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Detalhes"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      <AnimatePresence>
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-gray-900">Editar Produto</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                    {editingProduct.bp.images?.[0] ? (
                      <img src={editingProduct.bp.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-300 m-auto mt-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Produto Original</p>
                    <p className="font-bold text-gray-900 line-clamp-1">{editingProduct.bp.name}</p>
                    <p className="text-sm text-gray-600">Preço Base: R$ {editingProduct.bp.priceBase.toFixed(2)}</p>
                  </div>
                </div>

                <form id="editProductForm" onSubmit={handleModalSave} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome na sua loja</label>
                    <input 
                      required
                      type="text"
                      value={formData.customName} 
                      onChange={e => setFormData({...formData, customName: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preço Normal (R$)</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        min={editingProduct.bp.priceBase} // Não pode vender mais barato que o base
                        value={formData.customPrice} 
                        onChange={e => setFormData({...formData, customPrice: parseFloat(e.target.value)})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      />
                      <p className="text-xs text-gray-500 mt-1">Mínimo: R$ {editingProduct.bp.priceBase.toFixed(2)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preço Promocional (R$)</label>
                      <input 
                        type="number"
                        step="0.01"
                        min={editingProduct.bp.priceBase} // Não pode vender mais barato que o base na promo também
                        value={formData.promotionalPrice} 
                        onChange={e => setFormData({...formData, promotionalPrice: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-gray-300 text-green-600 font-bold" 
                        placeholder="Opcional"
                      />
                      <p className="text-xs text-green-600 mt-1">Deixe em branco para remover a oferta.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição customizada</label>
                    <textarea 
                      required
                      rows={4}
                      value={formData.customDescription} 
                      onChange={e => setFormData({...formData, customDescription: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Produto Ativo</p>
                      <p className="text-sm text-gray-500">Mostrar na sua loja pública</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.active}
                        onChange={e => setFormData({...formData, active: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  form="editProductForm"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
