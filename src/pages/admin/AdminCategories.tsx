import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { Plus, Edit, Trash2, Search, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", active: true });

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (category: any = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || "", active: category.active });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", description: "", active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return alert("O nome é obrigatório");
    
    try {
      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), formData);
      } else {
        await addDoc(collection(db, "categories"), {
          ...formData,
          createdAt: new Date()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Erro ao salvar categoria");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await deleteDoc(doc(db, "categories", id));
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Erro ao excluir categoria");
      }
    }
  };

  const toggleStatus = async (category: any) => {
    try {
      await updateDoc(doc(db, "categories", category.id), { active: !category.active });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Categorias</h1>
          <p className="text-white/50">Gerencie as categorias de produtos globais</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar categorias..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="w-full sm:w-auto bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Nova Categoria
          </button>
        </div>
      </div>

      <div className="bg-[#13131C] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0F]/50 border-b border-white/5">
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Categoria</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Descrição</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-white/50">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Tag className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white">Nenhuma categoria</h3>
                    <p className="text-white/50">Comece criando a primeira categoria.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map(category => (
                  <tr key={category.id} className="hover:bg-[#0A0A0F]/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-white">{category.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-white/50">{category.description || "-"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => toggleStatus(category)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          category.active 
                            ? 'bg-green-100 text-green-400 hover:bg-green-200' 
                            : 'bg-[#13131C] text-white/60 hover:bg-[#1A1A2E]'
                        }`}
                      >
                        {category.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(category)} 
                          className="p-2 text-white/40 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)} 
                          className="p-2 text-white/40 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#13131C] rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-full"
              >
                <h2 className="text-2xl font-bold text-white mb-6 shrink-0">
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </h2>
                
                <div className="space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-1">Nome da Categoria</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Eletrônicos"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-1">Descrição (Opcional)</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none h-24"
                    placeholder="Breve descrição da categoria"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="active"
                    checked={formData.active}
                    onChange={e => setFormData({...formData, active: e.target.checked})}
                    className="w-5 h-5 text-orange-500 rounded border-white/20 focus:ring-orange-500"
                  />
                  <label htmlFor="active" className="font-medium text-white/70">Categoria Ativa</label>
                </div>
              </div>

              <div className="flex gap-3 mt-8 shrink-0 pb-2 border-t pt-4 border-white/5">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white/60 bg-[#13131C] hover:bg-[#1A1A2E] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
