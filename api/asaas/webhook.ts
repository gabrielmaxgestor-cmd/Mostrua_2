import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../../server/firebaseAdmin';
import admin from 'firebase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const event = req.body;
    const { event: eventType, payment } = event;

    if (!payment?.subscription) return res.status(200).json({ received: true });

    const asaasSubId = payment.subscription;

    // Encontre a subscription no Firestore pelo asaasSubscriptionId
    const subSnap = await adminDb.collection('subscriptions')
      .where('asaasSubscriptionId', '==', asaasSubId)
      .limit(1).get();

    if (subSnap.empty) return res.status(200).json({ received: true });

    const subRef = subSnap.docs[0].ref;

    if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
      const dueDate = new Date(payment.dueDate);
      const nextPeriod = new Date(dueDate);
      nextPeriod.setMonth(nextPeriod.getMonth() + 1);

      await subRef.update({
        status: 'active',
        currentPeriodStart: admin.firestore.Timestamp.fromDate(dueDate),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(nextPeriod),
        lastPaymentAt: admin.firestore.Timestamp.now(),
        invoiceUrl: payment.invoiceUrl || null
      });
    }

    if (eventType === 'PAYMENT_OVERDUE') {
      await subRef.update({ status: 'past_due' });
    }

    if (eventType === 'SUBSCRIPTION_DELETED') {
      await subRef.update({ status: 'canceled' });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
}
