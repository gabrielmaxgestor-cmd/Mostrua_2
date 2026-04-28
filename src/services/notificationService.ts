import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType =
  | "system"       // comunicado geral da plataforma
  | "plan"         // mudança de plano, vencimento
  | "ticket"       // nova mensagem no chamado
  | "order"        // atualização de pedido
  | "custom";      // notificação manual do admin

export type NotificationTarget = "all" | "specific";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  target: NotificationTarget;
  resellerId?: string;       // preenchido quando target === "specific"
  ticketId?: string;         // preenchido quando type === "ticket"
  read: boolean;
  createdAt: Timestamp;
  createdBy: string;         // uid do admin que criou
}

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  target: NotificationTarget;
  resellerId?: string;
  ticketId?: string;
  createdBy: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Retorna a referência da subcoleção de notificações de um revendedor.
 */
function resellerNotificationsRef(resellerId: string) {
  return collection(db, "resellers", resellerId, "notifications");
}

// ─── Create ──────────────────────────────────────────────────────────────────

/**
 * Cria uma notificação para um revendedor específico.
 */
export async function createNotificationForReseller(
  resellerId: string,
  payload: CreateNotificationPayload
): Promise<string> {
  const ref = resellerNotificationsRef(resellerId);
  const notifDoc = await addDoc(ref, {
    ...payload,
    resellerId,
    read: false,
    createdAt: serverTimestamp(),
  });
  return notifDoc.id;
}

/**
 * Envia a mesma notificação para TODOS os revendedores ativos.
 * Utiliza batched writes para performance — divide em lotes de 500.
 */
export async function broadcastNotification(
  payload: CreateNotificationPayload,
  activeResellerIds: string[]
): Promise<void> {
  const BATCH_SIZE = 500;

  for (let i = 0; i < activeResellerIds.length; i += BATCH_SIZE) {
    const chunk = activeResellerIds.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const resellerId of chunk) {
      const ref = doc(resellerNotificationsRef(resellerId));
      batch.set(ref, {
        ...payload,
        target: "all",
        resellerId,
        read: false,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }
}

/**
 * Cria notificação automática de nova mensagem no chamado de suporte.
 * Chamada pelo supportService após sendMessage.
 */
export async function notifyNewTicketMessage(params: {
  resellerId: string;
  ticketId: string;
  ticketSubject: string;
  senderName: string;
  adminUid: string;
}): Promise<void> {
  await createNotificationForReseller(params.resellerId, {
    type: "ticket",
    title: "Nova mensagem no seu chamado",
    message: `${params.senderName} respondeu: "${params.ticketSubject}"`,
    target: "specific",
    resellerId: params.resellerId,
    ticketId: params.ticketId,
    createdBy: params.adminUid,
  });
}

// ─── Read / Update ────────────────────────────────────────────────────────────

/**
 * Retorna notificações de um revendedor (mais recentes primeiro).
 */
export async function getResellerNotifications(
  resellerId: string,
  limitToUnread = false
): Promise<Notification[]> {
  const ref = resellerNotificationsRef(resellerId);
  const constraints = limitToUnread
    ? [where("read", "==", false), orderBy("createdAt", "desc")]
    : [orderBy("createdAt", "desc")];

  const q = query(ref, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
}

/**
 * Marca uma notificação específica como lida.
 */
export async function markNotificationAsRead(
  resellerId: string,
  notificationId: string
): Promise<void> {
  const ref = doc(db, "resellers", resellerId, "notifications", notificationId);
  await updateDoc(ref, { read: true });
}

/**
 * Marca todas as notificações de um revendedor como lidas.
 */
export async function markAllNotificationsAsRead(
  resellerId: string
): Promise<void> {
  const ref = resellerNotificationsRef(resellerId);
  const q = query(ref, where("read", "==", false));
  const snap = await getDocs(q);

  if (snap.empty) return;

  const BATCH_SIZE = 500;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + BATCH_SIZE).forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

/**
 * Escuta em tempo real as notificações não lidas de um revendedor.
 * Ideal para o sino de notificações no header.
 */
export function subscribeToUnreadNotifications(
  resellerId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const ref = resellerNotificationsRef(resellerId);
  const q = query(
    ref,
    where("read", "==", false),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Notification)
    );
    callback(notifs);
  });
}
