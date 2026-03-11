import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    ShieldCheck,
    XCircle,
    AlertCircle,
    Loader2,
    ChevronLeft,
    User,
    ExternalLink,
    Crown,
    Search
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'verificacoes' | 'embaixadores'>('verificacoes');
    const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);

    // Embaixadores State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [ambassadors, setAmbassadors] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'verificacoes') fetchPendingProfiles();
        if (activeTab === 'embaixadores') fetchAmbassadors();
    }, [activeTab]);

    const fetchAmbassadors = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('is_ambassador', true)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setAmbassadors(data || []);
        } catch (error) {
            console.error('Error fetching ambassadors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('name', `%${searchTerm}%`)
                .neq('is_ambassador', true)
                .limit(10);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAmbassadorStatus = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Deseja ${currentStatus ? 'remover' : 'promover'} este usuário como Embaixador?`)) return;
        try {
            setProcessingId(userId);
            const { error } = await supabase
                .from('profiles')
                .update({ is_ambassador: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            alert(`Usuário ${currentStatus ? 'removido dos' : 'promovido a'} Embaixadores com sucesso!`);
            fetchAmbassadors();
            setSearchResults(prev => prev.filter(p => p.id !== userId));
        } catch (error: any) {
            alert('Erro: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const fetchPendingProfiles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .not('validation_video_url', 'is', null)
                .neq('validation_video_url', '')
                .eq('verified', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingProfiles(data || []);
        } catch (error) {
            console.error('Error fetching pending verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (profileId: string) => {
        if (!confirm('Deseja realmente aprovar este perfil? O selo será concedido imediatamente.')) return;

        try {
            setProcessingId(profileId);
            console.log('[Admin] Iniciando aprovação para:', profileId);

            const { data, count, error } = await supabase
                .from('profiles')
                .update({ verified: true })
                .eq('id', profileId)
                .select(); // Select to ensure we get data back and can check count

            if (error) throw error;

            console.log('[Admin] Resultado da aprovação:', { count, data });

            if (data && data.length > 0) {
                // Logically remove from list
                setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
                alert('Perfil aprovado com sucesso!');
            } else {
                console.warn('[Admin] Nenhuma linha foi afetada. Verifique as políticas de RLS.');
                alert('Aviso: O comando foi enviado, mas nenhuma alteração foi detectada. Verifique se você tem permissões de administrador.');
            }
        } catch (error: any) {
            console.error('[Admin] Erro na aprovação:', error);
            alert('Erro ao aprovar: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (profileId: string) => {
        const reason = prompt('Motivo da rejeição (será exibido para o perfil):');
        if (reason === null) return;

        try {
            setProcessingId(profileId);
            console.log('[Admin] Iniciando rejeição para:', profileId);

            const { data, error } = await supabase
                .from('profiles')
                .update({
                    validation_video_url: null,
                })
                .eq('id', profileId)
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                setPendingProfiles(prev => prev.filter(p => p.id !== profileId));
                alert('Vídeo rejeitado. O perfil precisará enviar um novo.');
            } else {
                console.warn('[Admin] Nenhuma linha foi afetada na rejeição.');
                alert('Aviso: O comando de rejeição foi enviado, mas nenhuma alteração foi detectada.');
            }
        } catch (error: any) {
            console.error('[Admin] Erro na rejeição:', error);
            alert('Erro ao rejeitar: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 uppercase tracking-widest text-[10px] font-black">Carregando solicitações...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy text-white pt-24 pb-20">
            <div className="container mx-auto px-4">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => window.location.hash = ''}
                            className="text-gray-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-4 transition-colors"
                        >
                            <ChevronLeft size={16} /> Voltar para o Site
                        </button>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                            Painel de <span className="text-primary not-italic">Administração</span>
                        </h1>
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] mt-2">
                            Gerenciamento de Verificações e Embaixadores
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('verificacoes')}
                            className={`px-6 py-4 rounded-sm transition-all border ${activeTab === 'verificacoes' ? 'bg-primary/10 border-primary/20 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={18} className={activeTab === 'verificacoes' ? 'text-primary' : ''} />
                                <div>
                                    <div className="text-[10px] uppercase font-black tracking-widest leading-tight">Verificações</div>
                                    <div className="text-sm font-black text-left">{pendingProfiles.length} Pendentes</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('embaixadores')}
                            className={`px-6 py-4 rounded-sm transition-all border ${activeTab === 'embaixadores' ? 'bg-primary/10 border-primary/20 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Crown size={18} className={activeTab === 'embaixadores' ? 'text-primary' : ''} />
                                <div>
                                    <div className="text-[10px] uppercase font-black tracking-widest leading-tight">Embaixadores</div>
                                    <div className="text-sm font-black text-left">Gerenciar VIPs</div>
                                </div>
                            </div>
                        </button>
                    </div>
                </header>

                {activeTab === 'verificacoes' && (
                    <>
                        {pendingProfiles.length === 0 ? (
                            <div className="bg-navy-light border border-dashed border-white/5 rounded-sm py-32 text-center">
                                <ShieldCheck size={48} className="mx-auto text-gray-700 mb-6" />
                                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Não há solicitações pendentes no momento</h3>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {pendingProfiles.map((p) => (
                                    <div key={p.id} className="bg-navy-light border border-white/5 rounded-sm overflow-hidden flex flex-col sm:flex-row shadow-2xl">
                                        {/* Video Preview */}
                                        <div className="w-full sm:w-1/2 aspect-video sm:aspect-auto bg-black relative group">
                                            <video
                                                src={p.validation_video_url}
                                                controls
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <div className="bg-primary text-navy px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm">VÍDEO REAL</div>
                                            </div>
                                        </div>

                                        {/* Info & Actions */}
                                        <div className="p-8 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h2 className="text-xl font-bold uppercase tracking-tight">{p.name}</h2>
                                                    <a
                                                        href={`#profile/${p.id}`}
                                                        onClick={() => {
                                                            // This is a bit tricky since we don't have deep links to profile modal easily
                                                            // but we can try to at least show the ID
                                                            alert('Em breve: Link direto para o perfil público.');
                                                        }}
                                                        className="text-gray-500 hover:text-primary transition-colors"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                </div>

                                                <div className="space-y-4 mb-8">
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        <User size={14} className="text-primary" />
                                                        <span>{p.city} - {p.neighborhood || 'Bairro ñ info'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        <AlertCircle size={14} className="text-primary" />
                                                        <span>Enviado em: {new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => handleApprove(p.id)}
                                                    disabled={!!processingId}
                                                    className="flex-1 bg-green-500 text-white font-black uppercase tracking-widest text-[9px] py-4 rounded-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {processingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                                    Aprovar
                                                </button>
                                                <button
                                                    onClick={() => handleReject(p.id)}
                                                    disabled={!!processingId}
                                                    className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase tracking-widest text-[9px] py-4 rounded-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <XCircle size={14} />
                                                    Rejeitar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'embaixadores' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Search & Promote */}
                        <div className="bg-navy-light border border-white/5 p-8 rounded-sm">
                            <h2 className="text-xl font-bold uppercase tracking-tight mb-4 flex items-center gap-3">
                                <Search className="text-primary" size={20} /> Promover a Embaixador
                            </h2>
                            <form onSubmit={handleSearchUser} className="flex gap-4">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar usuário por nome..."
                                    className="flex-1 bg-navy border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                                <button type="submit" disabled={loading} className="btn-primary px-8 rounded-xl font-black uppercase tracking-widest text-sm">
                                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Buscar'}
                                </button>
                            </form>

                            {searchResults.length > 0 && (
                                <div className="mt-6 border border-white/5 rounded-sm overflow-hidden">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="p-4 bg-navy flex items-center justify-between border-b border-white/5 last:border-b-0">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                                                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-500" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-white">{user.name}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">{user.profile_type}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleAmbassadorStatus(user.id, false)}
                                                disabled={!!processingId}
                                                className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors flex items-center gap-2"
                                            >
                                                {processingId === user.id ? <Loader2 size={12} className="animate-spin" /> : <Crown size={12} />}
                                                Tornar VIP
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Current Ambassadors List */}
                        <div className="bg-navy-light border border-white/5 p-8 rounded-sm">
                            <h2 className="text-xl font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                                <Crown className="text-primary" size={20} /> Embaixadores Atuais ({ambassadors.length})
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {ambassadors.map(amb => (
                                    <div key={amb.id} className="bg-navy border border-primary/20 p-6 rounded-sm shadow-2xl relative overflow-hidden group">
                                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                                        <div className="flex items-center gap-4 mb-4 relative z-10">
                                            <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden border-2 border-primary/30">
                                                {amb.avatar_url ? <img src={amb.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-primary" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-white">{amb.name}</div>
                                                <div className="text-[10px] text-primary uppercase font-black tracking-widest flex items-center gap-1 mt-1">
                                                    <Crown size={10} /> Embaixador VIP
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end relative z-10 mt-6 pt-4 border-t border-white/5">
                                            <div className="text-[9px] text-gray-500 uppercase tracking-widest">
                                                Desde {new Date(amb.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                            <button
                                                onClick={() => toggleAmbassadorStatus(amb.id, true)}
                                                disabled={!!processingId}
                                                className="text-red-400 hover:text-red-300 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                                            >
                                                {processingId === amb.id ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={10} />}
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {ambassadors.length === 0 && (
                                <div className="text-center py-12">
                                    <Crown size={32} className="mx-auto text-gray-700 mb-4" />
                                    <p className="text-gray-500 uppercase font-black text-xs tracking-widest">Nenhum embaixador ativo no momento</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
