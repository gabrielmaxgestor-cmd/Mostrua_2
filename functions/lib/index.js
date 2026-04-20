"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapFirstAdmin = exports.setAdminClaim = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
    var _a;
    // Só pode ser chamada por quem já é admin
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
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
exports.bootstrapFirstAdmin = functions.https.onRequest(async (req, res) => {
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
    }
    catch (error) {
        console.error("Error setting custom claims:", error);
        res.status(500).json({ error: 'Erro ao conceder admin claim.' });
    }
});
//# sourceMappingURL=index.js.map