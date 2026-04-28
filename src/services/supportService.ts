import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp,
  QueryConstraint,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";
export type SenderRole = "reseller" | "admin";

export interface SupportTicket {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerEmail: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;
  unreadAdmin: number;
  unreadReseller: number;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderRole: SenderRole;
  senderName: string;
  content: string;
  createdAt: Timestamp;
  read: boolean;
}

export interface CreateTicketPayload {
  resellerId: string;
  resellerName: string;
  resellerEmail: string;
  subject: string;
  priority?: TicketPriority;
  firstMessage: string;
}

export interface SendMessagePayload {
  ticketId: string;
  senderId: string;
  senderRole: SenderRole;
  senderName: string;
  content: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ticketsRef = collection(db, "support_tickets");

function messagesRef(ticketId: string) {
  return collection(db, "support_tickets", ticketId, "messages");
}

// ─── Ticket CRUD ─────────────────────────────────────────────────────────────

/**
 * Cria um novo chamado e já salva a primeira mensagem do revendedor.
 */
export async function createTicket(
  payload: CreateTicketPayload
): Promise<string> {
  const now = serverTimestamp();

  const ticketDoc = await addDoc(ticketsRef, {
    resellerId: payload.resellerId,
    resellerName: payload.resellerName,
    resellerEmail: payload.resellerEmail,
    subject: payload.subject,
    status: "open" as TicketStatus,
    priority: payload.priority ?? "medium",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    unreadAdmin: 1,
    unreadReseller: 0,
  });

  // Salva a primeira mensagem
  await addDoc(messagesRef(ticketDoc.id), {
    senderId: payload.resellerId,
    senderRole: "reseller" as SenderRole,
    senderName: payload.resellerName,
    content: payload.firstMessage,
    createdAt: now,
    read: false,
  });

  return ticketDoc.id;
}

/**
 * Atualiza status e/ou prioridade de um chamado.
 */
export async function updateTicket(
  ticketId: string,
  data: Partial<Pick<SupportTicket, "status" | "priority">>
): Promise<void> {
  const ref = doc(db, "support_tickets", ticketId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Retorna um chamado por ID (leitura única).
 */
export async function getTicket(
  ticketId: string
): Promise<SupportTicket | null> {
  const snap = await getDoc(doc(db, "support_tickets", ticketId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SupportTicket;
}

/**
 * Lista chamados de um revendedor específico.
 */
export async function getResellerTickets(
  resellerId: string
): Promise<SupportTicket[]> {
  const q = query(
    ticketsRef,
    where("resellerId", "==", resellerId),
    orderBy("lastMessageAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket));
}

/**
 * Lista todos os chamados para o painel admin, com filtros opcionais.
 */
export async function getAllTickets(filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
}): Promise<SupportTicket[]> {
  const constraints: QueryConstraint[] = [orderBy("lastMessageAt", "desc")];

  if (filters?.status) {
    constraints.unshift(where("status", "==", filters.status));
  }
  if (filters?.priority) {
    constraints.unshift(where("priority", "==", filters.priority));
  }

  const q = query(ticketsRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket));
}

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * Envia uma mensagem em um chamado.
 * Atualiza contadores de não lidas e lastMessageAt no ticket pai.
 */
export async function sendMessage(
  payload: SendMessagePayload
): Promise<string> {
  const now = serverTimestamp();

  const msgRef = await addDoc(messagesRef(payload.ticketId), {
    senderId: payload.senderId,
    senderRole: payload.senderRole,
    senderName: payload.senderName,
    content: payload.content,
    createdAt: now,
    read: false,
  });

  // Incrementa o contador correto de não lidas
  const ticketRef = doc(db, "support_tickets", payload.ticketId);
  const unreadField =
    payload.senderRole === "reseller" ? "unreadAdmin" : "unreadReseller";

  await updateDoc(ticketRef, {
    lastMessageAt: now,
    updatedAt: now,
    [unreadField]: increment(1),
    // Se revendedor respondeu, muda status para open (pode ter sido resolved)
    ...(payload.senderRole === "reseller" ? { status: "open" } : {}),
  });

  return msgRef.id;
}

/**
 * Marca todas as mensagens não lidas como lidas para um determinado papel.
 * Zera também o contador unread correspondente no ticket.
 */
export async function markMessagesAsRead(
  ticketId: string,
  readerRole: SenderRole
): Promise<void> {
  // Busca mensagens não lidas enviadas pelo outro lado
  const senderRole: SenderRole =
    readerRole === "admin" ? "reseller" : "admin";

  const q = query(
    messagesRef(ticketId),
    where("senderRole", "==", senderRole),
    where("read", "==", false)
  );

  const snap = await getDocs(q);
  const updates = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
  await Promise.all(updates);

  // Zera contador no ticket
  const unreadField =
    readerRole === "admin" ? "unreadAdmin" : "unreadReseller";
  await updateDoc(doc(db, "support_tickets", ticketId), {
    [unreadField]: 0,
  });
}

// ─── Realtime listeners ──────────────────────────────────────────────────────

/**
 * Escuta em tempo real as mensagens de um chamado.
 */
export function subscribeToMessages(
  ticketId: string,
  callback: (messages: TicketMessage[]) => void
): Unsubscribe {
  const q = query(messagesRef(ticketId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as TicketMessage)
    );
    callback(messages);
  });
}

/**
 * Escuta em tempo real a lista de chamados de um revendedor.
 */
export function subscribeToResellerTickets(
  resellerId: string,
  callback: (tickets: SupportTicket[]) => void
): Unsubscribe {
  const q = query(
    ticketsRef,
    where("resellerId", "==", resellerId),
    orderBy("lastMessageAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const tickets = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as SupportTicket)
    );
    callback(tickets);
  });
}

/**
 * Escuta em tempo real todos os chamados (admin).
 * Filtra por status se fornecido.
 */
export function subscribeToAllTickets(
  callback: (tickets: SupportTicket[]) => void,
  status?: TicketStatus
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy("lastMessageAt", "desc")];
  if (status) constraints.unshift(where("status", "==", status));

  const q = query(ticketsRef, ...constraints);
  return onSnapshot(q, (snap) => {
    const tickets = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as SupportTicket)
    );
    callback(tickets);
  });
}
