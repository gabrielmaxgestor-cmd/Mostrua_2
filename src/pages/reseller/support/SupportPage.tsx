"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToResellerTickets,
  SupportTicket,
  TicketStatus,
  TicketPriority,
} from "@/services/supportService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Label maps ──────────────────────────────────────────────────────────────

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

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  low: "text-gray-500",
  medium: "text-yellow-600",
  high: "text-red-600 font-semibold",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(ts: any) {
  if (!ts?.toDate) return "—";
  return formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ptBR });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { user, reseller } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = subscribeToResellerTickets(user.uid, (data) => {
      setTickets(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Abra chamados e acompanhe suas solicitações
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo chamado
        </button>
      </div>

      {/* Ticket list */}
      {loading ? (
        <TicketSkeleton />
      ) : tickets.length === 0 ? (
        <EmptyState onNew={() => setShowModal(true)} />
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              onClick={() =>
                router.push(`/dashboard/support/${ticket.id}`)
              }
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 truncate">
                      {ticket.subject}
                    </span>
                    {ticket.unreadReseller > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                        {ticket.unreadReseller}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[ticket.status]}`}
                    >
                      {STATUS_LABEL[ticket.status]}
                    </span>
                    <span
                      className={`text-xs ${PRIORITY_CLASS[ticket.priority]}`}
                    >
                      Prioridade {PRIORITY_LABEL[ticket.priority]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {relativeTime(ticket.lastMessageAt)}
                    </span>
                  </div>
                </div>

                <svg
                  className="w-4 h-4 text-gray-400 shrink-0 mt-1"
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
            </li>
          ))}
        </ul>
      )}

      {/* New ticket modal */}
      {showModal && (
        <NewTicketModal
          reseller={reseller}
          userId={user!.uid}
          onClose={() => setShowModal(false)}
          onCreated={(id) => router.push(`/dashboard/support/${id}`)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TicketSkeleton() {
  return (
    <ul className="space-y-3">
      {[1, 2, 3].map((i) => (
        <li
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">🎧</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        Nenhum chamado ainda
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Tem alguma dúvida ou problema? Fala com a gente!
      </p>
      <button
        onClick={onNew}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        Abrir primeiro chamado
      </button>
    </div>
  );
}

// ─── New Ticket Modal ────────────────────────────────────────────────────────

import { createTicket } from "@/services/supportService";

interface NewTicketModalProps {
  reseller: any;
  userId: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}

function NewTicketModal({
  reseller,
  userId,
  onClose,
  onCreated,
}: NewTicketModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      setError("Preencha o assunto e a mensagem.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ticketId = await createTicket({
        resellerId: userId,
        resellerName: reseller?.storeName || reseller?.name || "Revendedor",
        resellerEmail: reseller?.email || "",
        subject: subject.trim(),
        priority,
        firstMessage: message.trim(),
      });
      onCreated(ticketId);
    } catch (e) {
      setError("Erro ao abrir chamado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Novo chamado</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assunto
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Problema ao ativar catálogo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridade
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Baixa — Dúvida geral</option>
              <option value="medium">Média — Problema no sistema</option>
              <option value="high">Alta — Loja fora do ar / urgente</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descreva o problema
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Explique em detalhes o que está acontecendo..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? "Abrindo chamado..." : "Abrir chamado"}
          </button>
        </div>
      </div>
    </div>
  );
}
