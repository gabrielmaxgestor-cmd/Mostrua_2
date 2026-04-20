import type { VercelRequest, VercelResponse } from '@vercel/node';
import { asaasService } from '../../server/asaasService';
import { adminDb } from '../../server/firebaseAdmin';
 
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, email, phone, uid } = req.body;
    if (!name || !email || !uid) return res.status(400).json({ error: 'Campos obrigatorios: name, email, uid' });
    const customer = await asaasService.createCustomer(name, email, undefined, phone);
    await adminDb.doc(`users/${uid}`).update({ asaasCustomerId: customer.id });
    res.json({ customerId: customer.id });
  } catch (err: any) {
    console.error('Erro ao criar customer Asaas:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
}
