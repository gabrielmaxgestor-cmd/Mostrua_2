"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  subscribeToAllTickets,
  updateTicket,
  SupportTicket,
  TicketStatus,
  TicketPriority,
} from "@/services/supportService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Label maps ──────────────────────────────────────────────────────────────

const ALL_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  resolved: "Resolvido",
  closed: "Encerrado",
};

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const PRIORITY_DOT: Record<TicketPriority, string> = {
  low: "bg-gray-400",
  medium: "bg-yellow-400",
  high: "bg-red-500",
};

function relativeTime(ts: any) {
  if (!ts?.toDate) return "—";
  return formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ptBR });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminSupport() {
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const status =
      filterStatus === "all" ? undefined : (filterStatus as TicketStatus);

    const unsub = subscribeToAllTickets((data) => {
      setTickets(data);
      setLoading(false);
    }, status);

    return () => unsub();
  }, [filterStatus]);

  // Client-side search filter (subject or reseller name)
  const filtered = tickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.resellerName.toLowerCase().includes(q) ||
      t.resellerEmail.toLowerCase().includes(q)
    );
  });

  // Stats counters
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress"
  ).length;
  const unreadCount = tickets.filter((t) => t.unreadAdmin > 0).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fila de Suporte
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerencie os chamados dos revendedores
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/notifications")}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          📢 Enviar notificação
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="Abertos"
          value={openCount}
          color="text-blue-600"
        />
        <StatCard
          label="Em atendimento"
          value={inProgressCount}
          color="text-yellow-600"
        />
        <StatCard
          label="Com não lidas"
          value={unreadCount}
          color="text-red-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por assunto, revendedor..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          <FilterChip
            label="Todos"
            active={filterStatus === "all"}
            onClick={() => setFilterStatus("all")}
          />
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

      {/* Ticket list */}
      {loading ? (
        <TicketSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-base font-medium text-gray-600">
            Nenhum chamado encontrado
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={() => router.push(`/admin/support/${ticket.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function TicketRow({
  ticket,
  onClick,
}: {
  ticket: SupportTicket;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all flex items-center gap-3 ${
        ticket.unreadAdmin > 0
          ? "border-indigo-200 bg-indigo-50/30"
          : "border-gray-200"
      }`}
    >
      {/* Priority dot */}
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          PRIORITY_DOT[ticket.priority]
        }`}
        title={`Prioridade ${PRIORITY_LABEL[ticket.priority]}`}
      />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm truncate ${
              ticket.unreadAdmin > 0 ? "text-gray-900" : "text-gray-700"
            }`}
          >
            {ticket.subject}
          </span>
          {ticket.unreadAdmin > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
              {ticket.unreadAdmin}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {ticket.resellerName} · {ticket.resellerEmail}
        </p>
      </div>

      {/* Status + time */}
      <div className="shrink-0 text-right hidden sm:block">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[ticket.status]}`}
        >
          {STATUS_LABEL[ticket.status]}
        </span>
        <p className="text-xs text-gray-400 mt-1">
          {relativeTime(ticket.lastMessageAt)}
        </p>
      </div>

      <svg
        className="w-4 h-4 text-gray-400 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  );
}

function TicketSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 animate-pulse flex gap-3"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1.5 shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-1.5" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
