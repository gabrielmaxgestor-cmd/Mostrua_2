import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Niche } from "../../types";
import { nicheService } from "../../services/nicheService";
import { cloudinaryService } from "../../services/cloudinaryService";
import { Plus, Settings, Edit, Trash2, Image as ImageIcon, Loader2, Search, AlertCircle, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const Niches = () => {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNiche, setEditingNiche] = useState<Niche | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "niches"), (snap) => {
      setNiches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Niche)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openModal = (niche?: Niche) => {
    if (niche) {
      setEditingNiche(niche);
      setFormData({
        name: niche.name,
        description: niche.description,
        imageUrl: niche.imageUrl,
        active: niche.active
      });
      setImagePreview(niche.imageUrl);
    } else {
      setEditingNiche(null);
      setFormData({ name: "", description: "", imageUrl: "", active: true });
      setImagePreview("");
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNiche(null);
    setFormData({ name: "", description: "", imageUrl: "", active: true });
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        finalImageUrl = await cloudinaryService.uploadImage(imageFile);
      }

      if (editingNiche) {
        await nicheService.updateNiche(editingNiche.id, {
          name: formData.name,
          description: formData.description,
          imageUrl: finalImageUrl,
          active: formData.active
        });
        showToast("success", "Nicho atualizado com sucesso!");
      } else {
        if (!finalImageUrl) {
          throw new Error("A imagem do nicho é obrigatória.");
        }
        await nicheService.createNiche({
          name: formData.name,
          description: formData.description,
          imageUrl: finalImageUrl,
          active: formData.active
        });
        showToast("success", "Nicho criado com sucesso!");
      }
      closeModal();
    } catch (error: any) {
      console.error("Error saving niche:", error);
      showToast("error", error.message || "Erro ao salvar nicho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (niche: Niche) => {
    if (window.confirm(`Tem certeza que deseja excluir o nicho "${niche.name}"?\n\nISTO TAMBÉM EXCLUIRÁ todos os catálogos e produtos associados.`)) {
      try {
        await nicheService.deleteNiche(niche.id);
        showToast("success", "Nicho excluído com sucesso!");
      } catch (error: any) {
        showToast("error", error.message);
      }
    }
  };

  const toggleStatus = async (niche: Niche) => {
    try {
      await nicheService.toggleNicheStatus(niche.id, niche.active);
      showToast("success", `Nicho ${niche.active ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error: any) {
      showToast("error", "Erro ao alterar status do nicho.");
    }
  };

  const filteredNiches = niches.filter(niche => 
    niche.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    niche.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nichos de Mercado</h1>
            <p className="text-gray-500">Gerencie os segmentos da plataforma</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar nichos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus className="w-5 h-5" /> Novo Nicho
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
        ) : filteredNiches.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Nenhum nicho encontrado</h3>
            <p className="text-gray-500 mt-2">Comece criando o primeiro nicho da plataforma.</p>
            <button 
              onClick={() => openModal()}
              className="mt-6 bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors"
            >
              Criar Nicho
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Nicho</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Catálogos</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Produtos</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredNiches.map(niche => (
                    <tr key={niche.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <img 
                              src={niche.imageUrl || "https://picsum.photos/seed/niche/100/100"} 
                              alt={niche.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="font-bold text-gray-900">{niche.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-500 line-clamp-2 max-w-xs">{niche.description}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm">
                          {niche.catalogsCount || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 font-bold text-sm">
                          {niche.productsCount || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => toggleStatus(niche)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            niche.active 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {niche.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openModal(niche)} 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(niche)} 
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
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingNiche ? "Editar Nicho" : "Novo Nicho"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Upload Imagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Nicho</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-colors ${
                      imagePreview ? 'border-gray-200' : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                    }`}
                  >
                    {imagePreview ? (
                      <div className="relative aspect-video">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white font-medium flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" /> Trocar Imagem
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center text-gray-500">
                        <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                        <span className="text-sm font-medium">Clique para fazer upload</span>
                        <span className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input 
                    required
                    type="text"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="Ex: Moda Feminina"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                    required
                    rows={3}
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                    placeholder="Descreva o foco deste nicho..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Status do Nicho</p>
                    <p className="text-sm text-gray-500">Nichos inativos não aparecem para novos revendedores.</p>
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

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={closeModal} 
                    className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Nicho"}
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
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
