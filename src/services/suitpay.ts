import { supabase } from '../lib/supabase';

export interface SuitPayResponse {
    id: string; // The transaction ID from SuitPay
    status: string;
    invoiceUrl?: string; // For credit card or boleto
    pixQrCodeBase64?: string;
    pixCopyPaste?: string;
    value: number;
    description: string;
}

/**
 * Cria uma cobrança PIX/Cartão via Supabase Edge Function (Proxy) para SuitPay
 */
export const createSuitPayment = async (
    userId: string,
    plan: { id: string; name: string; price: number },
    userEmail: string,
    userName: string,
    userCpf: string,
    inviterId?: string | null,
    billingType?: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
): Promise<SuitPayResponse> => {
    console.log(`[SuitPay] Invocando Edge Function para criar cobrança: ${plan.name} via ${billingType || 'PIX'}`);

    if (!userCpf || userCpf.replace(/\D/g, '').length < 11) {
        throw new Error('CPF é obrigatório para gerar cobranças. Preencha seu CPF no perfil.');
    }

    const { data, error } = await supabase.functions.invoke('suitpay-proxy', {
        body: {
            action: 'createPayment',
            payload: {
                userId,
                plan,
                email: userEmail,
                name: userName,
                cpf: userCpf,
                inviterId: inviterId || null,
                billingType
            }
        }
    });

    if (error) {
        console.error('[SuitPay] Erro ao invocar Edge Function:', error);
        throw new Error(error.message || 'Erro ao processar pagamento com SuitPay');
    }

    if (data?.error) {
        console.error('[SuitPay] Erro retornado pela Edge Function:', data.error);
        throw new Error(data.error);
    }

    return data as SuitPayResponse;
};

/**
 * Verifica o status real do pagamento via Supabase Edge Function para SuitPay
 */
export const checkSuitPaymentStatus = async (paymentId: string): Promise<string> => {
    console.log(`[SuitPay] Verificando status via Edge Function: ${paymentId}`);

    const { data, error } = await supabase.functions.invoke('suitpay-proxy', {
        body: {
            action: 'checkStatus',
            payload: { paymentId }
        }
    });

    if (error) {
        console.error('[SuitPay] Erro no checkStatus:', error);
        throw new Error('Erro ao verificar status do pagamento');
    }

    if (data?.error) {
        console.error('[SuitPay] Erro retornado no checkStatus:', data.error);
        throw new Error(data.error);
    }

    if (data.status === 'PAID' || data.status === 'CONFIRMED') {
        return 'CONFIRMED';
    }

    return data.status;
};
