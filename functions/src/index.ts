import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const setAdminClaim = functions.https.onCall(async (data, context) => {
  // Só pode ser chamada por quem já é admin ou pelo primeiro setup
  if (!context.auth?.token.admin && !context.auth?.token.email?.endsWith('@seudominio.com')) {
    throw new functions.https.HttpsError('permission-denied', 'Não autorizado.');
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

export const bootstrapFirstAdmin = functions.https.onRequest(async (req, res) => {
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
