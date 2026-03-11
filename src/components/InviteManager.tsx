import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Copy, Users, CheckCircle, AlertCircle, Share2, Crown } from 'lucide-react';

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
    const [isLoadingData, setIsLoadingData] = useState(true);

    const fetchData = async () => {
        try {
            // Get profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('is_ambassador, invites_remaining_this_month')
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
        } catch (err: any) {
            console.error('Error fetching invite data:', err);
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

    const copyToClipboard = (token: string, guestEmail: string) => {
        // Generate a pre-filled link if needed, or just copy the token + email instructions
        const message = `Você foi convidado para o TheSecretclub!\n\nEmail autorizado: ${guestEmail}\nToken de Acesso: ${token}\n\nAcesse: https://thesecretclub.io/ e clique em "Tenho um convite".`;
        navigator.clipboard.writeText(message);
        alert('Instruções copiadas para a área de transferência!');
    };

    if (isLoadingData) {
        return <div className="text-gray-500 text-sm">Carregando dados de convites...</div>;
    }

    const isAmbassador = profile?.is_ambassador;
    const invitesLeft = profile?.invites_remaining_this_month || 0;

    return (
        <div className="space-y-6">
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
                            <p className="text-[10px] text-gray-500 mt-2">O convite só funcionará se o convidado utilizar exatamente este e-mail.</p>
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

            {/* Invite History */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-widest border-b border-white/10 pb-4">Histórico de Convites</h3>

                {generatedInvites.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">Nenhum convite gerado ainda.</p>
                ) : (
                    <div className="space-y-3">
                        {generatedInvites.map((invite) => (
                            <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-navy border border-white/5 rounded-xl gap-4">
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">{invite.invited_email}</span>
                                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded inline-block mt-1 w-fit border border-primary/20">
                                        {invite.final_token}
                                    </span>
                                    <span className="text-[10px] text-gray-500 mt-2">
                                        Gerado em: {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${invite.is_used ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                        {invite.is_used ? 'USADO' : 'PENDENTE'}
                                    </div>
                                    {!invite.is_used && (
                                        <button
                                            onClick={() => copyToClipboard(invite.final_token, invite.invited_email)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors border border-white/10"
                                            title="Copiar instruções"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
