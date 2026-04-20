import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asaasService } from '../../server/asaasService';
import { adminDb } from '../../server/firebaseAdmin';
import admin from 'firebase-admin';
 
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { customerId, value, description, planId, resellerId } = req.body;
    const sub = await asaasService.createSubscription(customerId, value, description);
    const invoiceUrl = await asaasService.getPaymentLink(sub.id);
    await adminDb.collection('subscriptions').doc(resellerId).set({
      resellerId, planId, status: 'pending',
      asaasSubscriptionId: sub.id, invoiceUrl: invoiceUrl || '',
      createdAt: admin.firestore.Timestamp.now()
    }, { merge: true });
    res.json({ subscription: sub, invoiceUrl });
  } catch (err: any) {
    console.error('Erro ao criar subscription Asaas:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
}
