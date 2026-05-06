import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  getTicket,
  updateTicket,
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  SupportTicket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
} from "../../../services/supportService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, Send } from "lucide-react";

const ALL_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

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

function relativeTime(ts: any) {
  if (!ts?.toDate) return "";
  return formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ptBR });
}

export const AdminTicketDetail: React.FC = () => {
  const { user } = useAuth() as any;
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ticketId) return;
    getTicket(ticketId).then((t) => {
      setTicket(t);
      setLoadingTicket(false);
    });
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId || !user?.uid) return;
    const unsub = subscribeToMessages(ticketId, (msgs) => {
      setMessages(msgs);
      markMessagesAsRead(ticketId, "admin");
    });
    return () => unsub();
  }, [ticketId, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() || sending || !user?.uid || !ticket) return;
    const content = text.trim();
    setText("");
    setSending(true);

    if (ticket.status === "open") {
      await handleStatusChange("in_progress");
    }

    try {
      await sendMessage({
        ticketId: ticketId!,
        senderId: user.uid,
        senderRole: "admin",
        senderName: "Suporte Mostrua",
        content,
      });
    } catch {
      setText(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!ticket || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await updateTicket(ticketId!, { status });
      setTicket((prev) => (prev ? { ...prev, status } : prev));
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handlePriorityChange(priority: TicketPriority) {
    if (!ticket) return;
    await updateTicket(ticketId!, { priority });
    setTicket((prev) => (prev ? { ...prev, priority } : prev));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!loadingTicket && !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Chamado não encontrado.</p>
        <button onClick={() => navigate("/admin/support")} className="mt-4 text-blue-600 text-sm underline">
          Voltar à fila
        </button>
      </div>
    );
  }

  const isClosed = ticket?.status === "closed";

  return (
    <div className="flex h-[calc(100vh-160px)]">
      {/* Chat panel */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 mb-3">
          <button onClick={() => navigate("/admin/support")} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            {loadingTicket ? (
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            ) : (
              <>
                <p className="font-semibold text-gray-900 truncate">{ticket?.subject}</p>
                <p className="text-xs text-gray-500 truncate">
                  {ticket?.resellerName} · {ticket?.resellerEmail}
                </p>
              </>
            )}
          </div>
          {ticket && (
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[ticket.status]}`}>
              {STATUS_LABEL[ticket.status]}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 bg-gray-50 rounded-2xl px-4 py-4">
          {messages.length === 0 && !loadingTicket && (
            <p className="text-center text-sm text-gray-400 py-8">Aguardando a primeira mensagem...</p>
          )}
          {messages.map((msg) => {
            const isAdmin = msg.senderRole === "admin";
            return (
              <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                  isAdmin
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                }`}>
                  {!isAdmin && (
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">{msg.senderName}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 text-right ${isAdmin ? "text-blue-200" : "text-gray-400"}`}>
                    {relativeTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 pt-3 mt-3">
          {isClosed ? (
            <p className="text-center text-sm text-gray-400 py-2">
              Chamado encerrado. Reabra o status para responder.
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Responda o revendedor... (Enter para enviar)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
                style={{ minHeight: "40px" }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl p-2.5 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-l border-gray-200 pl-6 hidden lg:flex flex-col gap-6 overflow-y-auto">
        {/* Info */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Informações</p>
          {loadingTicket ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ) : (
            <div className="space-y-1.5 text-sm text-gray-700">
              <p><span className="text-gray-500">Revendedor: </span>{ticket?.resellerName}</p>
              <p><span className="text-gray-500">Email: </span>{ticket?.resellerEmail}</p>
              <p><span className="text-gray-500">Criado: </span>{relativeTime(ticket?.createdAt)}</p>
              <p><span className="text-gray-500">Mensagens: </span>{messages.length}</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
          <div className="space-y-1.5">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus || ticket?.status === s}
                className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                  ticket?.status === s
                    ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                    : "text-gray-600 hover:bg-gray-100 border border-transparent"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prioridade</p>
          <div className="space-y-1.5">
            {(["low", "medium", "high"] as TicketPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePriorityChange(p)}
                disabled={ticket?.priority === p}
                className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                  ticket?.priority === p
                    ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                    : "text-gray-600 hover:bg-gray-100 border border-transparent"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ações rápidas</p>
          <div className="space-y-2">
            <button
              onClick={() => handleStatusChange("resolved")}
              disabled={ticket?.status === "resolved" || updatingStatus}
              className="w-full text-sm bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl py-2 transition-colors disabled:opacity-50"
            >
              ✅ Marcar como resolvido
            </button>
            <button
              onClick={() => handleStatusChange("closed")}
              disabled={ticket?.status === "closed" || updatingStatus}
              className="w-full text-sm bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl py-2 transition-colors disabled:opacity-50"
            >
              🔒 Encerrar chamado
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
