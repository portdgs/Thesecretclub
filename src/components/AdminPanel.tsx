import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    ShieldCheck,
    XCircle,
    AlertCircle,
    Loader2,
    ChevronLeft,
    User,
    ExternalLink
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingProfiles();
    }, []);

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
                            Painel de <span className="text-primary not-italic">Verificação</span>
                        </h1>
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] mt-2">
                            Analise os vídeos dos perfis para conceder o selo real
                        </p>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 px-6 py-4 rounded-sm">
                        <div className="text-[10px] uppercase font-black text-primary tracking-widest mb-1">Aguardando Análise</div>
                        <div className="text-2xl font-black">{pendingProfiles.length}</div>
                    </div>
                </header>

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
            </div>
        </div>
    );
};
