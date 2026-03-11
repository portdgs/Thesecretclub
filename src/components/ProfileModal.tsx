import React, { useState, useEffect } from 'react';
import { X, MessageCircle, MapPin, Star, ShieldCheck, ChevronLeft, ChevronRight, Play, Camera, Info, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Feed } from './Feed';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: any;
    photos: string[];
    videos: string[];
    user?: any;
    onLoginClick?: () => void;
    onProfileUpdate?: (profileId: string, updates: { rating: number; review_count: number }) => void;
    onWhatsAppClick?: (profileId: string) => void;
    onMessageClick?: (profileId: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    profile,
    photos,
    videos,
    user,
    onLoginClick,
    onProfileUpdate,
    onWhatsAppClick,
    onMessageClick
}) => {
    const [activeTab, setActiveTab] = useState('Galeria');
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [endorsementsCount, setEndorsementsCount] = useState(0);
    const [hasEndorsed, setHasEndorsed] = useState(false);
    const [loadingEndorsement, setLoadingEndorsement] = useState(false);

    // Combine photos and videos with safety checks
    const mediaItems = [
        ...(photos || []).map(url => ({ type: 'image', url })),
        ...(videos || []).map(url => ({ type: 'video', url }))
    ];

    useEffect(() => {
        if (isOpen && profile) {
            console.log('Opening ProfileModal for:', profile.name);
            fetchEndorsements();
            if (user) fetchReviews();

            // Increment views via RPC (Background)
            supabase.rpc('increment_views', { profile_id: profile.id }).then(({ error }: { error: any }) => {
                if (error) console.error('Error incrementing views:', error);
            });

            const previousTitle = document.title;
            const newTitle = `${profile.name} - ${profile.city} | TheSecretclub`;
            document.title = newTitle;

            return () => {
                document.title = previousTitle;
            };
        }
    }, [isOpen, profile, user]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('profile_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
        }
    };

    const submitReview = async () => {
        if (!user) return;
        setSubmittingReview(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .upsert(
                    {
                        profile_id: profile.id,
                        user_id: user.id,
                        rating: newReview.rating,
                        comment: newReview.comment
                    },
                    { onConflict: 'profile_id,user_id' }
                );

            if (error) throw error;

            // Recalculate everything locally for immediate feedback
            const updatedReview = { ...newReview, id: 'temp-' + Date.now(), created_at: new Date().toISOString() };
            const updatedReviews = [updatedReview, ...reviews.filter(r => r.user_id !== user.id)];

            const totalRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
            const avgRating = totalRating / updatedReviews.length;

            if (onProfileUpdate) {
                onProfileUpdate(profile.id, {
                    rating: avgRating,
                    review_count: updatedReviews.length
                });
            }

            setNewReview({ rating: 5, comment: '' });
            fetchReviews();
        } catch (error: any) {
            alert(error.message || 'Erro ao enviar avaliação');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Calculate dynamic rating and count for the header
    const displayRating = reviews.length > 0
        ? (reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / reviews.length)
        : (profile?.rating || 0);

    const displayReviewCount = reviews.length > 0 ? reviews.length : (profile?.review_count || 0);

    const fetchEndorsements = async () => {
        try {
            // Get count
            const { count, error: countError } = await supabase
                .from('endorsements')
                .select('*', { count: 'exact', head: true })
                .eq('model_id', profile.id);

            if (countError) throw countError;
            setEndorsementsCount(count || 0);

            // Check if user has endorsed
            if (user) {
                const { data, error: checkError } = await supabase
                    .from('endorsements')
                    .select('*')
                    .eq('model_id', profile.id)
                    .eq('client_id', user.id)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') throw checkError;
                setHasEndorsed(!!data);
            }
        } catch (error) {
            console.error('Error fetching endorsements:', error);
        }
    };

    const handleEndorse = async () => {
        if (!user) {
            if (onLoginClick) onLoginClick();
            return;
        }
        if (hasEndorsed) return;

        setLoadingEndorsement(true);
        try {
            const { error } = await supabase
                .from('endorsements')
                .insert({
                    model_id: profile.id,
                    client_id: user.id
                });

            if (error) throw error;

            setHasEndorsed(true);
            setEndorsementsCount(prev => prev + 1);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Erro ao confirmar.');
        } finally {
            setLoadingEndorsement(false);
        }
    };

    const openMediaViewer = (index: number) => {
        setCurrentMediaIndex(index);
        setShowMediaViewer(true);
    };

    const nextMedia = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
    };

    const prevMedia = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    };

    // Full Screen Modal Implementation
    return (
        <AnimatePresence>
            {isOpen && profile && (
                <motion.div
                    key="modal-container"
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[9999] bg-gradient-to-br from-white via-slate-50 to-gray-200 flex flex-col overflow-hidden"
                >
                    {/* Fixed Close Button (Always visible on top right) */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-[9999] p-3 md:p-4 bg-black/10 hover:bg-black/20 text-navy-dark rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X size={28} />
                    </button>

                    {/* Floating WhatsApp Button */}
                    <button
                        onClick={() => {
                            if (onWhatsAppClick) onWhatsAppClick(profile.id);

                            // Sanitize phone number (remove everything except digits)
                            let cleanNumber = profile.whatsapp.replace(/\D/g, '');

                            // Try to fix country code if missing
                            if (cleanNumber && !cleanNumber.startsWith('55') && cleanNumber.length <= 11) {
                                cleanNumber = '55' + cleanNumber;
                            }

                            const text = `Olá ${profile.name}, vi seu perfil no TheSecretclub e gostaria de saber mais.`;
                            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="absolute bottom-6 right-6 z-[9999] bg-green-600 hover:bg-green-700 text-white px-6 py-4 font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-green-600/40 hover:scale-105 transition-transform rounded-full"
                    >
                        <MessageCircle size={24} />
                        <span className="hidden md:inline">WhatsApp</span>
                    </button>

                    {/* Private Message Button */}
                    <button
                        onClick={() => {
                            if (onMessageClick) onMessageClick(profile.id);
                        }}
                        className="absolute bottom-6 right-40 z-[9999] bg-navy-dark hover:bg-navy-light text-white px-6 py-4 font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl border border-white/10 hover:scale-105 transition-transform rounded-full"
                    >
                        <MessageSquare size={24} className="text-primary" />
                        <span className="hidden md:inline">Mensagem</span>
                    </button>

                    {/* Main Scrollable Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">

                        {/* 1. Header Section (Scrolls away) */}
                        <div className="relative">
                            {/* Cover Image - Taller on Desktop */}
                            <div className="h-64 md:h-96 w-full relative group overflow-hidden bg-navy">
                                <img
                                    src={profile.cover_url || "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=3000&auto=format&fit=crop"}
                                    className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-110 group-hover:brightness-110"
                                    alt="Capa"
                                />
                                {/* Overlay Escuro no Rodapé do Banner para leitura perfeita */}
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/40 to-transparent z-10" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 transition-colors duration-500 pointer-events-none z-0" />
                            </div>

                            {/* Profile Info - Overlapping Cover */}
                            <div className="container mx-auto px-4 md:px-0 max-w-4xl">
                                <div className="px-4 pb-6 -mt-32 md:-mt-40 flex flex-col relative z-20">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="relative">
                                            {/* Efeito de Elevação na Foto de Perfil com borda da cor do fundo */}
                                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-navy-dark shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                                <img
                                                    src={profile.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c116d197e9?auto=format&fit=crop&q=80&w=300"}
                                                    className="w-full h-full rounded-full object-cover border-[6px] border-navy-dark"
                                                    alt={profile.name}
                                                />
                                            </div>
                                            {profile.verified && (
                                                <div className="absolute bottom-2 right-2 bg-gradient-to-r from-primary to-orange-300 text-white p-2 md:p-2.5 rounded-full shadow-[0_0_15px_rgba(226,176,162,0.6)] flex items-center justify-center border-2 border-navy-dark z-20">
                                                    <ShieldCheck size={18} fill="currentColor" className="text-navy-dark" />
                                                </div>
                                            )}
                                            {profile.plans?.tier_weight === 4 && (
                                                <div className="absolute top-0 left-0 bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-[0.2em] border border-white/30 shadow-lg">
                                                    Elite
                                                </div>
                                            )}
                                            {profile.plans?.tier_weight === 3 && (
                                                <div className="absolute top-0 left-0 bg-primary/90 backdrop-blur-sm text-navy-dark px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(226,176,162,0.4)]">
                                                    TOP TRENDING
                                                </div>
                                            )}
                                            {profile.plans?.tier_weight === 2 && (
                                                <div className="absolute top-0 left-0 bg-navy-light/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-lg">
                                                    Destaque
                                                </div>
                                            )}
                                        </div>

                                        {videos?.length > 0 && (
                                            <div className="relative z-20 flex items-center justify-center">
                                                <div className={`bg-white/10 backdrop-blur-md border border-white/30 p-3 md:p-4 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 cursor-pointer ${profile.plans?.tier_weight === 4 ? 'animate-pulse shadow-[0_0_30px_rgba(255,255,255,0.3)]' : ''}`}
                                                    onClick={() => {
                                                        const firstVideoIndex = photos?.length || 0;
                                                        if (firstVideoIndex < mediaItems.length) {
                                                            openMediaViewer(firstVideoIndex);
                                                        }
                                                    }}
                                                >
                                                    <Play size={24} className="text-white fill-white ml-1" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white leading-none mb-2 drop-shadow-md">
                                            {profile.name} <span className="text-primary text-3xl md:text-4xl not-italic ml-2">{profile.age}</span>
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm font-bold uppercase tracking-widest text-gray-500">
                                            <span className="flex items-center gap-1 text-navy-dark">
                                                <MapPin size={14} className="text-primary" />
                                                {profile.city} {profile.neighborhood ? `• ${profile.neighborhood}` : ''}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star size={14} className="text-yellow-500" fill="currentColor" />
                                                {displayRating.toFixed(1)} ({displayReviewCount})
                                            </span>
                                        </div>
                                        {profile.bio && (
                                            <p className="mt-4 text-base text-gray-600 leading-relaxed font-medium max-w-2xl">
                                                {profile.bio}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Sticky Navbar Container */}
                        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                            <div className="container mx-auto px-4 md:px-0 max-w-4xl">
                                <div className="flex items-center justify-start gap-8 md:gap-12 w-full overflow-x-auto no-scrollbar">
                                    {['Linha do Tempo', 'Galeria', 'Sobre', 'Validação do Selo Verificada', 'Avaliações'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`py-5 text-xs md:text-sm font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab
                                                ? 'text-navy-dark'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {tab}
                                            {activeTab === tab && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Content Sections */}
                        <div className="bg-transparent min-h-screen pb-32">
                            <div className="container mx-auto px-0 md:px-0 max-w-4xl pt-1">

                                {/* LINHA DO TEMPO TAB */}
                                {activeTab === 'Linha do Tempo' && (
                                    <div className="p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                                        <Feed
                                            currentUserId={user?.id || profile.id}
                                            profileType={user?.id === profile.id ? user.user_metadata?.profile_type : profile.profile_type}
                                        />
                                    </div>
                                )}

                                {/* GALERIA TAB */}
                                {activeTab === 'Galeria' && (
                                    <div className="grid grid-cols-3 gap-1 md:gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {mediaItems.map((item, index) => (
                                            <div
                                                key={index}
                                                onClick={() => openMediaViewer(index)}
                                                className="aspect-[4/5] overflow-hidden cursor-pointer group relative bg-gray-100"
                                            >
                                                {item.type === 'video' ? (
                                                    <>
                                                        <video src={item.url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                                        <div className="absolute top-2 right-2">
                                                            <Play size={20} fill="white" className="text-white drop-shadow-xl" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <img src={item.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                                                )}
                                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
                                            </div>
                                        ))}
                                        {mediaItems.length === 0 && (
                                            <div className="col-span-full py-40 text-center flex flex-col items-center gap-6 text-gray-400">
                                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <Camera size={32} className="opacity-50 text-gray-400" />
                                                </div>
                                                <span className="text-xs uppercase font-black tracking-widest">Galeria Vazia</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* SOBRE TAB */}
                                {activeTab === 'Sobre' && (
                                    <div className="p-6 md:p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                            {[
                                                { label: 'Interesses', value: profile.specialty },
                                                { label: 'Papel', value: profile.sexual_role },
                                                { label: 'Altura', value: profile.height ? `${profile.height} cm` : null },
                                                { label: 'Peso', value: profile.weight ? `${profile.weight} kg` : null },
                                                { label: 'Cor do Cabelo', value: profile.hair_color },
                                                { label: 'Olhos', value: profile.eye_color },
                                                { label: 'Etnia', value: profile.ethnicity },
                                            ].map((item, i) => (
                                                item.value && (
                                                    <div key={i} className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                                                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-2">{item.label}</div>
                                                        <div className="text-sm font-bold text-navy-dark capitalize">{item.value}</div>
                                                    </div>
                                                )
                                            ))}
                                        </div>

                                        {/* Pricing section removed for rebranding */}
                                    </div>
                                )}


                                {/* CONFERÊNCIA TAB */}
                                {/* VALIDAÇÃO DO SELO VERIFICADA TAB */}
                                {activeTab === 'Validação do Selo Verificada' && (
                                    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-lg font-black uppercase tracking-widest text-navy-dark flex items-center gap-3">
                                                <Camera size={24} className="text-primary" />
                                                Validação do Selo
                                            </h3>
                                            <div className="group relative">
                                                <Info size={24} className="text-gray-400 hover:text-primary cursor-help transition-colors" />
                                                <div className="absolute right-0 top-full mt-2 w-72 bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                    <p className="text-xs font-bold text-navy-dark mb-2">
                                                        Mídias de comparação é o sistema que o TheSecretclub usa visando gerar mais credibilidade aos perfis.
                                                    </p>
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        Todas as mídias de comparação são analisadas por nossa equipe.
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        <span className="font-bold text-primary">Lembre-se:</span> sempre que ficar com dúvida se as mídias de algum perfil são verdadeiras, venha aqui e de uma espiada para comparar.
                                                    </p>
                                                    <div className="absolute -top-2 right-1 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-100"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Endorsement Section - TOP */}
                                        {profile.verified ? (
                                            <div className="mb-8 text-center bg-green-50/50 rounded-xl p-8 border border-green-100/50 shadow-sm relative overflow-hidden">
                                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-400/10 rounded-full blur-2xl"></div>
                                                <ShieldCheck size={48} className="text-green-500 mx-auto mb-4 drop-shadow-sm" />
                                                <h4 className="font-black text-lg text-green-800 tracking-tight mb-2">Selo Oficial Concedido</h4>
                                                <p className="text-sm text-green-700/80 max-w-sm mx-auto">
                                                    Este perfil possui autenticidade garantida pelo TheSecretclub.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="mb-8 text-center">
                                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                                    <h4 className="font-bold text-navy-dark mb-2">Confirmação de Realidade</h4>
                                                    <p className="text-sm text-gray-500 mb-4">
                                                        Para ganhar o <span className="font-bold text-green-600">Selo de Verificada</span>, o perfil precisa de:
                                                    </p>
                                                    <ul className="text-xs text-left inline-block mb-6 space-y-2 text-gray-600 bg-white p-4 rounded-lg border border-gray-100">
                                                        <li className="flex items-center gap-2">
                                                            {profile.validation_video_url ? <ShieldCheck size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                                                            <span>1 Vídeo de Verificação (Comparação)</span>
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            {endorsementsCount >= 4 ? <ShieldCheck size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                                                            <span>4 Indicações de Clientes Reais ({endorsementsCount}/4)</span>
                                                        </li>
                                                    </ul>

                                                    <div className="flex flex-col items-center gap-3">
                                                        <button
                                                            onClick={handleEndorse}
                                                            disabled={loadingEndorsement || hasEndorsed || (user && user.id === profile.id)}
                                                            className={`
                                                                px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-all
                                                                ${hasEndorsed
                                                                    ? 'bg-green-100 text-green-700 cursor-default border border-green-200'
                                                                    : 'bg-navy-dark text-white hover:bg-primary hover:text-navy-dark shadow-lg hover:shadow-xl'
                                                                }
                                                                ${(loadingEndorsement || (user && user.id === profile.id)) ? 'opacity-50 cursor-not-allowed' : ''}
                                                            `}
                                                        >
                                                            {loadingEndorsement ? 'Enviando...' : hasEndorsed ? 'Confirmado por você' : 'Confirmar que é Real'}
                                                        </button>
                                                        <p className="text-xs font-bold text-gray-400">
                                                            {endorsementsCount} pessoas confirmaram este perfil
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="aspect-[9/16] max-w-sm mx-auto bg-gray-100 rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative group">
                                            {profile.validation_video_url ? (
                                                <video
                                                    src={profile.validation_video_url}
                                                    controls
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-gray-50">
                                                    {profile.verified ? (
                                                        <>
                                                            <ShieldCheck size={48} className="mb-4 text-green-500/50" />
                                                            <p className="text-xs px-4">A certificação deste perfil foi concedida pelo TheSecretclub de forma acelerada no plano Elite.</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck size={48} className="mb-4 opacity-50" />
                                                            <p className="text-sm font-bold uppercase tracking-widest">Nenhum vídeo de validação disponível</p>
                                                            <p className="text-xs mt-2">Este perfil ainda não enviou um vídeo para comparação.</p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* AVALIAÇÕES TAB */}
                                {activeTab === 'Avaliações' && (
                                    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                                        {!user ? (
                                            <div
                                                onClick={onLoginClick}
                                                className="bg-white/60 backdrop-blur-sm border-2 border-dashed border-gray-300 p-8 text-center rounded-xl mb-10 cursor-pointer hover:bg-white/80 transition-colors"
                                            >
                                                <p className="text-gray-500 text-xs mb-3">Faça login para avaliar</p>
                                                <span className="btn-primary px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-full">Entrar Agora</span>
                                            </div>
                                        ) : (
                                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg mb-10">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-navy-dark mb-4">Sua Avaliação</h4>
                                                <div className="flex gap-2 mb-4">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                                            className={`transition-colors p-1 ${star <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                        >
                                                            <Star size={24} fill={star <= newReview.rating ? "currentColor" : "none"} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={newReview.comment}
                                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                    placeholder="Escreva seu comentário..."
                                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-md text-sm text-navy-dark mb-4 min-h-[100px] focus:outline-none focus:border-primary/50 placeholder-gray-400"
                                                />
                                                <button
                                                    onClick={submitReview}
                                                    disabled={submittingReview}
                                                    className="w-full btn-primary py-3 font-black uppercase tracking-widest text-[11px] rounded-md shadow-lg shadow-primary/10"
                                                >
                                                    {submittingReview ? 'Enviando...' : 'Publicar Avaliação'}
                                                </button>
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            {reviews.map((review: any) => (
                                                <div key={review.id} className="bg-white/80 p-6 rounded-xl border border-white/50 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex gap-1 text-yellow-500">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm italic leading-relaxed">"{review.comment}"</p>
                                                </div>
                                            ))}
                                            {reviews.length === 0 && (
                                                <p className="text-center text-gray-400 text-sm py-12">Seja o primeiro a avaliar!</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Media Viewer Overlay */}
                    <AnimatePresence>
                        {showMediaViewer && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[10000] bg-white/90 backdrop-blur-xl flex items-center justify-center p-0"
                                onClick={() => setShowMediaViewer(false)}
                            >
                                <button className="absolute top-4 right-4 text-navy-dark hover:text-primary z-50 p-4 bg-white/50 rounded-full">
                                    <X size={28} />
                                </button>

                                <button onClick={prevMedia} className="absolute left-4 p-6 text-navy-dark hover:text-primary z-50 hidden md:block">
                                    <ChevronLeft size={48} />
                                </button>

                                <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                    {mediaItems[currentMediaIndex].type === 'video' ? (
                                        <video src={mediaItems[currentMediaIndex].url} controls autoPlay className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                                    ) : (
                                        <img src={mediaItems[currentMediaIndex].url} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                                    )}
                                </div>

                                <button onClick={nextMedia} className="absolute right-4 p-6 text-navy-dark hover:text-primary z-50 hidden md:block">
                                    <ChevronRight size={48} />
                                </button>

                                {/* Mobile Navigation Taps */}
                                <div className="absolute inset-x-0 bottom-0 h-20 md:hidden flex justify-between px-8 pb-8 z-50">
                                    <button onClick={prevMedia} className="p-4 text-navy-dark hover:text-primary"><ChevronLeft size={32} /></button>
                                    <button onClick={nextMedia} className="p-4 text-navy-dark hover:text-primary"><ChevronRight size={32} /></button>
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};
