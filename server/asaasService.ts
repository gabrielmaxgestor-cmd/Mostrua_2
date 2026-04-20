const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

export const IS_SANDBOX = ASAAS_API_URL.includes('sandbox');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION && IS_SANDBOX) {
  throw new Error('ERRO CRITICO: Asaas em modo SANDBOX em ambiente de PRODUCAO. Configure ASAAS_API_URL corretamente.');
}
if (IS_SANDBOX) {
  console.warn('[ASAAS] ATENCAO: Modo sandbox ativo. Nenhum pagamento real sera processado.');
}

const headers = {
  'Content-Type': 'application/json',
  'access_token': ASAAS_API_KEY
};

export const asaasService = {
  async createCustomer(name: string, email: string, cpfCnpj?: string, phone?: string) {
    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        email,
        cpfCnpj,
        phone
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Asaas createCustomer error:', error);
      throw new Error('Failed to create Asaas customer');
    }

    return response.json();
  },

  async createSubscription(customerId: string, value: number, description: string) {
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1); // Start billing tomorrow or today? Usually today for immediate payment, but Asaas requires nextDueDate. Let's use today if possible, or tomorrow.
    // Actually, Asaas allows creating a subscription. If we want immediate payment, we can create a subscription with nextDueDate = today.
    
    const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED', // Let user choose (CREDIT_CARD, BOLETO, PIX)
        value,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Asaas createSubscription error:', error);
      throw new Error('Failed to create Asaas subscription');
    }

    return response.json();
  },

  async getPaymentLink(subscriptionId: string) {
    // In Asaas, a subscription generates payments. We can get the first payment to get the invoiceUrl.
    const response = await fetch(`${ASAAS_API_URL}/payments?subscription=${subscriptionId}`, {
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription payments');
    }

    const data: any = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].invoiceUrl;
    }
    return null;
  }
};
