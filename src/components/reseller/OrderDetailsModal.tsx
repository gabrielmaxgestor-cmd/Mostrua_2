import React, { useState } from "react";
import { Order, OrderStatus, Reseller } from "../../types";
import { X, Loader2, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

interface CustomStatusConfig {
  label: string;
  color: string;
  icon: any;
}

interface OrderDetailsModalProps {
  order: Order;
  reseller: Reseller | null;
  onClose: () => void;
  statusConfig: Record<OrderStatus, CustomStatusConfig>;
  onStatusUpdated?: (status: OrderStatus) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ 
  order, 
  reseller, 
  onClose, 
  statusConfig,
  onStatusUpdated 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingLink, setTrackingLink] = useState(order.trackingLink || "");
  const [localStatus, setLocalStatus] = useState<OrderStatus>(order.status);
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const handleUpdateStatusAndTracking = async (newStatus: OrderStatus, newTracking?: string) => {
    setIsUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      if (newTracking !== undefined) {
        updateData.trackingLink = newTracking;
      }
      await updateDoc(doc(db, "orders", order.id), updateData);
      setLocalStatus(newStatus);
      if (onStatusUpdated) {
        onStatusUpdated(newStatus);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Erro ao atualizar o pedido.");
    } finally {
      setIsUpdating(false);
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = order.customerPhone.replace(/\D/g, '');
    const storeName = reseller?.storeName || 'nossa loja';
    const orderId = order.id.slice(-6).toUpperCase();
    const currentStatusLabel = statusConfig[localStatus]?.label || localStatus;
    
    let text = `Olá ${order.customerName}, aqui é da ${storeName}.\n\nSeu pedido #${orderId} está agora com o status: *${currentStatusLabel}*.\n`;
    
    if (trackingLink && trackingLink.trim() !== "") {
      text += `\nAcompanhe seu pedido pelo link:\n${trackingLink}`;
    }
    
    window.open(`https://wa.me/55${phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Pedido #{order.id.slice(-6).toUpperCase()}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 bg-white rounded-full shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          
          {/* Status Update & Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">Status do Pedido</label>
                <div className="flex items-center gap-3">
                  <select
                    value={localStatus}
                    onChange={(e) => handleUpdateStatusAndTracking(e.target.value as OrderStatus, trackingLink)}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-gray-900 outline-none font-medium text-gray-900 disabled:opacity-50"
                  >
                    {(Object.keys(statusConfig) as OrderStatus[]).map(status => (
                      <option key={status} value={status}>{statusConfig[status].label}</option>
                    ))}
                  </select>
                  {isUpdating && <Loader2 className="w-5 h-5 animate-spin text-gray-600" />}
                </div>
              </div>
              
              <button 
                onClick={openWhatsApp}
                className="flex items-center justify-center gap-2 h-16 sm:h-auto sm:px-6 sm:py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all shadow-sm shrink-0"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Cliente
              </button>
            </div>

            {/* Tracking Link (Conditional if Shipped/Delivered or if already filled) */}
            {(localStatus === 'shipped' || localStatus === 'delivered' || trackingLink) && (
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col gap-2">
                <label className="block text-sm font-bold text-blue-900">Link de Rastreio (Opcional)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="https://rastreio.com/..."
                    value={trackingLink}
                    onChange={(e) => setTrackingLink(e.target.value)}
                    onBlur={() => {
                      if (trackingLink !== order.trackingLink) {
                        handleUpdateStatusAndTracking(localStatus, trackingLink);
                      }
                    }}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-3 rounded-xl border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900 disabled:opacity-50"
                  />
                  {isUpdating && <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />}
                </div>
                <p className="text-xs text-blue-600 font-medium">Será enviado automaticamente no WhatsApp se preenchido.</p>
              </div>
            )}
          </div>

          {/* Cliente */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Dados do Cliente</h3>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nome</p>
                <p className="font-bold text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Telefone (WhatsApp)</p>
                <p className="font-bold text-gray-900">{order.customerPhone}</p>
              </div>
              {order.customerAddress && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Endereço de Entrega</p>
                  <p className="font-medium text-gray-900">{order.customerAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Itens do Pedido</h3>
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-xs font-bold text-gray-500">Item</th>
                    <th className="py-3 px-4 text-xs font-bold text-gray-500 text-center">Qtd</th>
                    <th className="py-3 px-4 text-xs font-bold text-gray-500 text-right">Preço</th>
                    <th className="py-3 px-4 text-xs font-bold text-gray-500 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        {item.variation && <p className="text-xs text-gray-500">{item.variation}</p>}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td colSpan={3} className="py-4 px-4 text-right font-bold text-gray-600">Total do Pedido</td>
                    <td className="py-4 px-4 text-right font-black text-blue-600 text-lg">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observações */}
          {order.observations && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Observações do Cliente</h3>
              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-yellow-800 text-sm whitespace-pre-wrap">
                {order.observations}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
