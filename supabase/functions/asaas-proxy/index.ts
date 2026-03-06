import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
}

console.log("LOG: Sistema Asaas Proxy v14 (Bootstrap)")

serve(async (req) => {
    // --- LOG DE ENTRADA ABSOLUTA ---
    console.log(`LOG_ENTRY: [${req.method}] ${req.url}`)

    // Configurações de API do Asaas
    const DEFAULT_URL = 'https://api.asaas.com/v3'
    const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || DEFAULT_URL
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`LOG: [${req.method}] ${req.url} - Iniciado.`)

    if (req.method === 'OPTIONS') {
        console.log("LOG: [OPTIONS] Respondendo Preflight CORS.")
        return new Response('ok', { status: 200, headers: corsHeaders })
    }

    // Validação de variáveis de ambiente no boot da requisição real
    if (!ASAAS_API_KEY) {
        console.error("ERRO: ASAAS_API_KEY não configurada nos Secrets do Supabase!")
        return new Response(JSON.stringify({ error: 'Configuração do servidor incompleta (API_KEY)' }), { status: 500, headers: corsHeaders })
    }

    try {
        const bodyText = await req.text()
        console.log(`LOG: Body recebido (${bodyText.length} bytes)`)

        const parsedBody = bodyText ? JSON.parse(bodyText) : {}
        const action = parsedBody.action
        const payload = parsedBody.payload
        const headers = {
            'Content-Type': 'application/json',
            'access_token': (ASAAS_API_KEY || '').trim()
        }

        console.log(`LOG: Ação identificada: ${action || 'Evento Webhook'}`)

        // --- SEGURANÇA WEBHOOK ---
        // Se for um evento enviado pelo Asaas (sem a ação manual 'checkStatus'), validamos o token
        if (parsedBody.event && action !== 'checkStatus') {
            console.log(`LOG: Validando Token do Webhook...`)
            const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
            const requestToken = req.headers.get('asaas-access-token')

            if (webhookToken && requestToken !== webhookToken) {
                console.error("ERRO: Token de Webhook inválido!")
                return new Response(JSON.stringify({ error: 'Unauthorized Webhook' }), { status: 401, headers: corsHeaders })
            }
        }

        if (action === 'ping') return new Response(JSON.stringify({ message: 'pong' }), { status: 200, headers: corsHeaders })

        // 1. CRIAR COBRANÇA (PIX OU CARTÃO)
        if (action === 'createPayment') {
            const { name, email, cpf, plan, userId, billingType = 'PIX' } = payload
            console.log(`LOG: Criando pagamento para User ${userId}, Plano ${plan?.name}, Tipo ${billingType}`)

            const cleanCpf = (cpf || '').replace(/\D/g, '')

            // Busca ou Cria Cliente no Asaas
            console.log(`LOG: Buscando/Criando cliente no Asaas (CPF: ${cleanCpf.substring(0, 3)}...)...`)
            const searchRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpf}`, { headers })
            const searchData = await searchRes.json()

            if (!searchRes.ok) {
                console.error("ERRO Asaas Customers:", searchData)
                throw new Error(searchData.errors?.[0]?.description || 'Erro ao buscar cliente no Asaas')
            }

            let customerId = (searchData.data?.[0]?.id)

            if (!customerId) {
                console.log(`LOG: Cliente não encontrado. Criando novo...`)
                const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ name, email, cpfCnpj: cleanCpf })
                })
                const customerData = await createRes.json()
                if (!createRes.ok) throw new Error(customerData.errors?.[0]?.description || 'Erro criar cliente')
                customerId = customerData.id
            }

            console.log(`LOG: Gerando cobrança para Customer ${customerId}...`)
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 1)
            const payRes = await fetch(`${ASAAS_API_URL}/payments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    customer: customerId,
                    billingType: billingType,
                    value: plan.price,
                    dueDate: dueDate.toISOString().split('T')[0],
                    description: `Assinatura Plano ${plan.name} - Clube Privado`,
                    externalReference: `${userId}_${plan.id}`
                })
            })
            const paymentResult = await payRes.json()
            if (!payRes.ok) throw new Error(paymentResult.errors?.[0]?.description || 'Erro ao gerar cobrança')

            // Busca QR Code apenas se o método for PIX
            let pixData = null;
            if (billingType === 'PIX') {
                console.log(`LOG: Gerando QR Code PIX...`)
                const pixRes = await fetch(`${ASAAS_API_URL}/payments/${paymentResult.id}/pixQrCode`, { headers })
                pixData = await pixRes.json()
            }

            console.log(`LOG: Pagamento criado com sucesso: ${paymentResult.id}`)
            return new Response(JSON.stringify({
                id: paymentResult.id,
                status: paymentResult.status,
                invoiceUrl: paymentResult.invoiceUrl, // Link de pagamento para Cartão/Boleto
                pixQrCodeBase64: pixData?.encodedImage,
                pixCopyPaste: pixData?.payload,
                value: paymentResult.value
            }), { status: 200, headers: corsHeaders })
        }

        // 2. SOLICITAR SAQUE (AUTOMÁTICO E SEGURO)
        if (action === 'withdraw') {
            const { userId } = payload
            console.log(`LOG: Processando saque para User ${userId}`)

            // BUSCA COMISSÕES PENDENTES NO BACKEND (Mandato de Segurança)
            const { data: pendingComms, error: commsErr } = await supabase
                .from('affiliate_commissions')
                .select('id, amount')
                .eq('referrer_id', userId)
                .eq('status', 'pending');

            if (commsErr) throw new Error('Erro ao buscar comissões pendentes');

            const totalToWithdraw = (pendingComms || []).reduce((acc: number, comm: any) => acc + parseFloat(comm.amount), 0);

            if (totalToWithdraw <= 0) throw new Error('Não há comissões pendentes para saque');
            if (totalToWithdraw < 5) throw new Error('Saldo insuficiente (mínimo R$ 5)');

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
            if (!transRes.ok) throw new Error(transData.errors?.[0]?.description || 'Erro na transferência PIX');

            // Sucesso: Zera saldo no perfil e marca comissões como pagas
            const { error: profileUpdErr } = await supabase.from('profiles').update({ balance: 0 }).eq('id', userId);
            if (profileUpdErr) console.error("ERRO: Falha ao zerar saldo do perfil:", profileUpdErr);

            const commIds = pendingComms.map((c: any) => c.id);
            const { error: commsUpdErr } = await supabase
                .from('affiliate_commissions')
                .update({ status: 'paid', asaas_transfer_id: transData.id })
                .in('id', commIds);

            if (commsUpdErr) console.error("ERRO: Falha ao atualizar status das comissões:", commsUpdErr);

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
                const { data: existing } = await supabase.from('affiliate_commissions').select('id').eq('asaas_transfer_id', paymentId).single()
                if (!existing) {
                    const userId = data.externalReference?.split('_')[0]
                    const { data: userProfile } = await supabase.from('profiles').select('id, referred_by').eq('id', userId || '').single()

                    if (userProfile?.referred_by) {
                        const amount = data.value * 0.15 // Mandato: 15%
                        const { error: insErr } = await supabase.from('affiliate_commissions').insert({
                            referrer_id: userProfile.referred_by,
                            referred_user_id: userProfile.id,
                            amount: amount,
                            status: 'pending',
                            asaas_transfer_id: paymentId
                        })

                        if (insErr) console.error('ERRO: Falha ao inserir comissão:', insErr)

                        // Atualiza saldo redundante no perfil (facilitador)
                        const { data: referrer } = await supabase.from('profiles').select('balance').eq('id', userProfile.referred_by).single()
                        await supabase.from('profiles').update({ balance: (parseFloat(referrer?.balance || 0) + amount) }).eq('id', userProfile.referred_by)
                        console.log(`LOG: Comissão gerada para ${userProfile.referred_by}`);
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
