import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const setAdminClaim = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Só pode ser chamada por quem já é admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Somente administradores podem executar esta ação.');
  }
  
  const { uid, isAdmin } = data;
  
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'O uid é obrigatório.');
  }

  await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
  
  // Atualizar role no Firestore também para consistência
  await admin.firestore().doc(`users/${uid}`).update({ role: isAdmin ? 'admin' : 'reseller' });
  
  return { success: true, message: `Admin claim ${isAdmin ? 'concedido' : 'revogado'} para ${uid}` };
});

export const bootstrapFirstAdmin = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  // Proteger com secret key no header
  const secret = req.headers['x-bootstrap-secret'];
  if (secret !== process.env.BOOTSTRAP_SECRET) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }
  
  const { uid } = req.body;
  if (!uid) {
    res.status(400).json({ error: 'O uid é obrigatório.' });
    return;
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    // Opcional: Atualizar o Firestore também
    await admin.firestore().doc(`users/${uid}`).set({ role: 'admin' }, { merge: true });
    
    res.json({ success: true, message: `Admin claim concedido para ${uid}` });
  } catch (error) {
    console.error("Error setting custom claims:", error);
    res.status(500).json({ error: 'Erro ao conceder admin claim.' });
  }
});

/**
 * expireTrials
 * Roda todo dia às 03:00 (horário de Brasília).
 * Busca todas as subscriptions com status = "trial" cujo currentPeriodEnd já passou
 * e atualiza o status para "expired" via batch.
 */
export const expireTrials = functions.pubsub
  .schedule("0 3 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const expiredTrials = await db
      .collection("subscriptions")
      .where("status", "==", "trial")
      .where("currentPeriodEnd", "<=", now)
      .get();

    if (expiredTrials.empty) {
      console.log("[expireTrials] Nenhum trial expirado encontrado.");
      return;
    }

    // Firestore batch suporta até 500 operações por vez
    const BATCH_SIZE = 500;
    const docs = expiredTrials.docs;
    let updated = 0;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + BATCH_SIZE);
      chunk.forEach((docSnap) => {
        batch.update(docSnap.ref, { status: "expired" });
      });
      await batch.commit();
      updated += chunk.length;
    }

    console.log(`[expireTrials] ${updated} trial(s) expirado(s) atualizado(s) para "expired".`);
  });
