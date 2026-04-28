"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTicket,
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  SupportTicket,
  TicketMessage,
  TicketStatus,
} from "@/services/supportService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function TicketDetail() {
  const { user, reseller } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ticketId = params?.ticketId as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load ticket once
  useEffect(() => {
    if (!ticketId) return;
    getTicket(ticketId).then((t) => {
      setTicket(t);
      setLoadingTicket(false);
    });
  }, [ticketId]);

  // Subscribe to messages in real time
  useEffect(() => {
    if (!ticketId || !user?.uid) return;

    const unsub = subscribeToMessages(ticketId, (msgs) => {
      setMessages(msgs);
      // Mark admin messages as read
      markMessagesAsRead(ticketId, "reseller");
    });

    return () => unsub();
  }, [ticketId, user?.uid]);

  // Scroll to bottom on new messages
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
        ticketId,
        senderId: user.uid,
        senderRole: "reseller",
        senderName: reseller?.storeName || reseller?.name || "Revendedor",
        content,
      });
    } catch {
      setText(content); // restore on error
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

  // Guard: ticket not found
  if (!loadingTicket && !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg">Chamado não encontrado.</p>
        <button
          onClick={() => router.push("/dashboard/support")}
          className="mt-4 text-indigo-600 text-sm underline"
        >
          Voltar ao suporte
        </button>
      </div>
    );
  }

  const isClosed =
    ticket?.status === "closed" || ticket?.status === "resolved";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={() => router.push("/dashboard/support")}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Voltar"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          {loadingTicket ? (
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          ) : (
            <>
              <p className="font-semibold text-gray-900 truncate">
                {ticket?.subject}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {ticket && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[ticket.status]}`}
                  >
                    {STATUS_LABEL[ticket.status]}
                  </span>
                )}
                {ticket && (
                  <span className="text-xs text-gray-400">
                    {relativeTime(ticket.createdAt)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && !loadingTicket && (
          <p className="text-center text-sm text-gray-400 py-8">
            Aguardando resposta da equipe de suporte.
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderRole === "reseller";
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isOwn
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                }`}
              >
                {!isOwn && (
                  <p className="text-xs font-semibold text-indigo-600 mb-0.5">
                    {msg.senderName}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p
                  className={`text-xs mt-1 text-right ${
                    isOwn ? "text-indigo-200" : "text-gray-400"
                  }`}
                >
                  {relativeTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        {isClosed ? (
          <p className="text-center text-sm text-gray-400 py-2">
            Este chamado está{" "}
            <span className="font-medium">
              {STATUS_LABEL[ticket!.status].toLowerCase()}
            </span>
            . Abra um novo chamado se precisar de mais ajuda.
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
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-32"
              style={{ minHeight: "40px" }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl p-2.5 transition-colors shrink-0"
              aria-label="Enviar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
