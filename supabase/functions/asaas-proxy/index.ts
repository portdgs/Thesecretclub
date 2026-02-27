import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
}

console.log("LOG: Sistema Asaas Proxy carregado v12 (Secure Withdrawal + Webhooks)")

serve(async (req) => {
    // Configurações dinâmicas - Mudamos o padrão para Sandbox para facilitar seus testes
    const DEFAULT_URL = 'https://sandbox.asaas.com/api/v3'
    const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || DEFAULT_URL
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`LOG: [${req.method}] Usando URL: ${ASAAS_API_URL}`)

    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const bodyText = await req.text()
        const parsedBody = bodyText ? JSON.parse(bodyText) : {}
        const action = parsedBody.action
        const payload = parsedBody.payload
        const headers = {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY || ''
        }

        if (action === 'ping') return new Response(JSON.stringify({ message: 'pong' }), { headers: corsHeaders })

        // 1. CRIAR COBRANÇA PIX
        if (action === 'createPayment') {
            const { name, email, cpf, plan, userId } = payload
            const cleanCpf = (cpf || '').replace(/\D/g, '')

            // Busca ou Cria Cliente no Asaas
            const searchRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpf}`, { headers })
            const searchData = await searchRes.json()
            let customerId = (searchData.data?.[0]?.id)

            if (!customerId) {
                const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ name, email, cpfCnpj: cleanCpf })
                })
                const customerData = await createRes.json()
                if (!createRes.ok) throw new Error(customerData.errors?.[0]?.description || 'Erro criar cliente')
                customerId = customerData.id
            }

            // Cria Cobrança
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 1)
            const payRes = await fetch(`${ASAAS_API_URL}/payments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'PIX',
                    value: plan.price,
                    dueDate: dueDate.toISOString().split('T')[0],
                    description: `Assinatura Plano ${plan.name} - Clube Privado`,
                    externalReference: `${userId}_${plan.id}`
                })
            })
            const paymentResult = await payRes.json()
            if (!payRes.ok) throw new Error(paymentResult.errors?.[0]?.description || 'Erro gerar cobrança')

            // Busca QR Code
            const pixRes = await fetch(`${ASAAS_API_URL}/payments/${paymentResult.id}/pixQrCode`, { headers })
            const pixData = await pixRes.json()

            return new Response(JSON.stringify({
                id: paymentResult.id,
                status: paymentResult.status,
                pixQrCodeBase64: pixData.encodedImage,
                pixCopyPaste: pixData.payload,
                value: paymentResult.value
            }), { headers: corsHeaders })
        }

        // 2. SOLICITAR SAQUE (AUTOMÁTICO E SEGURO)
        if (action === 'withdraw') {
            const { userId } = payload

            // BUSCA COMISSÕES PENDENTES NO BACKEND (Mandato de Segurança)
            const { data: pendingComms, error: commsErr } = await supabase
                .from('affiliate_commissions')
                .select('id, amount')
                .eq('referrer_id', userId)
                .eq('status', 'pending');

            if (commsErr) throw new Error('Erro ao buscar comissões pendentes');

            const totalToWithdraw = (pendingComms || []).reduce((acc: number, comm: any) => acc + parseFloat(comm.amount), 0);

            if (totalToWithdraw <= 0) throw new Error('Não há comissões pendentes para saque');
            if (totalToWithdraw < 50) throw new Error('Saldo insuficiente (mínimo R$ 50)');

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

            return new Response(JSON.stringify({ success: true, transferId: transData.id, amount: totalToWithdraw }), { headers: corsHeaders })
        }

        // 3. WEBHOOK / CHECK STATUS (GERAR COMISSÃO)
        if (action === 'checkStatus' || parsedBody.event) {
            const data = action === 'checkStatus'
                ? await (await fetch(`${ASAAS_API_URL}/payments/${payload.paymentId}`, { headers })).json()
                : (parsedBody.event === 'PAYMENT_RECEIVED' || parsedBody.event === 'PAYMENT_CONFIRMED') ? parsedBody.payment : null;

            if (!data) return new Response('Ignored', { headers: corsHeaders });

            const paymentId = data.id;
            console.log(`LOG: Processando pagamento ${paymentId}. Status: ${data.status}`);

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
                        console.log(`LOG: Comissão gerada: R$ ${amount} para Referrer ${userProfile.referred_by}`);
                    }
                }
            }
            return new Response(JSON.stringify({ status: data.status }), { headers: corsHeaders })
        }

        return new Response(JSON.stringify({ error: 'Ação inválida' }), { headers: corsHeaders })

    } catch (e: any) {
        console.error(`LOG ERRO: ${e.message}`)
        return new Response(JSON.stringify({ error: e.message }), { headers: corsHeaders })
    }
})
