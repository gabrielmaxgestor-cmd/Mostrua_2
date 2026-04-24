import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../hooks/useOrders";
import { useReseller } from "../../hooks/useReseller";
import { Order, OrderStatus } from "../../types";
import { ShoppingCart, Eye, Loader2, Clock, CheckCircle, Package, Truck, XCircle, Search, Check, Download, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { OrderDetailsModal } from "../../components/reseller/OrderDetailsModal";
import { ErrorState } from '../../components/ErrorState';

const statusConfig: Record<OrderStatus, { label: string, color: string, icon: any }> = {
  pending: { label: "Novo", color: "bg-blue-100 text-blue-700", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  processing: { label: "Atendimento", color: "bg-yellow-100 text-yellow-700", icon: Package },
  shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  delivered: { label: "Finalizado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  canceled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle }
};

export const Orders = () => {
  const { user } = useAuth();
  const { reseller } = useReseller(user?.uid);
  const { orders, loading, error } = useOrders(user?.uid);
  
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const lowerQuery = searchQuery.toLowerCase();
      const queryDigits = searchQuery.replace(/\D/g, '');
      const phoneDigits = o.customerPhone ? o.customerPhone.replace(/\D/g, '') : '';
      
      const matchSearch = lowerQuery === "" || 
        o.id.toLowerCase().includes(lowerQuery) || 
        o.customerName.toLowerCase().includes(lowerQuery) ||
        o.customerPhone.toLowerCase().includes(lowerQuery) ||
        (queryDigits !== "" && phoneDigits.includes(queryDigits));
        
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, searchQuery]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      showToast("Nenhum pedido para exportar.");
      return;
    }

    const headers = ["Nº Pedido", "Data", "Cliente", "Telefone", "Status", "Valor (R$)"];
    
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map(order => {
        const id = order.id.slice(-6).toUpperCase();
        // Extract basic string from date, without commas that break CSV
        const rawDate = formatDate(order.createdAt);
        const date = `"${rawDate}"`;
        // Handle names that might have commas or quotes
        const customer = `"${order.customerName.replace(/"/g, '""')}"`;
        const phone = `"${order.customerPhone}"`;
        const status = `"${statusConfig[order.status]?.label || order.status}"`;
        // Ensure decimal uses dot or comma safely. We'll use local string inside quotes.
        const total = `"${order.total.toFixed(2).replace('.', ',')}"`;
        
        return [id, date, customer, phone, status, total].join(",");
      })
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-full text-sm font-medium shadow-xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-green-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 text-sm">
            {filteredOrders.length} pedido(s)
            {filterStatus !== 'all' && ` com status "${statusConfig[filterStatus as OrderStatus]?.label}"`}
            {searchQuery && ` · busca por "${searchQuery}"`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {filteredOrders.length > 0 && (
            <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors bg-white">
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          )}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pedido, cliente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all shadow-sm bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Render dos filtros */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled'] as const).map(status => {
          const count = statusCounts[status] || 0;
          const isActive = filterStatus === status;
          const config = status === 'all' ? { label: 'Todos', color: 'bg-gray-100 text-gray-700' } : statusConfig[status as OrderStatus];
          const hasPending = status === 'pending' && count > 0;
          
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status as OrderStatus | "all")}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-full text-xs font-bold border transition-all ${
                isActive ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {config.label}
              {count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  hasPending ? 'bg-red-500 text-white animate-pulse' :
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          {filterStatus === 'all' && !searchQuery ? (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum pedido ainda</h3>
              <p className="text-gray-500 mb-6">Quando seus clientes fizerem pedidos, eles aparecerão aqui.</p>
              <p className="text-sm text-gray-400">💡 Dica: compartilhe o link da sua loja no WhatsApp para começar a receber pedidos.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
              <button onClick={() => { setFilterStatus('all'); setSearchQuery(''); }} className="text-blue-600 font-medium text-sm mt-2">Limpar filtros</button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map(order => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all ${
                    order.status === 'pending' ? 'border-orange-200 border-l-4 border-l-orange-500' : 'border-gray-200'
                  }`}
                >
                  {/* Linha 1: Nome + Valor */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-1">{order.customerName}</p>
                      <p className="text-xs text-gray-500">#{order.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <p className="text-lg font-black text-gray-900">{formatCurrency(order.total || 0)}</p>
                  </div>
                  
                  {/* Linha 2: Status + Data + Ação rápida */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium px-1">{formatDate(order.createdAt)}</span>
                    </div>
                    {/* Botão de WhatsApp rápido */}
                    {order.customerPhone && (
                      <a
                        href={`https://wa.me/55${order.customerPhone.replace(/\D/g,'')}?text=${encodeURIComponent(
                          `Olá ${order.customerName}! Vi seu pedido #${order.id.slice(-6).toUpperCase()} no valor de ${formatCurrency(order.total || 0)}. Vamos confirmar?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] px-3.5 py-2 rounded-full hover:bg-[#20b858] transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Responder
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: manter layout atual de tabela/lista */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left flex-col border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Nº Pedido</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Data</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Valor</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status].icon;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm text-gray-900 font-bold">#{order.id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900 line-clamp-1">{order.customerName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{order.customerPhone}</p>
                        </td>
                        <td className="py-4 px-6 hidden sm:table-cell">
                          <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusConfig[order.status].color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig[order.status].label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de Detalhes Externa */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder}
            reseller={reseller}
            statusConfig={statusConfig}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdated={(newStatus) => {
              setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
              showToast("Status atualizado com sucesso!");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
