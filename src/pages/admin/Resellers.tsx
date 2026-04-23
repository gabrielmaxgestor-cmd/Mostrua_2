import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { auth, db, firebaseConfig } from "../../firebase";
import { Reseller, Niche } from "../../types";
import { Plus, Settings, UserPlus, Mail, Phone, Store, Trash2 } from "lucide-react";
import { motion } from "motion/react";

export const Resellers = () => {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReseller, setNewReseller] = useState({ 
    name: "", email: "", password: "", phone: "", storeName: "", slug: "", nicheId: "" 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubResellers = onSnapshot(collection(db, "resellers"), (snap) => {
      setResellers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Reseller)));
    });
    const unsubNiches = onSnapshot(collection(db, "niches"), (snap) => {
      setNiches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Niche)));
    });
    return () => { unsubResellers(); unsubNiches(); };
  }, []);

  const handleDelete = async (resellerId: string) => {
    if (!window.confirm("Atenção! Isso excluirá permanentemente os registros do revendedor no banco de dados da loja. Deseja prosseguir?")) return;
    
    try {
      // Deleta das coleções principais (a conta Authentication Firebase precisaria ser deletada via Admin SDK ou interface, mas apagando esses docs já corta o acesso)
      await deleteDoc(doc(db, "resellers", resellerId));
      await deleteDoc(doc(db, "users", resellerId));
      await deleteDoc(doc(db, "subscriptions", resellerId));
      alert("Revendedor removido com sucesso!");
    } catch (err: any) {
      alert("Erro ao remover revendedor: " + err.message);
    }
  };

  const handleCreate = async () => {
    if (!newReseller.nicheId || !newReseller.email || !newReseller.password) return alert("Preencha todos os campos");
    setLoading(true);
    try {
      // 1. Create Auth User using a secondary app instance to avoid logging out the admin
      // Using a cloud function or standard auth for reseller creation is recommended, 
      // but for client-side admin action without secondary app conflict:
      const secondaryApp = initializeApp(firebaseConfig, "Secondary_" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, newReseller.email, newReseller.password);
      const uid = userCred.user.uid;
      await secondaryAuth.signOut();
      
      // 2. Create User Profile
      await setDoc(doc(db, "users", uid), {
        email: newReseller.email,
        role: "reseller",
        status: "active",
        createdAt: new Date()
      });

      // 3. Create Reseller Data
      await setDoc(doc(db, "resellers", uid), {
        name: newReseller.name,
        email: newReseller.email,
        phone: newReseller.phone,
        storeName: newReseller.storeName,
        slug: newReseller.slug.toLowerCase().replace(/\s+/g, '-'),
        nicheId: newReseller.nicheId,
        status: "active",
        settings: {
          logo: "", banner: "", primaryColor: "#2563eb", secondaryColor: "#1e40af",
          description: "", whatsapp: newReseller.phone, instagram: ""
        }
      });
      
      // 4. Grant full subscription access automatically for admin-created resellers
      const plansSnap = await getDocs(query(collection(db, 'plans'), where('name', '==', 'PRO')));
      let planId = 'admin_granted_pro';
      if (!plansSnap.empty) planId = plansSnap.docs[0].id;

      const subscriptionRef = doc(db, 'subscriptions', uid);
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
      
      await setDoc(subscriptionRef, {
        resellerId: uid,
        planId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: farFutureDate,
        paymentProvider: 'admin_granted',
        createdAt: new Date()
      });

      setIsModalOpen(false);
      setNewReseller({ name: "", email: "", password: "", phone: "", storeName: "", slug: "", nicheId: "" });
      alert("Revendedor criado com sucesso e assinatura vitalícia concedida!");
    } catch (err: any) {
      alert("Erro ao criar revendedor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revendedores</h1>
            <p className="text-gray-500">Gerencie os parceiros da plataforma</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
            <UserPlus className="w-5 h-5" /> Novo Revendedor
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Loja</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Nicho</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resellers.map(reseller => (
                  <tr key={reseller.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                          {reseller.settings.logo ? (
                            <img src={reseller.settings.logo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Store className="text-gray-400 w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{reseller.storeName}</p>
                          <p className="text-xs text-gray-500">/{reseller.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" /> {reseller.email}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {reseller.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                        {niches.find(n => n.id === reseller.nicheId)?.name || "Nicho não encontrado"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        reseller.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {reseller.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(reseller.uid)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remover Revendedor">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {resellers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Nenhum revendedor encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-full">
              <h2 className="text-2xl font-bold mb-6 shrink-0">Cadastrar Revendedor</h2>
              <div className="space-y-4 overflow-y-auto flex-1">
                <input placeholder="Nome Completo" value={newReseller.name} onChange={e => setNewReseller({...newReseller, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Email" value={newReseller.email} onChange={e => setNewReseller({...newReseller, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                  <input type="password" placeholder="Senha" value={newReseller.password} onChange={e => setNewReseller({...newReseller, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Telefone" value={newReseller.phone} onChange={e => setNewReseller({...newReseller, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                  <select value={newReseller.nicheId} onChange={e => setNewReseller({...newReseller, nicheId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white">
                    <option value="">Nicho</option>
                    {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Nome da Loja" value={newReseller.storeName} onChange={e => setNewReseller({...newReseller, storeName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                  <input placeholder="Slug (ex: joao-store)" value={newReseller.slug} onChange={e => setNewReseller({...newReseller, slug: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" />
                </div>
                <div className="flex gap-3 pt-4 shrink-0">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-600">Cancelar</button>
                  <button onClick={handleCreate} disabled={loading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50">
                    {loading ? "Criando..." : "Criar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
};
