import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  subscribeToAllTickets,
  SupportTicket,
  TicketStatus,
  TicketPriority,
} from "../../../services/supportService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell } from "lucide-react";

const ALL_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  resolved: "Resolvido",
  closed: "Encerrado",
};

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "bg-orange-100 text-orange-500",
  in_progress: "bg-yellow-100 text-yellow-400",
  resolved: "bg-green-100 text-green-400",
  closed: "bg-[#13131C] text-white/50",
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  low: "bg-white/30",
  medium: "bg-yellow-400",
  high: "bg-red-500",
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

function relativeTime(ts: any) {
  if (!ts?.toDate) return "—";
  return formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ptBR });
}

export const AdminSupport: React.FC = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const status = filterStatus === "all" ? undefined : (filterStatus as TicketStatus);
    const unsub = subscribeToAllTickets((data) => {
      setTickets(data);
      setLoading(false);
    }, status);
    return () => unsub();
  }, [filterStatus]);

  const filtered = tickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.resellerName.toLowerCase().includes(q) ||
      t.resellerEmail.toLowerCase().includes(q)
    );
  });

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const unreadCount = tickets.filter((t) => t.unreadAdmin > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Fila de Suporte</h1>
          <p className="text-white/50">Gerencie os chamados dos revendedores</p>
        </div>
        <button
          onClick={() => navigate("/admin/notifications")}
          className="border border-white/10 hover:bg-[#0A0A0F] text-white/70 text-sm font-medium px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          Enviar notificação
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#13131C] border border-white/5 rounded-2xl px-4 py-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-orange-500">{openCount}</p>
          <p className="text-xs text-white/50 mt-0.5">Abertos</p>
        </div>
        <div className="bg-[#13131C] border border-white/5 rounded-2xl px-4 py-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">{inProgressCount}</p>
          <p className="text-xs text-white/50 mt-0.5">Em atendimento</p>
        </div>
        <div className="bg-[#13131C] border border-white/5 rounded-2xl px-4 py-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
          <p className="text-xs text-white/50 mt-0.5">Com não lidas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por assunto, revendedor..."
          className="flex-1 bg-[#0A0A0F] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <div className="flex gap-1.5 flex-wrap">
          <FilterChip label="Todos" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
          {ALL_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={STATUS_LABEL[s]}
              active={filterStatus === s}
              onClick={() => setFilterStatus(s)}
            />
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <TicketSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#13131C] rounded-2xl border border-dashed border-white/10">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-base font-medium text-white/60">Nenhum chamado encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/admin/support/${ticket.id}`)}
              className={`bg-[#13131C] border rounded-2xl px-4 py-3 cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all flex items-center gap-3 ${
                ticket.unreadAdmin > 0 ? "border-orange-500 bg-orange-500/10/30" : "border-white/5"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${PRIORITY_DOT[ticket.priority]}`}
                title={`Prioridade ${PRIORITY_LABEL[ticket.priority]}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm truncate ${ticket.unreadAdmin > 0 ? "text-white" : "text-white/70"}`}>
                    {ticket.subject}
                  </span>
                  {ticket.unreadAdmin > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold shrink-0">
                      {ticket.unreadAdmin}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 truncate mt-0.5">
                  {ticket.resellerName} · {ticket.resellerEmail}
                </p>
              </div>
              <div className="shrink-0 text-right hidden sm:block">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[ticket.status]}`}>
                  {STATUS_LABEL[ticket.status]}
                </span>
                <p className="text-xs text-white/40 mt-1">{relativeTime(ticket.lastMessageAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
        active ? "bg-orange-500 text-white" : "bg-[#13131C] text-white/60 hover:bg-[#1A1A2E]"
      }`}
    >
      {label}
    </button>
  );
}

function TicketSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[#13131C] border border-white/5 rounded-2xl px-4 py-3 animate-pulse flex gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A2E] mt-1.5 shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-[#1A1A2E] rounded w-2/3 mb-1.5" />
            <div className="h-3 bg-[#13131C] rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
