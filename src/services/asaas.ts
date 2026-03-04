import { supabase } from '../lib/supabase';

export interface PaymentResponse {
    id: string;
    status: string;
    invoiceUrl: string;
    pixQrCodeBase64?: string;
    pixCopyPaste?: string;
    value: number;
    description: string;
}

/**
 * Cria uma cobrança PIX real via Supabase Edge Function (Proxy)
 */
export const createPayment = async (
    userId: string,
    plan: { id: string; name: string; price: number },
    userEmail: string,
    userName: string,
    userCpf: string,
    splitWalletId?: string,
    billingType?: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'
): Promise<PaymentResponse> => {
    console.log(`[Asaas] Invocando Edge Function para criar cobrança: ${plan.name} via ${billingType || 'PIX'}`);

    if (!userCpf || userCpf.replace(/\D/g, '').length < 11) {
        throw new Error('CPF é obrigatório para gerar cobranças. Preencha seu CPF no perfil.');
    }

    const { data, error } = await supabase.functions.invoke('asaas-proxy', {
        body: {
            action: 'createPayment',
            payload: {
                userId,
                plan,
                email: userEmail,
                name: userName,
                cpf: userCpf,
                splitWalletId: splitWalletId || null,
                billingType
            }
        }
    });

    if (error) {
        console.error('[Asaas] Erro ao invocar Edge Function:', error);
        throw new Error(error.message || 'Erro ao processar pagamento');
    }

    if (data?.error) {
        console.error('[Asaas] Erro retornado pela Edge Function:', data.error);
        throw new Error(data.error);
    }

    return data as PaymentResponse;
};

/**
 * Verifica o status real do pagamento via Supabase Edge Function
 */
export const checkPaymentStatus = async (paymentId: string): Promise<string> => {
    console.log(`[Asaas] Verificando status via Edge Function: ${paymentId}`);

    const { data, error } = await supabase.functions.invoke('asaas-proxy', {
        body: {
            action: 'checkStatus',
            payload: { paymentId }
        }
    });

    if (error) {
        console.error('[Asaas] Erro no checkStatus:', error);
        throw new Error('Erro ao verificar status do pagamento');
    }

    if (data?.error) {
        console.error('[Asaas] Erro retornado no checkStatus:', data.error);
        throw new Error(data.error);
    }

    // Mapeamos RECEIVED e CONFIRMED como "CONFIRMED" para o frontend
    if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
        return 'CONFIRMED';
    }

    return data.status;
};
