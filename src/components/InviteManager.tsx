import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CheckCircle, AlertCircle, Share2, Crown } from 'lucide-react';

interface InviteManagerProps {
    userId: string;
}

export const InviteManager: React.FC<InviteManagerProps> = ({ userId }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [profile, setProfile] = useState<any>(null);
    const [generatedInvites, setGeneratedInvites] = useState<any[]>([]);
    const [affiliateStats, setAffiliateStats] = useState({ indications: 0, conversions: 0 });
    const [commissions, setCommissions] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSavingPix, setIsSavingPix] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const fetchData = async () => {
        try {
            // Get profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('is_ambassador, invites_remaining_this_month, pix_key, pix_key_type')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Get generated invites
            const { data: invitesData, error: invitesError } = await supabase
                .from('generated_invites')
                .select('*')
                .eq('inviter_id', userId)
                .order('created_at', { ascending: false });

            if (invitesError) throw invitesError;
            setGeneratedInvites(invitesData || []);

            if (profileData.is_ambassador) {
                // Indicações Totais
                const { count } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('referred_by', userId);

                // Comissões
                const { data: commData } = await supabase
                    .from('affiliate_commissions')
                    .select('*')
                    .eq('referrer_id', userId)
                    .order('created_at', { ascending: false });

                setAffiliateStats({
                    indications: count || 0,
                    conversions: commData?.length || 0
                });
                setCommissions(commData || []);
            }
        } catch (err: any) {
            console.error('Error fetching invite/affiliate data:', err);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleGenerateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { data, error } = await supabase.rpc('generate_secure_invite', {
                inviter_uuid: userId,
                guest_email: email.trim().toLowerCase()
            });

            if (error) {
                throw new Error(error.message || 'Erro ao gerar convite.');
            }

            setSuccess(`Convite gerado com sucesso! Token: ${data}`);
            setEmail('');
            fetchData(); // Refresh data
        } catch (err: any) {
            console.error('Generate invite error:', err);
            setError(err.message || 'Erro inesperado.');
        } finally {
            setLoading(false);
        }
    };


    const handleSavePix = async () => {
        setIsSavingPix(true);
        try {
            const { error } = await supabase.from('profiles').update({
                pix_key: profile.pix_key,
                pix_key_type: profile.pix_key_type
            }).eq('id', userId);

            if (error) throw error;
            alert('Dados de recebimento salvos com sucesso!');
        } catch (err) {
            console.error('Save PIX error:', err);
            alert('Erro ao salvar dados de recebimento.');
        } finally {
            setIsSavingPix(false);
        }
    };

    const handleWithdraw = async (amount: number) => {
        if (!profile.pix_key) {
            alert('Cadastre sua chave PIX primeiro.');
            return;
        }
        if (confirm(`Deseja solicitar o saque do seu saldo disponível de R$ ${amount.toFixed(2)}?`)) {
            setIsWithdrawing(true);
            try {
                const { data, error: invokeError } = await supabase.functions.invoke('asaas-proxy', {
                    body: { action: 'withdraw', payload: { userId } }
                });

                const serverError = data?.error;
                if (invokeError || serverError) {
                    alert('Erro no saque: ' + (serverError || invokeError?.message || 'Erro desconhecido'));
                } else {
                    alert('Saque solicitado com sucesso!');
                    fetchData();
                }
            } catch (err) {
                console.error('Withdraw error:', err);
                alert('Erro ao processar saque.');
            } finally {
                setIsWithdrawing(false);
            }
        }
    };

    if (isLoadingData) {
        return <div className="text-gray-500 text-sm">Carregando dados de convites...</div>;
    }

    const isAmbassador = profile?.is_ambassador;
    const invitesLeft = profile?.invites_remaining_this_month || 0;

    return (
        <div className="space-y-6">
            {/* Ambassador Section */}
            {isAmbassador && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                        <Crown className="text-primary" size={24} />
                        Painel de Embaixador
                    </h2>
                    <p className="text-gray-400 text-sm mb-8">
                        Divulgue o TheSecretclub e ganhe <span className="text-primary font-bold">20% de comissão</span> sobre cada indicação ativa feita como embaixador.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Link de Indicação */}
                        <div className="bg-navy border border-white/10 p-6 rounded-xl">
                            <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest block mb-2">Seu Link de Indicação Geral</label>
                            <div className="flex items-center gap-4">
                                <code className="flex-1 bg-black/20 p-4 rounded-sm text-xs font-mono text-primary truncate">
                                    {`${window.location.origin}/?ref=${userId}`}
                                </code>
                                <button
                                    onClick={() => {
                                        const inviteUrl = `${window.location.origin}/?ref=${userId}`;
                                        const message = `Olá! Estou te convidando para o TheSecretclub. Acesse pelo meu link: ${inviteUrl}\n\nApós acessar, use o código de convite que vou te enviar para completar seu cadastro. Te vejo lá!`;
                                        navigator.clipboard.writeText(message);
                                        alert('Mensagem de convite copiada!');
                                    }}
                                    className="p-3 bg-primary text-navy rounded-lg hover:bg-white transition-colors"
                                    title="Copiar mensagem de convite"
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">
                                Envie este link para a pessoa convidada. Ela deverá preencher o código de convite que você gerará abaixo.
                            </p>
                        </div>

                        {/* Configuração de PIX */}
                        <div className="bg-navy border border-white/10 p-6 rounded-xl">
                            <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest block mb-2">Sua Chave PIX para Recebimento</label>
                            <div className="flex gap-2">
                                <select
                                    value={profile?.pix_key_type || ''}
                                    onChange={(e) => setProfile({ ...profile, pix_key_type: e.target.value })}
                                    className="bg-black/20 border border-white/10 rounded-lg text-xs text-white p-2 focus:outline-none focus:border-primary/50"
                                >
                                    <option value="">Tipo</option>
                                    <option value="CPF">CPF</option>
                                    <option value="CNPJ">CNPJ</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="PHONE">Telefone</option>
                                    <option value="EVP">Chave Aleatória</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Sua chave PIX"
                                    value={profile?.pix_key || ''}
                                    onChange={(e) => setProfile({ ...profile, pix_key: e.target.value })}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg text-xs text-white px-4 py-2 focus:outline-none focus:border-primary/50"
                                />
                                <button
                                    onClick={handleSavePix}
                                    disabled={isSavingPix}
                                    className="bg-primary/20 hover:bg-primary/40 text-primary px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    {isSavingPix ? '...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        {isAmbassador ? <Crown className="text-primary" size={24} /> : <Users className="text-primary" size={24} />}
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">
                            {isAmbassador ? 'Embaixador Vip' : 'Seus Convites'}
                        </h3>
                    </div>
                    {isAmbassador ? (
                        <p className="text-gray-400 text-sm">
                            Você tem convites <strong className="text-primary">ilimitados</strong> e recebe 20% de comissão (Split) sobre as assinaturas de seus convidados.
                        </p>
                    ) : (
                        <div className="mt-2">
                            <span className="text-3xl font-black text-white">{invitesLeft}</span>
                            <span className="text-gray-500 text-sm ml-2 uppercase tracking-widest">Restantes este mês</span>
                        </div>
                    )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="text-green-400" size={24} />
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">Convites Usados</h3>
                    </div>
                    <div className="mt-2">
                        <span className="text-3xl font-black text-white">{generatedInvites.filter(i => i.is_used).length}</span>
                        <span className="text-gray-500 text-sm ml-2 uppercase tracking-widest">Ativos na plataforma</span>
                    </div>
                </div>
            </div>

            {/* Generate Invite Form */}
            {(!isAmbassador && invitesLeft <= 0) ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="text-red-400 mb-2" size={32} />
                    <h3 className="text-red-400 font-bold mb-1">Limite Atingido</h3>
                    <p className="text-gray-400 text-sm">Você atingiu o limite de convites deste mês. Novos convites serão liberados em breve.</p>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-widest border-b border-white/10 pb-4">Gerar Novo Convite</h3>

                    <form onSubmit={handleGenerateInvite} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">E-mail do Convidado</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemplo@email.com"
                                className="w-full bg-navy border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                disabled={loading}
                            />
                            <p className="text-[10px] text-gray-500 mt-2 italic font-medium">O convite só funcionará se o convidado utilizar exatamente este e-mail. Após gerar, você deve enviar o código para ele.</p>
                        </div>

                        {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
                        {success && <div className="text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20 font-mono break-all">{success}</div>}

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full btn-primary py-3 rounded-xl disabled:opacity-50"
                        >
                            {loading ? 'Gerando...' : 'Criar Convite Seguro'}
                        </button>
                    </form>
                </div>
            )}

            {/* Earnings Section for Ambassadors */}
            {isAmbassador && (
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Seu Saldo e Ganhos</h3>

                    {(() => {
                        const pendingComms = commissions.filter(c => c.status === 'pending' || c.status === 'processing');
                        const availableBal = pendingComms.filter(c => c.status === 'pending' && (!c.available_at || new Date(c.available_at) <= new Date())).reduce((acc, c) => acc + parseFloat(c.amount_net_commission || c.amount || 0), 0);
                        const lockedBal = pendingComms.filter(c => c.status === 'pending' && c.available_at && new Date(c.available_at) > new Date()).reduce((acc, c) => acc + parseFloat(c.amount_net_commission || c.amount || 0), 0);

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-navy border border-white/10 p-6 rounded-2xl relative overflow-hidden">
                                    <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Saldo Disponível</div>
                                    <div className="text-3xl font-black text-green-500">R$ {availableBal.toFixed(2)}</div>
                                    {lockedBal > 0 && (
                                        <div className="text-[9px] text-yellow-500 mt-1 uppercase font-bold tracking-widest">
                                            + R$ {lockedBal.toFixed(2)} em carência
                                        </div>
                                    )}
                                    {availableBal >= 100 && (
                                        <button
                                            onClick={() => handleWithdraw(availableBal)}
                                            disabled={isWithdrawing}
                                            className="mt-4 w-full bg-primary text-navy py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white"
                                        >
                                            {isWithdrawing ? '...' : 'Solicitar Saque (PIX)'}
                                        </button>
                                    )}
                                </div>
                                <div className="bg-navy border border-white/10 p-6 rounded-2xl">
                                    <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Indicações Totais</div>
                                    <div className="text-3xl font-black text-white">{affiliateStats.indications}</div>
                                </div>
                                <div className="bg-navy border border-white/10 p-6 rounded-2xl">
                                    <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Conversões</div>
                                    <div className="text-3xl font-black text-white">{affiliateStats.conversions}</div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="bg-navy border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[9px] uppercase font-black tracking-widest text-gray-500">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Descrição</th>
                                    <th className="p-4">Valor</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] text-gray-400">
                                {commissions.length > 0 ? (
                                    commissions.map((comm) => (
                                        <tr key={comm.id} className="border-t border-white/5">
                                            <td className="p-4">{new Date(comm.created_at).toLocaleDateString()}</td>
                                            <td className="p-4">Comissão - Indicação Ativa</td>
                                            <td className="p-4 text-green-500">R$ {parseFloat(comm.amount_net_commission || comm.amount || 0).toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${comm.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                                                    comm.status === 'suspicious' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-yellow-500/10 text-yellow-500'
                                                    }`}>
                                                    {comm.status === 'paid' ? 'Pago' : comm.status === 'suspicious' ? 'Suspeito' : 'Pendente'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-600">Nenhuma comissão registrada ainda.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
