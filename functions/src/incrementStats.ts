import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * IMPORTANTE:
 * Se você usar Firebase Cloud Functions (Node.js/TypeScript), 
 * este é o esqueleto da function que captura as visitas e pedidos 
 * atômicos feitos pelos componentes React e empila nas métricas gerais de [7d, 30d, 90d].
 * 
 * Este arquivo deve ficar em sua pasta /functions/src/ e sofrer deploy (firebase deploy --only functions).
 * Não deve ser importado via React web diretamente.
 */

try {
  admin.initializeApp();
} catch (e) {
  // Já inicializado
}

const db = admin.firestore();

export const incrementStats = functions.firestore
  .document("catalogs/{catalogId}/products/{productId}/stats/{statId}")
  .onWrite(async (change, context) => {
    const { catalogId, productId } = context.params;

    // Se delete, não faremos nada longo por segurança/integridade.
    if (!change.after.exists) return null;

    const newData = change.after.data();
    const oldData = change.before.exists ? change.before.data() : { views: 0, orders: 0 };

    // Pega o delta (diferença do trigger)
    const deltaViews = (newData?.views || 0) - (oldData?.views || 0);
    const deltaOrders = (newData?.orders || 0) - (oldData?.orders || 0);

    if (deltaViews === 0 && deltaOrders === 0) return null;

    // Recuperar dados do produto para extrair o team e name para o summary
    const productSnap = await db.doc(`catalogs/${catalogId}/products/${productId}`).get();
    if (!productSnap.exists) return null;
    
    const productData = productSnap.data();
    const team = productData?.team || "Outros";
    const productName = productData?.name || "Camisa Desconhecida";
    const categoryType = productData?.type || "torcedor";

    console.log(`Atualizando Catalog: ${catalogId} | +Views:${deltaViews} +Orders:${deltaOrders}`);

    const batch = db.batch();
    const periods = ["7d", "30d", "90d"];

    for (const period of periods) {
      const summaryRef = db.doc(`catalogs/${catalogId}/analytics/summary_${period}`);

      batch.set(summaryRef, {
        totalViews: admin.firestore.FieldValue.increment(deltaViews),
        totalOrders: admin.firestore.FieldValue.increment(deltaOrders),
        lastAggregated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // IMPORTANTE: Devido à limitação do Firestore FieldValue, arrays complexos como topProducts 
      // ou categoryDistribution exigem lógica mais profunda (ex: ler o Doc inteiro e reescrever ordenado) 
      // para casos grandes e complexos.
      
      // Porém, em infra serverless leve, salvamos as transações brutas em `/analytics/{period}/logs` 
      // ou atualizamos um sub documento de contador para fazer queries agregadas e não causar Data Contention (1 write/sec limit do form).
      
      const teamRef = summaryRef.collection('teams').doc(team);
      batch.set(teamRef, { 
        views: admin.firestore.FieldValue.increment(deltaViews),
        name: team 
      }, { merge: true });

      const prodRef = summaryRef.collection('products').doc(productId);
      batch.set(prodRef, {
         views: admin.firestore.FieldValue.increment(deltaViews),
         orders: admin.firestore.FieldValue.increment(deltaOrders),
         name: productName,
         team: team
      }, { merge: true });

      const catRef = summaryRef.collection('categories').doc(categoryType);
      batch.set(catRef, {
         views: admin.firestore.FieldValue.increment(deltaViews),
         name: categoryType
      }, { merge: true });
    }

    return batch.commit();
  });
