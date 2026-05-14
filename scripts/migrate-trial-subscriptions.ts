/**
 * migrate-trial-subscriptions.ts
 *
 * Script de migração: cria trial subscriptions para revendedores que
 * foram cadastrados pelo fluxo legado (authService.registerReseller) e
 * não possuem documento em /subscriptions/{uid}.
 *
 * COMO EXECUTAR:
 *   1. Instale ts-node se ainda não tiver:
 *      npm install -D ts-node
 *
 *   2. Na raiz do projeto, execute:
 *      npx ts-node scripts/migrate-trial-subscriptions.ts
 *
 * IMPORTANTE:
 *   - O script é idempotente: revendedores que já têm subscription são ignorados.
 *   - Revendedores sem subscription recebem status "expired" (não "trial"),
 *     pois não sabemos quando foram criados e o período de 7 dias já passou.
 *     Se quiser reativar o trial de algum usuário específico, ajuste manualmente
 *     no Firestore ou mude a lógica abaixo.
 */

import { collection, getDocs, getDoc, setDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { db } from "../src/firebase";

async function migrateTrialSubscriptions() {
  console.log("=== Iniciando migração de trial subscriptions ===\n");

  // 1. Busca todos os revendedores
  const resellersSnap = await getDocs(collection(db, "resellers"));

  if (resellersSnap.empty) {
    console.log("Nenhum revendedor encontrado. Migração encerrada.");
    return;
  }

  console.log(`Revendedores encontrados: ${resellersSnap.size}\n`);

  // 2. Busca o plano PRO para usar como planId padrão
  const plansSnap = await getDocs(
    query(collection(db, "plans"), where("name", "==", "PRO"))
  );
  const planId = plansSnap.empty ? "plan_pro" : plansSnap.docs[0].id;
  console.log(`Usando planId: ${planId}\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const resellerDoc of resellersSnap.docs) {
    const uid = resellerDoc.id;
    const resellerData = resellerDoc.data();

    try {
      // 3. Verifica se já existe uma subscription para este revendedor
      const subscriptionRef = doc(db, "subscriptions", uid);
      const existingSub = await getDoc(subscriptionRef);

      if (existingSub.exists()) {
        console.log(`[SKIP] ${resellerData.email || uid} — já possui subscription (status: ${existingSub.data().status})`);
        skipped++;
        continue;
      }

      // 4. Não tem subscription — cria como "expired"
      //    Justificativa: o trial de 7 dias já passou para estes usuários.
      //    Eles precisarão assinar um plano para continuar usando.
      //    Se quiser dar um novo trial, troque status por "trial" e ajuste currentPeriodEnd.
      await setDoc(subscriptionRef, {
        resellerId: uid,
        planId,
        status: "expired",                         // <— Mude para "trial" se quiser reativar
        currentPeriodStart: resellerData.createdAt ?? Timestamp.now(),
        currentPeriodEnd: resellerData.createdAt ?? Timestamp.now(), // já no passado = expirado
        paymentProvider: "trial",
        migratedAt: Timestamp.now(),
        createdAt: resellerData.createdAt ?? Timestamp.now(),
      });

      console.log(`[CRIADO] ${resellerData.email || uid} — subscription criada com status "expired"`);
      created++;

    } catch (err) {
      console.error(`[ERRO] ${resellerData.email || uid}:`, err);
      errors++;
    }
  }

  console.log("\n=== Migração concluída ===");
  console.log(`✅ Criados:  ${created}`);
  console.log(`⏭️  Pulados:  ${skipped} (já tinham subscription)`);
  console.log(`❌ Erros:    ${errors}`);
}

migrateTrialSubscriptions().catch((err) => {
  console.error("Erro fatal na migração:", err);
  process.exit(1);
});
