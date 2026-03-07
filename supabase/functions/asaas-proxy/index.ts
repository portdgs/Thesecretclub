import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
}

console.log("LOG: Sistema Asaas Proxy v15 (Hyper-Logging)")

serve(async (req) => {
    // --- LOG DE ENTRADA ABSOLUTA ---
    console.log(`LOG_ENTRY: [${req.method}] ${req.url}`)

    if (req.method === 'OPTIONS') {
        console.log("LOG: [OPTIONS] Respondendo Preflight CORS.")
        return new Response('ok', { status: 200, headers: corsHeaders })
    }

    try {
        console.log(`LOG: [${req.method}] Processando requisição...`)

        // Configurações de API do Asaas
        const DEFAULT_URL = 'https://api.asaas.com/v3'
        const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || DEFAULT_URL
        const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada nos Secrets")
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase internal keys (URL/SERVICE_ROLE) missing")

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        const bodyText = await req.text()
        console.log(`LOG: Body recebido (${bodyText.length} bytes)`)

        const parsedBody = bodyText ? JSON.parse(bodyText) : {}
        const action = parsedBody.action
        const payload = parsedBody.payload || {}
        const headers = {
            'Content-Type': 'application/json',
            'access_token': (ASAAS_API_KEY || '').trim()
        }

        console.log(`LOG: Ação identificada: ${action || 'Evento Webhook'}`)

        // --- SEGURANÇA WEBHOOK ---
        if (parsedBody.event && action !== 'checkStatus' && action !== 'withdraw') {
            console.log(`LOG: Validando Token do Webhook...`)
            const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
            const requestToken = req.headers.get('asaas-access-token')

            if (webhookToken && requestToken !== webhookToken) {
                console.error("ERRO: Token de Webhook inválido!")
                return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: corsHeaders })
            }
        }

        // 1. CRIAR PAGAMENTO (PIX OU CHECKOUT)
        if (action === 'createPayment') {
            const { userId, planId, email, name, cpf, splitWalletId, billingType } = payload
            console.log(`LOG: Criando pagamento para User ${userId}, Plano ${planId}, Tipo ${billingType}`)

            // Busca ou Cria Cliente no Asaas
            console.log(`LOG: Buscando/Criando cliente no Asaas (CPF: ${cpf?.substring(0, 3)}...)...`)
            const searchRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cpf}`, { headers })
            const searchData = await searchRes.json()
            let customerId = searchData.data?.[0]?.id

            if (!customerId) {
                console.log(`LOG: Cliente não encontrado. Criando novo...`)
                const createCustRes = await fetch(`${ASAAS_API_URL}/customers`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ name, email, cpfCnpj: cpf })
                })
                const newCust = await createCustRes.json()
                customerId = newCust.id
            }

            // Mapeamento de preços por Plano
            const plans: any = { 'Bronze': 37.90, 'Prata': 87.00, 'Ouro': 174.00, 'Platina': 397.00 }
            const amount = plans[planId] || 37.90

            // Cria Cobrança
            console.log(`LOG: Gerando cobrança para Customer ${customerId}...`)
            const paymentBody: any = {
                customer: customerId,
                billingType: billingType || 'PIX',
                value: amount,
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                description: `Assinatura Clube Privado - Plano ${planId}`,
                externalReference: `${userId}_${Date.now()}`
            }

            // Se for indicado por alguém, configura o split (Comissão de 15%)
            if (splitWalletId) {
                paymentBody.split = [{
                    walletId: splitWalletId,
                    fixedValue: amount * 0.15, // Mandato: 15% fixo
                }]
            }

            const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
                method: 'POST',
                headers,
                body: JSON.stringify(paymentBody)
            })
            const paymentResult = await paymentRes.json()

            if (!paymentRes.ok) throw new Error(paymentResult.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas');

            // Se for PIX, busca o QR Code
            let pixData = null
            if (billingType === 'PIX') {
                console.log(`LOG: Gerando QR Code PIX...`)
                const pixRes = await fetch(`${ASAAS_API_URL}/payments/${paymentResult.id}/pixQrCode`, { headers })
                pixData = await pixRes.json()
            }

            console.log(`LOG: Pagamento criado com sucesso: ${paymentResult.id}`)
            return new Response(JSON.stringify({
                id: paymentResult.id,
                status: paymentResult.status,
                invoiceUrl: paymentResult.invoiceUrl,
                pixQrCodeBase64: pixData?.encodedImage,
                pixCopyPaste: pixData?.payload,
                value: paymentResult.value
            }), { status: 200, headers: corsHeaders })
        }

        // 2. SOLICITAR SAQUE (AUTOMÁTICO E SEGURO)
        if (action === 'withdraw') {
            const { userId } = payload
            console.log(`LOG: Processando saque para User ${userId}`)

            const { data: pendingComms, error: commsErr } = await supabase
                .from('affiliate_commissions')
                .select('id, amount')
                .eq('referrer_id', userId)
                .eq('status', 'pending')
                .lte('available_at', new Date().toISOString());

            if (commsErr) throw new Error('Erro ao buscar comissões pendentes');

            const totalToWithdraw = (pendingComms || []).reduce((acc: number, comm: any) => acc + parseFloat(comm.amount), 0);

            if (totalToWithdraw <= 0) throw new Error('Não há comissões pendentes e liberadas para saque (Carência de 7 dias).');
            if (totalToWithdraw < 100) throw new Error(`Saldo disponível insuficiente (Min. R$ 100). Disponível: R$ ${totalToWithdraw.toFixed(2)}`);

            // Anti-múltiplos cliques / Race Condition
            const { data: processingCheck } = await supabase
                .from('affiliate_commissions')
                .select('id')
                .eq('referrer_id', userId)
                .eq('status', 'processing')
                .limit(1);
            if (processingCheck && processingCheck.length > 0) throw new Error('Já existe um saque em processamento.');

            const commIds = pendingComms.map((c: any) => c.id);
            await supabase.from('affiliate_commissions').update({ status: 'processing' }).in('id', commIds);

            const { data: profile } = await supabase.from('profiles').select('pix_key, pix_key_type').eq('id', userId).single();
            if (!profile?.pix_key) throw new Error('Chave PIX não cadastrada no perfil');

            console.log(`LOG: Iniciando transferência de R$ ${totalToWithdraw} para ${userId}`);

            const transRes = await fetch(`${ASAAS_API_URL}/transfers`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    value: totalToWithdraw,
                    pixAddressKey: profile.pix_key,
                    pixAddressKeyType: profile.pix_key_type,
                    description: 'Saque de Afiliado - Clube Privado'
                })
            })
            const transData = await transRes.json()
            if (!transRes.ok) {
                // Reverte status caso o Asaas negue
                await supabase.from('affiliate_commissions').update({ status: 'pending' }).in('id', commIds);
                throw new Error(transData.errors?.[0]?.description || 'Erro na transferência PIX');
            }

            // Sucesso: Zera saldo no perfil legado e marca comissões como pagas
            await supabase.from('profiles').update({ balance: 0 }).eq('id', userId);
            await supabase.from('affiliate_commissions').update({ status: 'paid', asaas_transfer_id: transData.id }).in('id', commIds);

            console.log(`LOG: Saque concluído: ${transData.id}`)
            return new Response(JSON.stringify({ success: true, transferId: transData.id, amount: totalToWithdraw }), { status: 200, headers: corsHeaders })
        }

        // 3. WEBHOOK / CHECK STATUS (GERAR COMISSÃO)
        if (action === 'checkStatus' || parsedBody.event) {
            const data = action === 'checkStatus'
                ? await (await fetch(`${ASAAS_API_URL}/payments/${payload.paymentId}`, { headers })).json()
                : (parsedBody.event === 'PAYMENT_RECEIVED' || parsedBody.event === 'PAYMENT_CONFIRMED') ? parsedBody.payment : null;

            if (!data) return new Response('Ignored', { status: 200, headers: corsHeaders });

            const paymentId = data.id;
            console.log(`LOG: Processando Status do Pagamento ${paymentId}. Status: ${data.status}`);

            if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
                const { data: existing } = await supabase.from('affiliate_commissions').select('id').or(`asaas_payment_id.eq.${paymentId},asaas_transfer_id.eq.${paymentId}`).single()
                if (!existing) {
                    const userId = data.externalReference?.split('_')[0]
                    const { data: userProfile } = await supabase.from('profiles').select('id, referred_by, cpf').eq('id', userId || '').single()

                    if (userProfile?.referred_by) {
                        const { data: referrerProfile } = await supabase.from('profiles').select('cpf').eq('id', userProfile.referred_by).single();

                        // Prevenção de Autofiliação
                        const isSuspicious = referrerProfile?.cpf && userProfile?.cpf && (referrerProfile.cpf === userProfile.cpf);
                        const statusStr = isSuspicious ? 'suspicious' : 'pending';

                        const amount = (data.netValue || data.value) * 0.15 // Mandato: 15% sobre o valor líquido
                        const availableAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                        await supabase.from('affiliate_commissions').insert({
                            referrer_id: userProfile.referred_by,
                            referred_user_id: userProfile.id,
                            amount: amount,
                            status: statusStr,
                            asaas_payment_id: paymentId,
                            available_at: availableAt
                        })

                        if (!isSuspicious) {
                            const { data: referrer } = await supabase.from('profiles').select('balance').eq('id', userProfile.referred_by).single()
                            await supabase.from('profiles').update({ balance: (parseFloat(referrer?.balance || 0) + amount) }).eq('id', userProfile.referred_by)
                            console.log(`LOG: Comissão gerada para ${userProfile.referred_by} (Disponível em 7 dias)`);
                        } else {
                            console.log(`LOG: ALERTA FRAUDE. Autofiliação bloqueada para CPF ${userProfile.cpf}. Comissão como suspicious.`);
                        }
                    }
                }
            }
            return new Response(JSON.stringify({ status: data.status }), { status: 200, headers: corsHeaders })
        }

        return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: corsHeaders })

    } catch (e: any) {
        console.error(`LOG ERRO FATAL: ${e.message}`)
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: corsHeaders })
    }
})
