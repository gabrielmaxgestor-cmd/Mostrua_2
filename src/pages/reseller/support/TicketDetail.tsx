import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  getTicket,
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  SupportTicket,
  TicketMessage,
  TicketStatus,
} from "../../../services/supportService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, Send } from "lucide-react";

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

function relativeTime(ts: any) {
  if (!ts?.toDate) return "";
  return formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ptBR });
}

export const TicketDetail: React.FC = () => {
  const { user, reseller } = useAuth() as any;
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(true);

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
      markMessagesAsRead(ticketId, "reseller");
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
    try {
      await sendMessage({
        ticketId: ticketId!,
        senderId: user.uid,
        senderRole: "reseller",
        senderName: reseller?.storeName || reseller?.name || "Revendedor",
        content,
      });
    } catch {
      setText(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
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
        <p className="text-lg">Chamado não encontrado.</p>
        <button onClick={() => navigate("/dashboard/support")} className="mt-4 text-blue-600 text-sm underline">
          Voltar ao suporte
        </button>
      </div>
    );
  }

  const isClosed = ticket?.status === "closed" || ticket?.status === "resolved";

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 mb-3">
        <button
          onClick={() => navigate("/dashboard/support")}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          {loadingTicket ? (
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          ) : (
            <>
              <p className="font-semibold text-gray-900 truncate">{ticket?.subject}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {ticket && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[ticket.status]}`}>
                    {STATUS_LABEL[ticket.status]}
                  </span>
                )}
                {ticket && (
                  <span className="text-xs text-gray-400">{relativeTime(ticket.createdAt)}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 py-2 bg-gray-50 rounded-2xl px-4">
        {messages.length === 0 && !loadingTicket && (
          <p className="text-center text-sm text-gray-400 py-8">
            Aguardando resposta da equipe de suporte.
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.senderRole === "reseller";
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                isOwn
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
              }`}>
                {!isOwn && (
                  <p className="text-xs font-semibold text-blue-600 mb-0.5">{msg.senderName}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-xs mt-1 text-right ${isOwn ? "text-blue-200" : "text-gray-400"}`}>
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
            Este chamado está{" "}
            <span className="font-medium">{STATUS_LABEL[ticket!.status].toLowerCase()}</span>.
            Abra um novo chamado se precisar de mais ajuda.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Digite sua mensagem... (Enter para enviar)"
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
  );
};
