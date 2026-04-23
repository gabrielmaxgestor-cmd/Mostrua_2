import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { Catalog, Niche } from "../../types";
import { catalogService } from "../../services/catalogService";
import { storageService } from "../../services/storageService";
import { Plus, Settings, Edit, Trash2, Image as ImageIcon, Loader2, Search, AlertCircle, Filter, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Catalogs = () => {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiche, setFilterNiche] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    bannerUrl: "",
    nicheId: "",
    active: true,
    order: 0
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const qCatalogs = query(collection(db, "catalogs"), orderBy("order", "asc"));
    const unsubCatalogs = onSnapshot(qCatalogs, (snap) => {
      setCatalogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Catalog)));
      setLoading(false);
    });

    const qNiches = query(collection(db, "niches"), orderBy("name", "asc"));
    const unsubNiches = onSnapshot(qNiches, (snap) => {
      setNiches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Niche)));
    });

    return () => { unsubCatalogs(); unsubNiches(); };
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openModal = (catalog?: Catalog) => {
    if (catalog) {
      setEditingCatalog(catalog);
      setFormData({
        name: catalog.name,
        description: catalog.description,
        imageUrl: catalog.imageUrl,
        bannerUrl: catalog.bannerUrl || "",
        nicheId: catalog.nicheId,
        active: catalog.active,
        order: catalog.order
      });
      setImagePreview(catalog.imageUrl);
      setBannerPreview(catalog.bannerUrl || "");
    } else {
      setEditingCatalog(null);
      setFormData({ 
        name: "", 
        description: "", 
        imageUrl: "", 
        bannerUrl: "",
        nicheId: filterNiche !== "all" ? filterNiche : "", 
        active: true,
        order: catalogs.length > 0 ? Math.max(...catalogs.map(c => c.order)) + 1 : 0
      });
      setImagePreview("");
      setBannerPreview("");
    }
    setImageFile(null);
    setBannerFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCatalog(null);
    setImageFile(null);
    setImagePreview("");
    setBannerFile(null);
    setBannerPreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nicheId) {
      showToast("error", "Selecione um nicho para o catálogo.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;
      let finalBannerUrl = formData.bannerUrl;

      const uploadPromises = [];
      if (imageFile) {
        uploadPromises.push(
          storageService.uploadImage(imageFile, "catalogs").then(url => { finalImageUrl = url; })
        );
      }
      if (bannerFile) {
        uploadPromises.push(
          storageService.uploadImage(bannerFile, "catalogs_banners").then(url => { finalBannerUrl = url; })
        );
      }
      
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      const selectedNiche = niches.find(n => n.id === formData.nicheId);
      const nicheName = selectedNiche ? selectedNiche.name : "";

      if (editingCatalog) {
        await catalogService.updateCatalog(editingCatalog.id, editingCatalog.nicheId, {
          name: formData.name,
          description: formData.description,
          imageUrl: finalImageUrl,
          bannerUrl: finalBannerUrl,
          nicheId: formData.nicheId,
          nicheName: nicheName,
          active: formData.active,
          order: Number(formData.order)
        });
        showToast("success", "Catálogo atualizado com sucesso!");
      } else {
        if (!finalImageUrl) {
          throw new Error("A imagem do catálogo é obrigatória.");
        }
        await catalogService.createCatalog({
          name: formData.name,
          description: formData.description,
          imageUrl: finalImageUrl,
          bannerUrl: finalBannerUrl,
          nicheId: formData.nicheId,
          nicheName: nicheName,
          active: formData.active,
          order: Number(formData.order)
        });
        showToast("success", "Catálogo criado com sucesso!");
      }
      closeModal();
    } catch (error: any) {
      console.error("Error saving catalog:", error);
      showToast("error", error.message || "Erro ao salvar catálogo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (catalog: Catalog) => {
    if (window.confirm(`Tem certeza que deseja excluir o catálogo "${catalog.name}"?`)) {
      try {
        await catalogService.deleteCatalog(catalog.id, catalog.productsCount || 0, catalog.nicheId);
        showToast("success", "Catálogo excluído com sucesso!");
      } catch (error: any) {
        showToast("error", error.message);
      }
    }
  };

  const toggleStatus = async (catalog: Catalog) => {
    try {
      await catalogService.toggleCatalogStatus(catalog.id, catalog.active);
      showToast("success", `Catálogo ${catalog.active ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error: any) {
      showToast("error", "Erro ao alterar status do catálogo.");
    }
  };

  const filteredCatalogs = catalogs.filter(catalog => {
    const matchesSearch = catalog.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          catalog.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche = filterNiche === "all" || catalog.nicheId === filterNiche;
    return matchesSearch && matchesNiche;
  });

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catálogos</h1>
            <p className="text-gray-500">Agrupe produtos por coleções e nichos</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar catálogos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterNiche}
                onChange={(e) => setFilterNiche(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium text-gray-700"
              >
                <option value="all">Todos os Nichos</option>
                {niches.map(niche => (
                  <option key={niche.id} value={niche.id}>{niche.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => openModal()}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> Novo Catálogo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : filteredCatalogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Nenhum catálogo encontrado</h3>
            <p className="text-gray-500 mt-2">
              {filterNiche !== "all" 
                ? "Não há catálogos para o nicho selecionado." 
                : "Comece criando o primeiro catálogo da plataforma."}
            </p>
            <button 
              onClick={() => openModal()}
              className="mt-6 bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors"
            >
              Criar Catálogo
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Catálogo</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Nicho</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Produtos</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Ordem</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCatalogs.map(catalog => (
                    <tr key={catalog.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <img 
                              src={catalog.imageUrl || "https://picsum.photos/seed/catalog/100/100"} 
                              alt={catalog.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="font-bold text-gray-900">{catalog.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
                          {catalog.nicheName || "Nicho Indefinido"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-500 line-clamp-2 max-w-xs">{catalog.description}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm">
                          {catalog.productsCount || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-bold text-gray-700">{catalog.order}</span>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => toggleStatus(catalog)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            catalog.active 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {catalog.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openModal(catalog)} 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(catalog)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCatalog ? "Editar Catálogo" : "Novo Catálogo"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda: Imagem e Status */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Imagem de Capa</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${
                          imagePreview ? 'border-gray-200' : 'border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50/50'
                        }`}
                      >
                        {imagePreview ? (
                          <div className="relative aspect-[4/3]">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-white font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                <ImageIcon className="w-4 h-4" /> Trocar
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[4/3] flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Clique para fazer upload</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</span>
                            <span className="text-xs text-gray-400 mt-1">Proporção ideal: 4:3</span>
                          </div>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Imagem de Banner (Opcional)</label>
                      <div 
                        onClick={() => bannerInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all ${
                          bannerPreview ? 'border-gray-200' : 'border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50/50'
                        }`}
                      >
                        {bannerPreview ? (
                          <div className="relative aspect-[3/1]">
                            <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-white font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                <ImageIcon className="w-4 h-4" /> Trocar Banner
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[3/1] flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Upload do Banner</span>
                            <span className="text-xs text-gray-400 mt-1">Proporção ideal: 3:1 (ex: 1200x400)</span>
                          </div>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={bannerInputRef} 
                        onChange={handleBannerChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Catálogo Ativo</p>
                        <p className="text-xs text-gray-500 mt-0.5">Visível para revendedores</p>
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
                  </div>

                  {/* Coluna Direita: Dados de Texto */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nicho de Mercado</label>
                      <select 
                        required
                        value={formData.nicheId} 
                        onChange={e => setFormData({...formData, nicheId: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all appearance-none"
                      >
                        <option value="" disabled>Selecione um nicho...</option>
                        {niches.map(n => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Catálogo</label>
                      <input 
                        required
                        type="text"
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                        placeholder="Ex: Coleção Verão 2026"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <textarea 
                        required
                        rows={4}
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                        placeholder="Descreva o foco deste catálogo..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de Exibição</label>
                      <input 
                        required
                        type="number"
                        min="0"
                        value={formData.order} 
                        onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Números menores aparecem primeiro.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                  <button 
                    type="button"
                    onClick={closeModal} 
                    className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Catálogo"}
                  </button>
                </div>
              </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 ${
              toastMessage.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <AlertCircle className="w-6 h-6 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
