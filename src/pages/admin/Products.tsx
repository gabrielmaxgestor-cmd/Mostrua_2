import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { BaseProduct, Catalog, Niche } from "../../types";
import { productService } from "../../services/productService";
import { cloudinaryService } from "../../services/cloudinaryService";
import { notificationService } from "../../services/notificationService";
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2, Search, AlertCircle, Filter, Package, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Products = () => {
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BaseProduct | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiche, setFilterNiche] = useState<string>("all");
  const [filterCatalog, setFilterCatalog] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceBase: 0,
    sku: "",
    nicheId: "",
    catalogId: "",
    active: true,
  });

  const [variations, setVariations] = useState<string[]>([]);
  const [newVariation, setNewVariation] = useState("");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as BaseProduct)));
      setLoading(false);
    });

    const qCatalogs = query(collection(db, "catalogs"), orderBy("order", "asc"));
    const unsubCatalogs = onSnapshot(qCatalogs, (snap) => {
      setCatalogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Catalog)));
    });

    const qNiches = query(collection(db, "niches"), orderBy("name", "asc"));
    const unsubNiches = onSnapshot(qNiches, (snap) => {
      setNiches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Niche)));
    });

    return () => { unsubProducts(); unsubCatalogs(); unsubNiches(); };
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openModal = (product?: BaseProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        priceBase: product.priceBase,
        sku: product.sku,
        nicheId: product.nicheId,
        catalogId: product.catalogId,
        active: product.active
      });
      setVariations(product.variations || []);
      setImageUrls(product.images || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        priceBase: 0,
        sku: "",
        nicheId: filterNiche !== "all" ? filterNiche : "",
        catalogId: filterCatalog !== "all" ? filterCatalog : "",
        active: true
      });
      setVariations([]);
      setImageUrls([]);
    }
    setImageFiles([]);
    setNewVariation("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImageFiles([]);
    setImageUrls([]);
    setVariations([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      setImageFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const makePrimaryUrl = (index: number) => {
    if (index === 0) return;
    setImageUrls(prev => {
      const newUrls = [...prev];
      const [moved] = newUrls.splice(index, 1);
      newUrls.unshift(moved);
      return newUrls;
    });
  };

  const makePrimaryFile = (index: number) => {
    if (index === 0 && imageUrls.length === 0) return;
    setImageFiles(prev => {
      const newFiles = [...prev];
      const [moved] = newFiles.splice(index, 1);
      newFiles.unshift(moved);
      return newFiles;
    });
  };

  const addVariation = () => {
    if (newVariation.trim() && !variations.includes(newVariation.trim())) {
      setVariations([...variations, newVariation.trim()]);
      setNewVariation("");
    }
  };

  const removeVariation = (variationToRemove: string) => {
    setVariations(variations.filter(v => v !== variationToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nicheId || !formData.catalogId) {
      showToast("error", "Selecione um nicho e um catálogo.");
      return;
    }
    if (imageUrls.length === 0 && imageFiles.length === 0) {
      showToast("error", "Adicione pelo menos uma imagem.");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedUrls = await Promise.all(
        imageFiles.map(file => cloudinaryService.uploadImage(file))
      );

      const finalImages = [...imageUrls, ...uploadedUrls];

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, editingProduct.catalogId, editingProduct.nicheId, {
          ...formData,
          priceBase: Number(formData.priceBase),
          images: finalImages,
          variations
        });
        showToast("success", "Produto atualizado com sucesso!");
      } else {
        await productService.createProduct({
          ...formData,
          priceBase: Number(formData.priceBase),
          images: finalImages,
          variations
        });

        const catalogName = catalogs.find(c => c.id === formData.catalogId)?.name || 'Catálogos';
        await notificationService.notifyNicheUpdate(
          formData.nicheId,
          "Novo Produto Disponível! 📦",
          `O produto "${formData.name}" foi adicionado em ${catalogName}. Adicione à sua loja agora!`,
          "/dashboard/catalogs"
        );

        showToast("success", "Produto criado com sucesso!");
      }
      closeModal();
    } catch (error: any) {
      console.error("Error saving product:", error);
      showToast("error", error.message || "Erro ao salvar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: BaseProduct) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      try {
        await productService.deleteProduct(product.id, product.resellersCount || 0, product.catalogId, product.nicheId);
        showToast("success", "Produto excluído com sucesso!");
      } catch (error: any) {
        showToast("error", error.message);
      }
    }
  };

  const toggleStatus = async (product: BaseProduct) => {
    try {
      await productService.toggleProductStatus(product.id, product.active);
      showToast("success", `Produto ${product.active ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error: any) {
      showToast("error", "Erro ao alterar status do produto.");
    }
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
                          product.sku.toLowerCase().includes(searchLower) ||
                          (product.description || "").toLowerCase().includes(searchLower);
    const matchesNiche = filterNiche === "all" || product.nicheId === filterNiche;
    const matchesCatalog = filterCatalog === "all" || product.catalogId === filterCatalog;
    return matchesSearch && matchesNiche && matchesCatalog;
  });

  const availableCatalogs = filterNiche === "all"
    ? catalogs
    : catalogs.filter(c => c.nicheId === filterNiche);

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Produtos Base</h1>
            <p className="text-white/50">Gerencie os produtos mestres da plataforma</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto flex-wrap">
            <div className="relative w-full sm:w-auto">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Buscar produtos ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <select
                value={filterNiche}
                onChange={(e) => {
                  setFilterNiche(e.target.value);
                  setFilterCatalog("all");
                }}
                className="w-full pl-10 pr-8 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-[#13131C] font-medium text-white/70"
              >
                <option value="all">Todos os Nichos</option>
                {niches.map(niche => (
                  <option key={niche.id} value={niche.id}>{niche.name}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <select
                value={filterCatalog}
                onChange={(e) => setFilterCatalog(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-[#13131C] font-medium text-white/70"
              >
                <option value="all">Todos os Catálogos</option>
                {availableCatalogs.map(catalog => (
                  <option key={catalog.id} value={catalog.id}>{catalog.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => openModal()}
              className="w-full sm:w-auto bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> Novo Produto
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#13131C] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="h-6 bg-[#1A1A2E] rounded w-48 animate-pulse"></div>
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-[#0A0A0F] rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#13131C] rounded-3xl border border-dashed border-white/10">
            <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">Nenhum produto encontrado</h3>
            <p className="text-white/50 mt-2">
              Não há produtos que correspondam aos filtros selecionados.
            </p>
            <button
              onClick={() => openModal()}
              className="mt-6 bg-orange-500/10 text-orange-500 px-6 py-2 rounded-xl font-bold hover:bg-orange-100 transition-colors"
            >
              Criar Produto
            </button>
          </div>
        ) : (
          <div className="bg-[#13131C] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0A0A0F]/50 border-b border-white/5">
                    <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Produto</th>
                    <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">SKU</th>
                    <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Catálogo</th>
                    <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Preço Base</th>
                    <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider text-center">Lojas</th>
                    <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map(product => {
                    const catalog = catalogs.find(c => c.id === product.catalogId);
                    return (
                      <tr key={product.id} className="hover:bg-[#0A0A0F]/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#13131C] shrink-0">
                              <img
                                src={product.images?.[0] || "https://picsum.photos/seed/product/100/100"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {product.images?.length > 1 && (
                                <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] font-bold px-1 rounded-tl-md leading-4">
                                  +{product.images.length - 1}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-white block line-clamp-1">{product.name}</span>
                              <span className="text-xs text-white/40">{product.images?.length || 0} foto{(product.images?.length || 0) !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs text-white/50 font-mono bg-[#13131C] px-2 py-1 rounded-md">
                            {product.sku}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-bold">
                            {catalog?.name || "Sem Catálogo"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.priceBase)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#13131C] text-white/70 font-bold text-sm">
                            {product.resellersCount || 0}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleStatus(product)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              product.active
                                ? 'bg-green-100 text-green-400 hover:bg-green-200'
                                : 'bg-[#13131C] text-white/60 hover:bg-[#1A1A2E]'
                            }`}
                          >
                            {product.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(product)}
                              className="p-2 text-white/40 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-2 text-white/40 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#0A0A0F]/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#13131C] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#13131C] z-10">
                  <h2 className="text-2xl font-bold text-white">
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </h2>
                  <button onClick={closeModal} className="text-white/40 hover:text-white/60 bg-[#0A0A0F] hover:bg-[#13131C] p-2 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna Esquerda: Imagens */}
                    <div className="lg:col-span-1 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Imagens do Produto</label>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          className="border-2 border-dashed border-white/20 hover:border-orange-500 bg-[#0A0A0F] hover:bg-orange-500/10/50 rounded-2xl p-6 text-center cursor-pointer transition-all mb-4"
                        >
                          <div className="w-12 h-12 bg-[#13131C] rounded-full shadow-sm flex items-center justify-center mx-auto mb-3">
                            <ImageIcon className="w-6 h-6 text-white/40" />
                          </div>
                          <span className="text-sm font-medium text-white/70 block">Clique ou arraste imagens aqui</span>
                          <span className="text-xs text-white/40 mt-1 block">PNG, JPG até 5MB (Múltiplas permitidas)</span>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />

                        {/* Preview de Imagens */}
                        {(imageUrls.length > 0 || imageFiles.length > 0) && (
                          <div className="grid grid-cols-2 gap-3">
                            {imageUrls.map((url, index) => (
                              <div key={`url-${index}`} className={`relative aspect-square rounded-xl overflow-hidden group border-2 ${index === 0 ? 'border-orange-500' : 'border-white/10'}`}>
                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                {index === 0 && (
                                  <div className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Principal
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  {index !== 0 && (
                                    <button
                                      type="button"
                                      onClick={() => makePrimaryUrl(index)}
                                      className="bg-[#13131C] text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-[#13131C] transition-colors"
                                    >
                                      Tornar Principal
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeImageUrl(index)}
                                    className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {imageFiles.map((file, index) => {
                              const isPrimary = imageUrls.length === 0 && index === 0;
                              return (
                                <div key={`file-${index}`} className={`relative aspect-square rounded-xl overflow-hidden group border-2 ${isPrimary ? 'border-orange-500' : 'border-white/10'}`}>
                                  <img src={URL.createObjectURL(file)} alt={`New Preview ${index}`} className="w-full h-full object-cover" />
                                  {isPrimary && (
                                    <div className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      Principal
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    {!isPrimary && (
                                      <button
                                        type="button"
                                        onClick={() => makePrimaryFile(index)}
                                        className="bg-[#13131C] text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-[#13131C] transition-colors"
                                      >
                                        Tornar Principal
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeImageFile(index)}
                                      className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#0A0A0F] rounded-2xl border border-white/5">
                        <div>
                          <p className="font-medium text-white">Produto Ativo</p>
                          <p className="text-xs text-white/50 mt-0.5">Visível nos catálogos</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.active}
                            onChange={e => setFormData({...formData, active: e.target.checked})}
                          />
                          <div className="w-11 h-6 bg-[#1A1A2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#13131C] after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>

                    {/* Coluna Direita: Dados do Produto */}
                    <div className="lg:col-span-2 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1">Nicho</label>
                          <select
                            required
                            value={formData.nicheId}
                            onChange={e => {
                              setFormData({...formData, nicheId: e.target.value, catalogId: ""});
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none bg-[#13131C] transition-all appearance-none"
                          >
                            <option value="" disabled>Selecione um nicho...</option>
                            {niches.map(n => (
                              <option key={n.id} value={n.id}>{n.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1">Catálogo</label>
                          <select
                            required
                            value={formData.catalogId}
                            onChange={e => setFormData({...formData, catalogId: e.target.value})}
                            disabled={!formData.nicheId}
                            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none bg-[#13131C] transition-all appearance-none disabled:bg-[#13131C] disabled:text-white/40"
                          >
                            <option value="" disabled>Selecione um catálogo...</option>
                            {catalogs.filter(c => c.nicheId === formData.nicheId).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Nome do Produto</label>
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                          placeholder="Ex: Camiseta Básica Algodão"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Descrição</label>
                        <textarea
                          required
                          rows={4}
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                          placeholder="Detalhes do produto, material, etc..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1">Preço Base (R$)</label>
                          <input
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.priceBase}
                            onChange={e => setFormData({...formData, priceBase: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1">Preço Sugerido (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={(formData as any).suggestedPrice || ""}
                            onChange={e => setFormData({...formData, suggestedPrice: parseFloat(e.target.value) || 0} as any)}
                            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1">SKU</label>
                          <input
                            required
                            type="text"
                            value={formData.sku}
                            onChange={e => setFormData({...formData, sku: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none transition-all uppercase"
                            placeholder="EX: CAM-BAS-001"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Variações (Tamanhos, Cores, etc)</label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newVariation}
                            onChange={e => setNewVariation(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariation())}
                            className="flex-1 px-4 py-3 rounded-xl bg-[#0A0A0F] border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                            placeholder="Ex: P, M, G, Azul, Vermelho..."
                          />
                          <button
                            type="button"
                            onClick={addVariation}
                            className="bg-[#0A0A0F] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#13131C] transition-colors"
                          >
                            Adicionar
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {variations.map(variation => (
                            <span key={variation} className="bg-[#13131C] text-white/90 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-white/10">
                              {variation}
                              <button type="button" onClick={() => removeVariation(variation)} className="text-white/40 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {variations.length === 0 && (
                            <span className="text-sm text-white/40 italic">Nenhuma variação adicionada.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-white/5 mt-8">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-3.5 rounded-xl font-bold bg-[#13131C] text-white/70 hover:bg-[#1A1A2E] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Produto"}
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
              toastMessage.type === 'success' ? 'bg-[#0A0A0F] text-white' : 'bg-red-600 text-white'
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
