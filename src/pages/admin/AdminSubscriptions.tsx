import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { Search, Filter, CreditCard, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "subscriptions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setSubscriptions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.resellerId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-400 text-xs font-bold"><CheckCircle className="w-3 h-3" /> Ativa</span>;
      case 'canceled': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-400 text-xs font-bold"><XCircle className="w-3 h-3" /> Cancelada</span>;
      case 'past_due': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-400 text-xs font-bold"><AlertCircle className="w-3 h-3" /> Em Atraso</span>;
      case 'trialing': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-500 text-xs font-bold"><Clock className="w-3 h-3" /> Trial</span>;
      default: return <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#13131C] text-white/70 text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Assinaturas</h1>
          <p className="text-white/50">Gerencie as assinaturas dos revendedores</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar assinaturas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-[#13131C] font-medium text-white/70"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativa</option>
              <option value="trialing">Trial</option>
              <option value="past_due">Em Atraso</option>
              <option value="canceled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#13131C] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0F]/50 border-b border-white/5">
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">ID</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Revendedor</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Plano</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Valor</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Próxima Cobrança</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/50">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/50">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-[#0A0A0F]/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-bold text-white">#{sub.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-white">{sub.resellerId?.slice(0, 8)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider">
                        {sub.planId || "Básico"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.amount || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-white/50">
                        {sub.currentPeriodEnd?.toDate ? format(sub.currentPeriodEnd.toDate(), "dd/MM/yyyy") : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-white/40 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors" title="Ver Detalhes">
                        <CreditCard className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
