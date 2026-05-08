import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { format } from "date-fns";

export const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.resellerId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-400 text-xs font-bold"><Clock className="w-3 h-3" /> Pendente</span>;
      case 'processing': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-500 text-xs font-bold"><Truck className="w-3 h-3" /> Processando</span>;
      case 'completed': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-400 text-xs font-bold"><CheckCircle className="w-3 h-3" /> Concluído</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-400 text-xs font-bold"><XCircle className="w-3 h-3" /> Cancelado</span>;
      default: return <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#13131C] text-white/70 text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Pedidos</h1>
          <p className="text-white/50">Acompanhe todos os pedidos da plataforma</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar pedidos..." 
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
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#13131C] rounded-3xl border border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0F]/50 border-b border-white/5">
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">ID do Pedido</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Data</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Revendedor</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Cliente</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Total</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
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
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/50">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#0A0A0F]/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-bold text-white">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-white/50">
                        {order.createdAt?.toDate ? format(order.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-white">{order.resellerId?.slice(0, 8)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-white">{order.customer?.name || "Cliente"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-white/40 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors" title="Ver Detalhes">
                        <Eye className="w-4 h-4" />
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
