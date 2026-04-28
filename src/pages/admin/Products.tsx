import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { BaseProduct, Catalog, Niche } from "../../types";
import { productService } from "../../services/productService";
import { cloudinaryService } from "../../services/cloudinaryService";
import { notificationService } from "../../services/notificationService";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Search,
  AlertCircle,
  Filter,
  Package,
  X,
  Star,
} from "lucide-react";
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
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceBase: 0,
    suggestedPrice: 0,
    sku: "",
    nicheId: "",
    catalogId: "",
    active: true,
  });

  const [variations, setVariations] = useState<string[]>([]);
  const [newVariation, setNewVariation] = useState("");

  // Imagens: URLs já salvas (edição) + novos arquivos selecionados
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const qProducts = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as BaseProduct))
      );
      setLoading(false);
    });

    const qCatalogs = query(
      collection(db, "catalogs"),
      orderBy("order", "asc")
    );
    const unsubCatalogs = onSnapshot(qCatalogs, (snap) => {
      setCatalogs(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Catalog))
      );
    });

    const qNiches = query(collection(db, "niches"), orderBy("name", "asc"));
    const unsubNiches = onSnapshot(qNiches, (snap) => {
      setNiches(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Niche)));
    });

    return () => {
      unsubProducts();
      unsubCatalogs();
      unsubNiches();
    };
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openModal = (product?: BaseProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        priceBase: product.priceBase,
        suggestedPrice: (product as any).suggestedPrice || 0,
        sku: product.sku,
        nicheId: product.nicheId,
        catalogId: product.catalogId,
        active: product.active,
      });
      setVariations(product.variations || []);
      setImageUrls(product.images || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        priceBase: 0,
        suggestedPrice: 0,
        sku: "",
        nicheId: filterNiche !== "all" ? filterNiche : "",
        catalogId: filterCatalog !== "all" ? filterCatalog : "",
        active: true,
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

  // ─── Handlers de imagem ─────────────────────────────────────────────────────

  const addFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    setImageFiles((prev) => [...prev, ...validFiles]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // reset para permitir re-selecionar o mesmo arquivo
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  /** Remove uma URL já salva */
  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  /** Remove um arquivo novo (ainda não enviado) */
  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /** Torna uma URL salva a foto principal (índice 0) */
  const makePrimaryUrl = (index: number) => {
    if (index === 0) return;
    setImageUrls((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.unshift(item);
      return arr;
    });
  };

  /** Torna um arquivo novo a foto principal.
   *  Se existem URLs salvas, move para frente de todos os arquivos
   *  (eles serão concatenados DEPOIS das URLs no array final). */
  const makePrimaryFile = (index: number) => {
    if (index === 0 && imageUrls.length === 0) return;
    setImageFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      // Se não há URLs, vai pro início do array (será a principal).
      // Se há URLs, o primeiro arquivo vira a 1ª depois das URLs.
      arr.unshift(item);
      return arr;
    });
  };

  // ─── Variações ──────────────────────────────────────────────────────────────

  const addVariation = () => {
    const v = newVariation.trim();
    if (v && !variations.includes(v)) {
      setVariations([...variations, v]);
      setNewVariation("");
    }
  };

  const removeVariation = (v: string) => {
    setVariations(variations.filter((x) => x !== v));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nicheId || !formData.catalogId) {
      showToast("error", "Selecione um nicho e um catálogo.");
      return;
    }
    if (imageUrls.length === 0 && imageFiles.length === 0) {
      showToast("error", "Adicione pelo menos uma imagem ao produto.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Faz upload de todos os arquivos novos em paralelo
      const uploadedUrls = await Promise.all(
        imageFiles.map((file) => cloudinaryService.uploadImage(file))
      );

      // URLs salvas primeiro (mantém ordem), depois as recém-enviadas
      const finalImages = [...imageUrls, ...uploadedUrls];

      const payload = {
        ...formData,
        priceBase: Number(formData.priceBase),
        suggestedPrice: Number(formData.suggestedPrice),
        images: finalImages,
        variations,
      };

      if (editingProduct) {
        await productService.updateProduct(
          editingProduct.id,
          editingProduct.catalogId,
          editingProduct.nicheId,
          payload
        );
        showToast("success", "Produto atualizado com sucesso!");
      } else {
        await productService.createProduct(payload);

        const catalogName =
          catalogs.find((c) => c.id === formData.catalogId)?.name ||
          "Catálogos";
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
    if (
      window.confirm(
        `Tem certeza que deseja excluir o produto "${product.name}"?`
      )
    ) {
      try {
        await productService.deleteProduct(
          product.id,
          product.resellersCount || 0,
          product.catalogId,
          product.nicheId
        );
        showToast("success", "Produto excluído com sucesso!");
      } catch (error: any) {
        showToast("error", error.message);
      }
    }
  };

  const toggleStatus = async (product: BaseProduct) => {
    try {
      await productService.toggleProductStatus(product.id, product.active);
      showToast(
        "success",
        `Produto ${product.active ? "desativado" : "ativado"} com sucesso!`
      );
    } catch {
      showToast("error", "Erro ao alterar status do produto.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(s) ||
      product.sku.toLowerCase().includes(s) ||
      (product.description || "").toLowerCase().includes(s);
    const matchesNiche =
      filterNiche === "all" || product.nicheId === filterNiche;
    const matchesCatalog =
      filterCatalog === "all" || product.catalogId === filterCatalog;
    return matchesSearch && matchesNiche && matchesCatalog;
  });

  const availableCatalogs =
    filterNiche === "all"
      ? catalogs
      : catalogs.filter((c) => c.nicheId === filterNiche);

  // Contagem total de imagens no formulário
  const totalImages = imageUrls.length + imageFiles.length;

  return (
    <>
      <div className="space-y-8">
        {/* Cabeçalho + Filtros */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produtos Base</h1>
            <p className="text-gray-500">
              Gerencie os produtos mestres da plataforma
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto flex-wrap">
            <div className="relative w-full sm:w-auto">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterNiche}
                onChange={(e) => {
                  setFilterNiche(e.target.value);
                  setFilterCatalog("all");
                }}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium text-gray-700"
              >
                <option value="all">Todos os Nichos</option>
                {niches.map((niche) => (
                  <option key={niche.id} value={niche.id}>
                    {niche.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterCatalog}
                onChange={(e) => setFilterCatalog(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium text-gray-700"
              >
                <option value="all">Todos os Catálogos</option>
                {availableCatalogs.map((catalog) => (
                  <option key={catalog.id} value={catalog.id}>
                    {catalog.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => openModal()}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> Novo Produto
            </button>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500 mt-2">
              Não há produtos que correspondam aos filtros selecionados.
            </p>
            <button
              onClick={() => openModal()}
              className="mt-6 bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors"
            >
              Criar Produto
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Catálogo
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Preço Base
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Fotos
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Lojas
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => {
                    const catalog = catalogs.find(
                      (c) => c.id === product.catalogId
                    );
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            {/* Mini-galeria: mostra até 3 thumbs */}
                            <div className="flex -space-x-2 shrink-0">
                              {(product.images || [])
                                .slice(0, 3)
                                .map((img, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border-2 border-white shrink-0 ${idx === 0 ? "ring-2 ring-blue-400" : ""}`}
                                    style={{ zIndex: 3 - idx }}
                                  >
                                    <img
                                      src={img}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                ))}
                              {(product.images || []).length === 0 && (
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-gray-900 block line-clamp-1">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md">
                            {product.sku}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                            {catalog?.name || "Sem Catálogo"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-gray-900">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(product.priceBase)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">
                            <ImageIcon className="w-3 h-3" />
                            {(product.images || []).length}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm">
                            {product.resellersCount || 0}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleStatus(product)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              product.active
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {product.active ? "Ativo" : "Inativo"}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(product)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* ── Modal Criar / Editar ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-8"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingProduct ? "Editar Produto" : "Novo Produto"}
                    </h2>
                    {totalImages > 0 && (
                      <p className="text-sm text-gray-400 mt-0.5">
                        {totalImages}{" "}
                        {totalImages === 1 ? "foto adicionada" : "fotos adicionadas"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Coluna Esquerda: Galeria de Fotos ── */}
                    <div className="lg:col-span-1 space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Fotos do Produto
                          </label>
                          {totalImages > 0 && (
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                              {totalImages} foto{totalImages > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* Drop zone */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                            isDragging
                              ? "border-blue-500 bg-blue-50 scale-[1.02]"
                              : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/40"
                          }`}
                        >
                          <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-2">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            {isDragging
                              ? "Solte as imagens aqui"
                              : "Clique ou arraste fotos"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG até 5 MB · Sem limite de quantidade
                          </p>
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />

                        {/* Grade de previews */}
                        {totalImages > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {/* URLs já salvas */}
                            {imageUrls.map((url, idx) => (
                              <div
                                key={`url-${idx}`}
                                className={`relative aspect-square rounded-xl overflow-hidden group border-2 transition-all ${
                                  idx === 0
                                    ? "border-blue-500"
                                    : "border-gray-200"
                                }`}
                              >
                                <img
                                  src={url}
                                  alt={`Foto ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 0 && (
                                  <div className="absolute top-1 left-1 flex items-center gap-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    <Star className="w-2.5 h-2.5" fill="white" />
                                    Principal
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                                  {idx !== 0 && (
                                    <button
                                      type="button"
                                      onClick={() => makePrimaryUrl(idx)}
                                      className="bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-yellow-50 transition-colors w-full text-center"
                                    >
                                      ★ Principal
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeImageUrl(idx)}
                                    className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Novos arquivos */}
                            {imageFiles.map((file, idx) => {
                              const isPrimary =
                                imageUrls.length === 0 && idx === 0;
                              return (
                                <div
                                  key={`file-${idx}`}
                                  className={`relative aspect-square rounded-xl overflow-hidden group border-2 transition-all ${
                                    isPrimary
                                      ? "border-blue-500"
                                      : "border-gray-200"
                                  }`}
                                >
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Nova foto ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {isPrimary && (
                                    <div className="absolute top-1 left-1 flex items-center gap-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                      <Star className="w-2.5 h-2.5" fill="white" />
                                      Principal
                                    </div>
                                  )}
                                  {/* Badge "novo" */}
                                  <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                    Novo
                                  </div>
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                                    {!isPrimary && (
                                      <button
                                        type="button"
                                        onClick={() => makePrimaryFile(idx)}
                                        className="bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-yellow-50 transition-colors w-full text-center"
                                      >
                                        ★ Principal
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeImageFile(idx)}
                                      className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Botão para adicionar mais */}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1 transition-all"
                            >
                              <Plus className="w-5 h-5 text-gray-400" />
                              <span className="text-[10px] text-gray-400 font-medium">
                                Adicionar
                              </span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Toggle Ativo */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <p className="font-medium text-gray-900">
                            Produto Ativo
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Visível nos catálogos
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.active}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                active: e.target.checked,
                              })
                            }
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    </div>

                    {/* ── Coluna Direita: Dados do Produto ── */}
                    <div className="lg:col-span-2 space-y-5">
                      {/* Nicho + Catálogo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nicho
                          </label>
                          <select
                            required
                            value={formData.nicheId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nicheId: e.target.value,
                                catalogId: "",
                              })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all appearance-none"
                          >
                            <option value="" disabled>
                              Selecione um nicho...
                            </option>
                            {niches.map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catálogo
                          </label>
                          <select
                            required
                            value={formData.catalogId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                catalogId: e.target.value,
                              })
                            }
                            disabled={!formData.nicheId}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <option value="" disabled>
                              Selecione um catálogo...
                            </option>
                            {catalogs
                              .filter((c) => c.nicheId === formData.nicheId)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Nome */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome do Produto
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Ex: Camiseta Básica Algodão"
                        />
                      </div>

                      {/* Descrição */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                          placeholder="Detalhes do produto, material, etc..."
                        />
                      </div>

                      {/* Preços + SKU */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preço Base (R$)
                          </label>
                          <input
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.priceBase}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                priceBase: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preço Sugerido (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.suggestedPrice || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                suggestedPrice:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU
                          </label>
                          <input
                            required
                            type="text"
                            value={formData.sku}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sku: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
                            placeholder="EX: CAM-BAS-001"
                          />
                        </div>
                      </div>

                      {/* Variações */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Variações (Tamanhos, Cores, etc)
                        </label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newVariation}
                            onChange={(e) => setNewVariation(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addVariation())
                            }
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ex: P, M, G, Azul, Vermelho..."
                          />
                          <button
                            type="button"
                            onClick={addVariation}
                            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                          >
                            Adicionar
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {variations.map((v) => (
                            <span
                              key={v}
                              className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-200"
                            >
                              {v}
                              <button
                                type="button"
                                onClick={() => removeVariation(v)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {variations.length === 0 && (
                            <span className="text-sm text-gray-400 italic">
                              Nenhuma variação adicionada.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-6 border-t border-gray-100">
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
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Salvar Produto"
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 ${
              toastMessage.type === "success"
                ? "bg-gray-900 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toastMessage.type === "success" ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
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
