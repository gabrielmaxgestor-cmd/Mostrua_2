import React, { useState, useEffect } from "react";
import { Plus, Edit2, Search, Loader2, X, CheckCircle } from "lucide-react";
import { Category, Niche, Catalog } from "../../types";
import { getCategoriesByCatalog, createCategory, updateCategory } from "../../services/categoryService";
import { nicheService } from "../../services/nicheService";
import { catalogService } from "../../services/catalogService";

export const Categories = () => {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedNicheId, setSelectedNicheId] = useState<string>("");
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    nicheId: "",
    catalogId: "",
    order: 0,
    status: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNiches();
  }, []);

  useEffect(() => {
    if (selectedNicheId) {
      fetchCatalogs(selectedNicheId);
    } else {
      setCatalogs([]);
      setSelectedCatalogId("");
    }
  }, [selectedNicheId]);

  useEffect(() => {
    if (selectedCatalogId) {
      fetchCategories(selectedCatalogId);
    } else {
      setCategories([]);
    }
  }, [selectedCatalogId]);

  const fetchNiches = async () => {
    try {
      const data = await nicheService.getNiches();
      setNiches(data);
    } catch (err) {
      showToast("Erro ao buscar nichos", "error");
    }
  };

  const fetchCatalogs = async (nicheId: string) => {
    try {
      const data = await catalogService.getCatalogsByNiche(nicheId);
      setCatalogs(data);
    } catch (err) {
      showToast("Erro ao buscar catálogos", "error");
    }
  };

  const fetchCategories = async (catalogId: string) => {
    setLoading(true);
    try {
      const data = await getCategoriesByCatalog(catalogId);
      setCategories(data);
    } catch (err) {
      showToast("Erro ao buscar categorias", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        nicheId: category.nicheId,
        catalogId: category.catalogId,
        order: category.order,
        status: category.status
      });
      // Ensure catalogs are loaded for the edit form if not already
      if (category.nicheId !== selectedNicheId) {
        fetchCatalogs(category.nicheId);
      }
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        nicheId: selectedNicheId || "",
        catalogId: selectedCatalogId || "",
        order: categories.length + 1,
        status: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nicheId || !formData.catalogId) {
      showToast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
        showToast("Categoria atualizada com sucesso", "success");
      } else {
        await createCategory(formData);
        showToast("Categoria criada com sucesso", "success");
      }
      
      if (selectedCatalogId === formData.catalogId) {
        fetchCategories(selectedCatalogId);
      }
      closeModal();
    } catch (err) {
      showToast("Erro ao salvar categoria", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      await updateCategory(category.id, { status: !category.status });
      setCategories(categories.map(c => c.id === category.id ? { ...c, status: !c.status } : c));
      showToast("Status atualizado", "success");
    } catch (err) {
      showToast("Erro ao atualizar status", "error");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 mt-1">Gerencie as categorias dos catálogos</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Nicho</label>
          <select 
            value={selectedNicheId}
            onChange={(e) => setSelectedNicheId(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="">Selecione um nicho...</option>
            {niches.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Catálogo</label>
          <select 
            value={selectedCatalogId}
            onChange={(e) => setSelectedCatalogId(e.target.value)}
            disabled={!selectedNicheId}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Selecione um catálogo...</option>
            {catalogs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : !selectedCatalogId ? (
          <div className="p-12 text-center text-gray-500">
            Selecione um nicho e um catálogo para ver as categorias.
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhuma categoria encontrada neste catálogo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Ordem</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Nome</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-500 font-medium">{category.order}</td>
                    <td className="p-4 font-medium text-gray-900">{category.name}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(category)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${category.status ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${category.status ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => openModal(category)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">
                {editingId ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nicho</label>
                <select 
                  required
                  value={formData.nicheId}
                  onChange={(e) => {
                    setFormData({ ...formData, nicheId: e.target.value, catalogId: "" });
                    fetchCatalogs(e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">Selecione...</option>
                  {niches.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catálogo</label>
                <select 
                  required
                  value={formData.catalogId}
                  onChange={(e) => setFormData({ ...formData, catalogId: e.target.value })}
                  disabled={!formData.nicheId}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none disabled:bg-gray-50"
                >
                  <option value="">Selecione...</option>
                  {catalogs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="Ex: Camisetas"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, status: !formData.status })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.status ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-4 mt-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Categoria"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl text-white font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
};
