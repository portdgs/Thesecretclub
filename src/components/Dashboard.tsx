import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import {
    LayoutDashboard, User, CreditCard, TrendingUp, LogOut, CheckCircle2,
    Clock, Plus, MessageCircle, Share2, Star, Loader2, Trash2,
    ShieldCheck, Image as ImageIcon, Camera, X
} from 'lucide-react';

interface DashboardProps {
    user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState('Resumo');
    const [uploading, setUploading] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [videos, setVideos] = useState<string[]>([]);
    const [profile, setProfile] = useState<any>({
        name: '',
        age: '',
        gender: '',
        specialty: '',
        height: '',
        sexual_role: '',
        city: '',
        neighborhood: '',
        whatsapp: '',
        cpf: '',
        price_min: '',
        price_15min: '',
        price_30min: '',
        price_1h: '',
        bio: '',
        avatar_url: '',
        cover_url: ''
    });
    const [activePlan, setActivePlan] = useState<any>(null);
    const [affiliateStats, setAffiliateStats] = useState({ indications: 0, conversions: 0 });
    const [commissions, setCommissions] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [paymentData, setPaymentData] = useState<any>(null);

    // Crop State
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleSelectPlan = async (plan: any) => {
        setSelectedPlan(plan);
        setPaymentData(null);
        setUploading(true);

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            // Busca dados do perfil (nome, cpf, afiliado)
            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            console.log('[Asaas] Perfil encontrado:', userProfile?.name, 'CPF:', userProfile?.cpf, 'Erro:', profileError?.message);

            if (!userProfile?.cpf) {
                alert('Preencha seu CPF na aba "Meu Perfil" antes de assinar um plano.');
                setUploading(false);
                return;
            }

            // CPF ok — agora sim abre o modal
            setShowPaymentModal(true);

            const splitWalletId = userProfile?.referred_by;

            const { createPayment } = await import('../services/asaas');
            const data = await createPayment(
                authUser.id,
                plan,
                authUser.email || '',
                userProfile?.name || 'Cliente',
                userProfile.cpf,
                splitWalletId
            );
            setPaymentData(data);
        } catch (error: any) {
            console.error('Erro ao gerar PIX:', error);
            alert(error.message || 'Erro ao gerar pagamento. Tente novamente.');
            setShowPaymentModal(false);
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentData || !selectedPlan) return;
        setUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Simula verificação
            const { checkPaymentStatus } = await import('../services/asaas');
            const status = await checkPaymentStatus(paymentData.id);

            if (status === 'CONFIRMED') {
                // Busca o ID do plano de forma insensível a maiúsculas/minúsculas
                // Usamos limit(1) para evitar erro caso existam nomes duplicados no banco
                const { data: planData, error: planError } = await supabase
                    .from('plans')
                    .select('id, name')
                    .ilike('name', selectedPlan.name)
                    .limit(1)
                    .maybeSingle();

                console.log('[Asaas] Verificação de plano:', { planName: selectedPlan.name, data: planData, error: planError });

                if (planData) {
                    const { error: updateError } = await supabase.from('profiles').update({
                        active_plan_id: planData.id
                    }).eq('id', user.id);

                    if (updateError) console.error('[Asaas] Erro ao atualizar plano no perfil:', updateError);
                } else {
                    console.error('[Asaas] Plano não encontrado no banco de dados com o nome:', selectedPlan.name);
                }

                alert(`Pagamento confirmado! Plano ${selectedPlan.name} ativado.`);
                setShowPaymentModal(false);
                fetchProfile(); // Atualiza dados na tela
            } else {
                alert('O pagamento ainda não foi detectado no Asaas. Simule a confirmação no painel Sandbox ou aguarde.');
            }
        } catch (error: any) {
            console.error('Erro ao confirmar:', error);
            alert('Erro ao confirmar pagamento: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Resumo' },
        { icon: User, label: 'Meu Perfil' },
        { icon: Camera, label: 'Mídia e Fotos' },
        { icon: ImageIcon, label: 'Aparência' },
        { icon: CreditCard, label: 'Assinatura' },
        { icon: Share2, label: 'Afiliados' },

        { icon: ShieldCheck, label: 'Verificação' },
        { icon: TrendingUp, label: 'Estatísticas' },
    ];

    useEffect(() => {
        // Dynamic SEO: Title based on tab
        const originalTitle = document.title;
        if (activeTab === 'Meu Perfil') document.title = 'Configurações de Perfil | Clube Privado';
        else if (activeTab === 'Mídia e Fotos') document.title = 'Meus Álbuns e Vídeos | Clube Privado';
        else if (activeTab === 'Assinatura') document.title = 'Gerenciar Plano | Clube Privado';
        else if (activeTab === 'Estatísticas') document.title = 'Minhas Estatísticas | Clube Privado';
        else document.title = 'Dashboard | Clube Privado';

        fetchProfile();
        if (activeTab === 'Mídia e Fotos') {
            fetchPhotos();
            fetchVideos();
        }
        if (activeTab === 'Afiliados') {
            fetchAffiliateData();
        }

        return () => { document.title = originalTitle; };
    }, [activeTab]);

    const fetchAffiliateData = async () => {
        try {
            if (!user) return;
            // Indicações Totais (quem usou o link)
            const { count, error: indErr } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('referred_by', user.id);

            // Comissões (Conversões reais)
            const { data: commData, error: commErr } = await supabase
                .from('affiliate_commissions')
                .select('*')
                .eq('referrer_id', user.id)
                .order('created_at', { ascending: false });

            if (indErr) console.error('Erro ao buscar indicações:', indErr);
            if (commErr) console.error('Erro ao buscar comissões:', commErr);

            setAffiliateStats({
                indications: count || 0,
                conversions: commData?.length || 0
            });
            setCommissions(commData || []);
        } catch (error) {
            console.error('Erro em fetchAffiliateData:', error);
        }
    };

    const fetchProfile = async () => {
        try {
            if (!user) return;

            // Busca os dados do perfil com o peso e limites do plano (JOIN)
            const { data, error } = await supabase
                .from('profiles')
                .select('*, plans:plans!profiles_active_plan_id_fkey(*)')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                console.error('[Dashboard] Erro ao buscar perfil:', error.message, error.code);
                return;
            }

            if (data) {
                // Remove o objeto do plano dos dados do perfil para evitar confusão no estado do formulário
                const { plans, ...profileData } = data;
                setProfile(profileData);
                setActivePlan(plans); // Guarda os limites e peso do plano atual

                console.log('[Dashboard] Perfil e Plano carregados:', {
                    planName: plans?.name || 'FREE',
                    photoLimit: plans?.photos_limit || 3,
                    videoLimit: plans?.videos_limit || 0
                });

                if (plans) {
                    setProfile((prev: any) => ({ ...prev, plan_name: plans.name }));
                } else {
                    setProfile((prev: any) => ({ ...prev, plan_name: 'FREE' }));
                }
            }
        } catch (error: any) {
            console.error('[Dashboard] Exceção em fetchProfile:', error);
        }
    };

    const saveProfile = async () => {
        try {
            if (!user) return;

            // Remove plan_name e outros campos de UI que não existem na tabela profiles
            const { plan_name, ...profileData } = profile;

            // Ensure numeric fields are correct
            const profileToSave = {
                ...profileData,
                id: user.id,
                age: profile.age ? parseInt(profile.age) : null,
                price_min: profile.price_min ? parseFloat(profile.price_min) : null,
                price_15min: profile.price_15min ? parseFloat(profile.price_15min) : null,
                price_30min: profile.price_30min ? parseFloat(profile.price_30min) : null,
                price_1h: profile.price_1h ? parseFloat(profile.price_1h) : null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(profileToSave);

            if (error) throw error;
            alert('Perfil atualizado com sucesso!');
        } catch (error: any) {
            console.error('Save error:', error);
            alert('Erro ao salvar: ' + error.message);
        }
    };

    const fetchPhotos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.storage
                .from('public-photos')
                .list(user.id);

            if (error) throw error;

            if (data) {
                const urls = data.map((file: any) =>
                    supabase.storage.from('public-photos').getPublicUrl(`${user.id}/${file.name}`).data.publicUrl
                );
                setPhotos(urls);
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    };

    const fetchVideos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.storage
                .from('public-videos')
                .list(user.id);

            if (error) throw error;

            if (data) {
                const urls = data.map((file: any) =>
                    supabase.storage.from('public-videos').getPublicUrl(`${user.id}/${file.name}`).data.publicUrl
                );
                setVideos(urls);
            }
        } catch (error) {
            console.error('Error fetching videos:', error);
        }
    };

    const handleLogout = async () => {
        // Clear immediately to prevent UI from thinking we are still logged in
        localStorage.clear();

        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Force reload to home
            window.location.replace('/');
            window.location.reload();
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleVideoUploadClick = () => {
        videoInputRef.current?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Você precisa estar logada para fazer upload.');
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            alert('Foto enviada com sucesso!');
            fetchPhotos();
        } catch (error: any) {
            alert('Erro no upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Você precisa estar logada para fazer upload.');
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-videos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            alert('Vídeo enviado com sucesso!');
            fetchVideos();
        } catch (error: any) {
            alert('Erro no upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `avatar_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public-photos')
                .getPublicUrl(filePath);

            setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            alert('Avatar atualizado!');
        } catch (error: any) {
            alert('Erro no upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0];
            if (!file) return;

            // Invés de fazer upload direto, abre o modal de corte
            const imageUrl = URL.createObjectURL(file);
            setImageToCrop(imageUrl);
            setShowCropModal(true);
            setZoom(1);
            setCrop({ x: 0, y: 0 });

            // Reseta o input file para permitir selecionar o mesmo logo depois
            if (coverInputRef.current) coverInputRef.current.value = '';
        } catch (error: any) {
            alert('Erro ao carregar a imagem: ' + error.message);
        }
    };

    const onCropCompleteEvent = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        try {
            if (!imageToCrop || !croppedAreaPixels) return;
            setIsCropping(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Gerar blob da imagem cortada
            const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
            if (!croppedImageBlob) throw new Error("Falha ao recortar imagem");

            const fileExt = 'jpeg';
            const fileName = `cover_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-photos')
                .upload(filePath, croppedImageBlob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public-photos')
                .getPublicUrl(filePath);

            setProfile((prev: any) => ({ ...prev, cover_url: publicUrl }));
            await supabase.from('profiles').update({ cover_url: publicUrl }).eq('id', user.id);
            alert('Capa recortada e atualizada!');

            setShowCropModal(false);
            setImageToCrop(null);
        } catch (error: any) {
            alert('Erro no upload da capa: ' + error.message);
        } finally {
            setIsCropping(false);
        }
    };

    const deletePhoto = async (photoUrl: string) => {
        try {
            const fileName = photoUrl.split('/').pop();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !fileName) return;

            const { error } = await supabase.storage
                .from('public-photos')
                .remove([`${user.id}/${fileName}`]);

            if (error) throw error;
            setPhotos(photos.filter((file: any) => file !== photoUrl));
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    const deleteVideo = async (videoUrl: string) => {
        try {
            const fileName = videoUrl.split('/').pop();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !fileName) return;

            const { error } = await supabase.storage
                .from('public-videos')
                .remove([`${user.id}/${fileName}`]);

            if (error) throw error;
            setVideos(videos.filter((file: any) => file !== videoUrl));
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    };

    return (
        <div className="min-h-screen bg-navy flex">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
            />
            <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoUpload}
                className="hidden"
                accept="video/*"
            />
            <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
                accept="image/*"
            />
            <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverUpload}
                className="hidden"
                accept="image/*"
            />

            {/* Sidebar */}
            <aside className="w-64 bg-navy-dark border-r border-white/5 p-6 flex flex-col fixed h-full z-20">
                <div className="text-xl font-light tracking-[0.4em] mb-12">
                    CLUBE<span className="font-black text-primary">PRIVADO</span>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setActiveTab(item.label)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.label ? 'bg-primary text-navy' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 rounded-sm transition-all mt-auto"
                >
                    <LogOut size={16} />
                    <span>Sair</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-12">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                            {activeTab} <span className="text-primary not-italic">{activeTab === 'Resumo' ? 'Painel' : ''}</span>
                        </h1>
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] mt-2">Sessão da Modelo</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-sm flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                                Plano {profile.plan_name || 'FREE'} Ativo
                            </span>
                        </div>
                    </div>
                </header>

                {activeTab === 'Resumo' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {[
                                { label: 'Visualizações', value: profile.views_count?.toString() || '0', change: 'Real', icon: TrendingUp },
                                { label: 'Cliques no WhatsApp', value: profile.clicks_count?.toString() || '0', change: 'Real', icon: MessageCircle },
                                { label: 'Avaliações', value: profile.rating?.toFixed(1) || '0.0', change: 'Média', icon: Star },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-navy-light border border-white/5 p-6 rounded-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <stat.icon size={20} className="text-primary opacity-50" />
                                        <span className="text-[10px] font-bold text-green-500">{stat.change}</span>
                                    </div>
                                    <div className="text-2xl font-black mb-1">{stat.value}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Profile Status */}
                        <div className="bg-navy-light border border-white/5 rounded-sm overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase tracking-widest">Status do Perfil</h3>
                                <span className="bg-green-500/20 text-green-500 text-[8px] font-black px-2 py-1 rounded-sm uppercase">Público</span>
                            </div>
                            <div className="p-8">
                                <div className="flex items-center gap-12">
                                    <div className="relative w-32 h-32">
                                        <img
                                            src={photos[0] || "https://images.unsplash.com/photo-1524504388940-b1c116d197e9?auto=format&fit=crop&q=80&w=300"}
                                            className="w-full h-full object-cover rounded-sm border border-white/10"
                                        />
                                        <button onClick={() => setActiveTab('Mídia e Fotos')} className="absolute -bottom-2 -right-2 bg-primary text-navy p-2 rounded-sm shadow-xl hover:scale-110 transition-transform">
                                            <Camera size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="bg-white/5 p-4 rounded-sm border border-white/5 flex items-center gap-3">
                                                <Clock size={16} className="text-primary opacity-50" />
                                                <div>
                                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Status do Plano</div>
                                                    <div className="text-[11px] font-bold">
                                                        {profile.active_plan_id ? 'Ativo' : 'Sem assinatura'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="btn-primary px-8 flex items-center justify-center font-black tracking-widest text-[10px]">Renovar Plano</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'Meu Perfil' && (
                    <div className="space-y-6">
                        <div className="bg-navy-light border border-white/5 p-8 rounded-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-8">Informações Básicas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Nome Artístico</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        value={profile.name || ''}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Idade</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        value={profile.age || ''}
                                        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                        type="number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Sexo</label>
                                    <select
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        value={profile.gender || ''}
                                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Mulher cis">Mulher cis</option>
                                        <option value="Mulher trans">Mulher trans</option>
                                        <option value="Homem cis">Homem cis</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Especialidade</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: Massagem, Jantar..."
                                        value={profile.specialty || ''}
                                        onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Altura (cm)</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: 170"
                                        value={profile.height || ''}
                                        onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Posição / Atuação</label>
                                    <select
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        value={profile.sexual_role || ''}
                                        onChange={(e) => setProfile({ ...profile, sexual_role: e.target.value })}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Ativa">Ativa</option>
                                        <option value="Passiva">Passiva</option>
                                        <option value="Versátil">Versátil</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Peso (kg)</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: 60"
                                        value={profile.weight || ''}
                                        onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Cor do Cabelo</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: Loiro"
                                        value={profile.hair_color || ''}
                                        onChange={(e) => setProfile({ ...profile, hair_color: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Cor dos Olhos</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: Castanhos"
                                        value={profile.eye_color || ''}
                                        onChange={(e) => setProfile({ ...profile, eye_color: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Etnia</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: Branca"
                                        value={profile.ethnicity || ''}
                                        onChange={(e) => setProfile({ ...profile, ethnicity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Cidade</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: Rio de Janeiro"
                                        value={profile.city || ''}
                                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Bairro</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: Copacabana"
                                        value={profile.neighborhood || ''}
                                        onChange={(e) => setProfile({ ...profile, neighborhood: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">WhatsApp</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: 11999999999"
                                        value={profile.whatsapp || ''}
                                        onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">CPF (obrigatório para pagamentos)</label>
                                    <input
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: 123.456.789-00"
                                        value={profile.cpf || ''}
                                        onChange={(e) => {
                                            // Formata CPF: 123.456.789-00
                                            let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                                            if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                                            else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                                            else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                                            setProfile({ ...profile, cpf: v });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Valor Mínimo (Referência)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: 200"
                                        value={profile.price_min || ''}
                                        onChange={(e) => setProfile({ ...profile, price_min: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Valor 15 Minutos (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: 150"
                                        value={profile.price_15min || ''}
                                        onChange={(e) => setProfile({ ...profile, price_15min: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Valor 30 Minutos (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: 250"
                                        value={profile.price_30min || ''}
                                        onChange={(e) => setProfile({ ...profile, price_30min: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Valor 1 Hora (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm"
                                        placeholder="Ex: 400"
                                        value={profile.price_1h || ''}
                                        onChange={(e) => setProfile({ ...profile, price_1h: e.target.value })}
                                    />
                                </div>


                                <div className="col-span-full space-y-2">
                                    <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Descrição / Bio</label>
                                    <textarea
                                        className="w-full bg-navy border border-white/5 p-4 outline-none focus:border-primary/50 text-sm min-h-[150px] resize-none"
                                        placeholder="Conte um pouco sobre você, seus serviços e diferenciais..."
                                        value={profile.bio || ''}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={saveProfile}
                                className="mt-12 btn-primary px-12 py-4 font-black uppercase tracking-widest text-[10px]"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'Aparência' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-navy-light border border-white/5 p-8 rounded-sm">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-8">Personalizar Aparência</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Avatar Section */}
                                <div className="space-y-4">
                                    <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Foto de Perfil (Avatar)</div>
                                    <div className="relative w-40 h-40 mx-auto md:mx-0">
                                        <img
                                            src={profile.avatar_url || "https://images.unsplash.com/photo-1524504388940-b1c116d197e9?auto=format&fit=crop&q=80&w=300"}
                                            className="w-full h-full rounded-full object-cover border-4 border-navy shadow-xl"
                                        />
                                        <button
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={uploading}
                                            className="absolute bottom-2 right-2 bg-primary text-navy p-3 rounded-full hover:scale-110 transition-transform shadow-lg"
                                        >
                                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 max-w-xs">
                                        Recomendado: Imagem quadrada (1:1), mínimo 500x500px.
                                    </p>
                                </div>

                                {/* Cover Section */}
                                <div className="space-y-4">
                                    <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest flex items-center justify-between">
                                        Foto de Capa (Banner)
                                        {activePlan?.tier_weight < 2 && (
                                            <span className="text-primary text-[8px] bg-primary/10 px-2 py-0.5 rounded-full">Exclusivo Prata+</span>
                                        )}
                                    </div>
                                    <div className={`relative w-full aspect-[3/1] rounded-sm overflow-hidden border border-white/10 ${activePlan?.tier_weight < 2 ? 'bg-navy opacity-50 grayscale pointer-events-none' : 'bg-black'}`}>
                                        <img
                                            src={profile.cover_url || "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=3000&auto=format&fit=crop"}
                                            className="w-full h-full object-cover opacity-80"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group hover:bg-black/40 transition-colors">
                                            <button
                                                onClick={() => {
                                                    if (activePlan?.tier_weight >= 2) coverInputRef.current?.click();
                                                }}
                                                disabled={uploading || activePlan?.tier_weight < 2}
                                                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-white/20 transition-all disabled:opacity-50"
                                            >
                                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                                Alterar Capa
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Recomendado: Imagem horizontal (16:9 ou mais larga).<br />
                                        <span className="text-primary/80 block mt-1">Dica: Para melhores resultados, use fotos de paisagem ou ambientes luxuosos.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Mídia e Fotos' && (
                    <div className="space-y-12">
                        {/* Photos Section */}
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <h2 className="text-xl font-black uppercase tracking-tight">Fotos</h2>
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest">{photos.length} de 15 fotos</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                <button
                                    onClick={() => {
                                        const limit = activePlan?.photos_limit || 3;
                                        if (photos.length >= limit) {
                                            alert(`Seu plano (${activePlan?.name || 'FREE'}) permite apenas ${limit} fotos. Faça um upgrade para postar mais!`);
                                            return;
                                        }
                                        handleUploadClick();
                                    }}
                                    disabled={uploading}
                                    className="aspect-[3/4] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-navy transition-all">
                                        {uploading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        {uploading ? 'Enviando...' : 'Adicionar Foto'}
                                    </span>
                                </button>

                                {photos.map((url, index) => (
                                    <div key={index} className="relative aspect-[3/4] group overflow-hidden rounded-sm border border-white/5">
                                        <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => deletePhoto(url)}
                                                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-xl"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Videos Section */}
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <h2 className="text-xl font-black uppercase tracking-tight">Vídeos</h2>
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest">{videos.length} de 5 vídeos</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <button
                                    onClick={() => {
                                        const limit = activePlan?.videos_limit || 0;
                                        if (videos.length >= limit) {
                                            alert(`Seu plano (${activePlan?.name || 'FREE'}) permite apenas ${limit} vídeos. Faça um upgrade para postar mais!`);
                                            return;
                                        }
                                        handleVideoUploadClick();
                                    }}
                                    disabled={uploading}
                                    className="aspect-video border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-navy transition-all">
                                        {uploading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        {uploading ? 'Enviando...' : 'Adicionar Vídeo'}
                                    </span>
                                </button>

                                {videos.map((url, index) => (
                                    <div key={index} className="relative aspect-video group overflow-hidden rounded-sm border border-white/5 bg-black">
                                        <video src={url} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => deleteVideo(url)}
                                                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-xl"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
                }
                {/* Image Cropper Modal */}
                {showCropModal && imageToCrop && (
                    <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-4 md:p-12">
                        <div className="bg-navy-dark w-full max-w-4xl h-[80vh] rounded-xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-navy">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm">Ajustar Capa (Proporção 16:9)</h3>
                                <button onClick={() => { setShowCropModal(false); setImageToCrop(null); }} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 relative bg-black/80">
                                <Cropper
                                    image={imageToCrop}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={16 / 9}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropCompleteEvent}
                                    onZoomChange={setZoom}
                                    objectFit="vertical-cover"
                                />
                            </div>
                            <div className="p-6 bg-navy flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="text-white/60 text-xs text-center md:text-left">
                                    <strong className="text-primary drop-shadow-sm">Dica de Design:</strong> Para os melhores resultados visuais na sua página, centralize seu rosto ou o foco da imagem nesta área clara.
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full md:w-32 accent-primary"
                                    />
                                    <button
                                        onClick={handleCropSave}
                                        disabled={isCropping}
                                        className="btn-primary px-8 py-3 rounded-md font-black uppercase tracking-widest text-xs flex items-center justify-center min-w-[150px] shadow-lg"
                                    >
                                        {isCropping ? <Loader2 className="animate-spin" size={16} /> : 'Salvar Recorte'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {
                    activeTab === 'Assinatura' && (
                        <div className="space-y-8">
                            {/* Current Plan Card */}
                            <div className="bg-navy-light border border-white/5 p-8 rounded-sm flex justify-between items-center">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Seu Plano Atual</h3>
                                    <div className="text-3xl font-black italic text-white flex items-center gap-3">
                                        {profile.plan_name || 'FREE'}
                                        {profile.active_plan_id && <span className="bg-primary text-navy text-[9px] px-2 py-1 rounded-sm not-italic">ELITE</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        {profile.active_plan_id ? 'Benefícios exclusivos ativos' : 'Faça upgrade para aumentar seus limites e destaque'}
                                    </p>
                                </div>
                                {!profile.active_plan_id && (
                                    <button onClick={() => document.getElementById('plans-grid')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary px-8 py-3 font-black text-[10px] tracking-widest uppercase">
                                        Fazer Upgrade
                                    </button>
                                )}
                            </div>

                            <h2 className="text-xl font-black uppercase tracking-tight mb-6">Planos Disponíveis</h2>

                            <div id="plans-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { id: 'bronze-plan', name: 'Bronze', price: 37.90, features: ['Até 10 Fotos', 'Destaque Padrão', 'Alerta de Visita'], recommended: false },
                                    { id: 'prata-plan', name: 'Prata', price: 87.00, features: ['Até 15 Fotos', 'Destaque Padrão', '1 Vídeo'], recommended: false },
                                    { id: 'ouro-plan', name: 'Ouro', price: 174.00, features: ['Fotos Ilimitadas', '3 Vídeos', 'Selo Popular', 'Mapa de Calor'], recommended: true },
                                    { id: 'platina-plan', name: 'Platina', price: 397.00, features: ['Tudo Ilimitado', 'Vídeo de Capa', 'Topo do Site (BI)'], recommended: false },
                                ].map((plan) => (
                                    <div key={plan.id} className={`relative bg-navy border ${plan.recommended ? 'border-primary shadow-lg shadow-primary/10 scale-105 z-10' : 'border-white/5'} p-8 flex flex-col`}>
                                        {plan.recommended && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-navy text-[9px] font-black uppercase px-3 py-1 tracking-widest rounded-sm">
                                                Recomendado
                                            </div>
                                        )}
                                        <h3 className="text-lg font-black italic uppercase mb-4">{plan.name}</h3>
                                        <div className="text-3xl font-bold mb-6">R$ {plan.price}<span className="text-sm text-gray-500 font-normal">/mês</span></div>

                                        <ul className="space-y-3 mb-8 flex-1">
                                            {plan.features.map(f => (
                                                <li key={f} className="flex items-center gap-2 text-[11px] text-gray-400">
                                                    <CheckCircle2 size={14} className="text-primary" /> {f}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`w-full py-4 text-[10px] font-black uppercase tracking-widest transition-all ${plan.recommended ? 'bg-primary text-navy hover:bg-primary-light' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                        >
                                            Escolher {plan.name}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Modal */}
                            {showPaymentModal && selectedPlan && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                    <div className="bg-navy-light border border-white/10 p-8 max-w-md w-full relative">
                                        <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                                            <LogOut size={20} />
                                        </button>

                                        <h3 className="text-xl font-black italic uppercase mb-2">Pagamento via PIX</h3>
                                        <p className="text-[11px] text-gray-400 mb-6">Plano {selectedPlan.name} - R$ {selectedPlan.price},00</p>

                                        {paymentData ? (
                                            <div className="space-y-6 text-center">
                                                <div className="bg-white p-4 inline-block rounded-sm">
                                                    {paymentData.pixQrCodeBase64 ? (
                                                        <img
                                                            src={`data:image/png;base64,${paymentData.pixQrCodeBase64}`}
                                                            alt="QR Code PIX"
                                                            className="w-48 h-48"
                                                        />
                                                    ) : (
                                                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-navy font-bold text-xs uppercase tracking-widest">
                                                            Carregando QR...
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-navy border border-white/10 p-3 rounded-sm flex items-center justify-between gap-2">
                                                    <span className="text-[9px] text-gray-500 truncate max-w-[200px] font-mono">{paymentData.pixCopyPaste}</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(paymentData.pixCopyPaste!)}
                                                        className="text-primary text-[9px] font-black uppercase hover:underline"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>

                                                <div className="text-[9px] text-gray-500 mt-2">
                                                    ID para simular no Asaas: <span className="text-white font-mono select-all">{paymentData.id}</span>
                                                </div>

                                                <button
                                                    onClick={handleConfirmPayment}
                                                    className="w-full bg-green-500 text-white py-4 font-black uppercase tracking-widest text-[10px] hover:bg-green-600 transition-colors"
                                                >
                                                    {uploading ? 'Confirmando...' : 'Já fiz o pagamento'}
                                                </button>
                                                <p className="text-[9px] text-gray-500">A liberação do plano é automática após o pagamento.</p>
                                            </div>
                                        ) : (
                                            <div className="py-12 flex justify-center">
                                                <Loader2 className="animate-spin text-primary" size={32} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
                {
                    activeTab === 'Afiliados' && (
                        <div className="space-y-8">
                            <div className="bg-navy-light border border-white/5 p-8 rounded-sm">
                                <h2 className="text-xl font-black uppercase tracking-tight mb-4">Programa de Afiliados</h2>
                                <p className="text-gray-400 text-sm mb-8">
                                    Divulgue o Clube Privado e ganhe <span className="text-primary font-bold">15% de comissão</span> sobre cada indicação ativa.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    {/* Link de Indicação */}
                                    <div className="bg-navy border border-white/10 p-6 rounded-sm">
                                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest block mb-2">Seu Link de Indicação</label>
                                        <div className="flex items-center gap-4">
                                            <code className="flex-1 bg-black/20 p-4 rounded-sm text-xs font-mono text-primary truncate">
                                                {`${window.location.origin}/?ref=${profile.id || '...'}`}
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/?ref=${profile.id}`);
                                                    alert('Link copiado!');
                                                }}
                                                className="btn-primary px-4 py-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shrink-0"
                                            >
                                                <Share2 size={16} /> Copiar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Configuração de PIX */}
                                    <div className="bg-navy border border-white/10 p-6 rounded-sm">
                                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest block mb-2">Sua Chave PIX para Recebimento</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={profile.pix_key_type || ''}
                                                onChange={(e) => setProfile({ ...profile, pix_key_type: e.target.value })}
                                                className="bg-black/20 border border-white/10 rounded-sm text-xs text-white p-2 focus:outline-none focus:border-primary/50"
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
                                                value={profile.pix_key || ''}
                                                onChange={(e) => setProfile({ ...profile, pix_key: e.target.value })}
                                                className="flex-1 bg-black/20 border border-white/10 rounded-sm text-xs text-white px-4 py-2 focus:outline-none focus:border-primary/50"
                                            />
                                            <button
                                                onClick={async () => {
                                                    setUploading(true);
                                                    const { error } = await supabase.from('profiles').update({
                                                        pix_key: profile.pix_key,
                                                        pix_key_type: profile.pix_key_type
                                                    }).eq('id', user.id);
                                                    setUploading(false);
                                                    if (error) alert('Erro ao salvar PIX');
                                                    else alert('Dados de PIX salvos com sucesso!');
                                                }}
                                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-sm text-[10px] font-black uppercase transition-colors"
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Seu Saldo e Ganhos</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-navy p-6 rounded-sm border border-white/5 relative overflow-hidden">
                                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Saldo Disponível</div>
                                        <div className="text-3xl font-black text-green-500">R$ {parseFloat(profile.balance || 0).toFixed(2)}</div>
                                        {parseFloat(profile.balance || 0) >= 50 ? (
                                            <button
                                                onClick={async () => {
                                                    if (!profile.pix_key) {
                                                        alert('Cadastre sua chave PIX primeiro.');
                                                        return;
                                                    }
                                                    if (confirm(`Deseja solicitar o saque do seu saldo disponível?`)) {
                                                        setUploading(true);
                                                        // Invocaremos a Edge Function para processar o saque automático (Backend calcula valor)
                                                        const { data, error } = await supabase.functions.invoke('asaas-proxy', {
                                                            body: { action: 'withdraw', payload: { userId: user.id } }
                                                        });
                                                        setUploading(false);
                                                        if (error || data?.error) alert('Erro no saque: ' + (error?.message || data?.error));
                                                        else {
                                                            alert('Saque solicitado com sucesso! O PIX cairá em breve.');
                                                            fetchProfile();
                                                        }
                                                    }
                                                }}
                                                className="mt-4 w-full btn-primary py-2 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {uploading ? 'Processando...' : 'Solicitar Saque (PIX)'}
                                            </button>
                                        ) : (
                                            <p className="text-[8px] text-gray-600 mt-4 uppercase font-bold tracking-widest">Mínimo para saque: R$ 50,00</p>
                                        )}
                                    </div>
                                    <div className="bg-navy p-6 rounded-sm border border-white/5">
                                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Indicações Totais</div>
                                        <div className="text-3xl font-black">{affiliateStats.indications}</div>
                                    </div>
                                    <div className="bg-navy p-6 rounded-sm border border-white/5">
                                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Conversões</div>
                                        <div className="text-3xl font-black">{affiliateStats.conversions}</div>
                                    </div>
                                </div>

                                <div className="bg-navy rounded-sm border border-white/5 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-black/20 text-[9px] uppercase font-black tracking-widest text-gray-500">
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
                                                        <td className="p-4 text-green-500">R$ {parseFloat(comm.amount).toFixed(2)}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${comm.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                                                }`}>
                                                                {comm.status === 'paid' ? 'Pago' : 'Pendente'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td className="p-4" colSpan={4}>
                                                        <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-2">
                                                            <Share2 size={24} className="opacity-20" />
                                                            <span>Compartilhe seu link para começar a ganhar!</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Hidden Inputs */}
                {
                    activeTab === 'Verificação' && (
                        <div className="space-y-8">
                            <div className="bg-navy-light border border-white/5 p-8 rounded-sm">
                                <h2 className="text-xl font-black uppercase tracking-tight mb-4">Selo de Verificação</h2>
                                <p className="text-gray-400 text-sm mb-8">
                                    Envie um vídeo curto confirmando sua identidade para receber o <span className="text-primary font-bold">Selo de Verificada</span>.
                                    Esse vídeo não ficará visível publicamente de imediato, servindo para comparação.
                                </p>

                                <div className="bg-navy border border-white/10 p-8 rounded-sm flex flex-col items-center justify-center gap-6">
                                    {profile.validation_video_url ? (
                                        <div className="w-full max-w-md">
                                            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-sm flex items-center gap-3 mb-6">
                                                <CheckCircle2 className="text-green-500" />
                                                <span className="text-green-500 font-bold text-xs uppercase tracking-widest">Vídeo Enviado com Sucesso</span>
                                            </div>
                                            <video
                                                src={profile.validation_video_url}
                                                controls
                                                className="w-full rounded-sm border border-white/10"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-4 text-center">
                                                Seu vídeo está sendo analisado ou já foi aprovado.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                                <ShieldCheck size={32} className="text-gray-500" />
                                            </div>

                                            <div className="text-center space-y-2">
                                                <h3 className="font-bold text-white uppercase tracking-widest text-xs">Instruções para o Vídeo</h3>
                                                <ul className="text-gray-500 text-[11px] space-y-1">
                                                    <li>• Segure um papel com seu nome artístico escrito</li>
                                                    <li>• Mostre o rosto claramente</li>
                                                    <li>• Diga "Eu sou real" e a data de hoje</li>
                                                </ul>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'video/*';
                                                    input.onchange = async (e: any) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file || !user) return;

                                                        setUploading(true);
                                                        try {
                                                            const fileExt = file.name.split('.').pop();
                                                            const fileName = `validation_${user.id}_${Date.now()}.${fileExt}`;
                                                            const { error: uploadError } = await supabase.storage
                                                                .from('public-videos')
                                                                .upload(`${user.id}/${fileName}`, file);

                                                            if (uploadError) throw uploadError;

                                                            const { data: { publicUrl } } = supabase.storage
                                                                .from('public-videos')
                                                                .getPublicUrl(`${user.id}/${fileName}`);

                                                            const { error: updateError } = await supabase
                                                                .from('profiles')
                                                                .update({ validation_video_url: publicUrl })
                                                                .eq('id', user.id);

                                                            if (updateError) throw updateError;

                                                            alert('Vídeo enviado com sucesso!');
                                                            fetchProfile();
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('Erro ao enviar vídeo.');
                                                        } finally {
                                                            setUploading(false);
                                                        }
                                                    };
                                                    input.click();
                                                }}
                                                disabled={uploading}
                                                className="btn-primary px-8 py-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                                            >
                                                {uploading ? (
                                                    <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                                                ) : (
                                                    <><Camera size={16} /> Enviar Vídeo de Verificação</>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
                {
                    activeTab === 'Estatísticas' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="bg-navy-light border border-white/5 p-8 rounded-sm">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tight mb-2">Estatísticas de Performance</h2>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">
                                            Seu Plano: <span className="text-primary">{activePlan?.name || 'FREE'}</span>
                                        </p>
                                    </div>
                                    <TrendingUp className="text-primary" size={32} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-navy p-6 rounded-sm border border-white/5">
                                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Visualizações Totais</div>
                                        <div className="text-3xl font-black">{profile.views_count || 0}</div>
                                        <p className="text-[8px] text-gray-600 mt-2 uppercase font-bold tracking-widest">Desde o início</p>
                                    </div>

                                    <div className="bg-navy p-6 rounded-sm border border-white/5">
                                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Cliques no WhatsApp</div>
                                        <div className="text-3xl font-black text-primary">{profile.clicks_count || 0}</div>
                                        <p className="text-[8px] text-gray-600 mt-2 uppercase font-bold tracking-widest">
                                            {activePlan?.tier_weight >= 2 ? 'Ativo (Plano Prata+)' : 'Requer Plano Prata+'}
                                        </p>
                                    </div>

                                    <div className="bg-navy p-6 rounded-sm border border-white/5">
                                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Taxa de Interesse</div>
                                        <div className="text-3xl font-black">
                                            {profile.views_count > 0 ? ((profile.clicks_count / profile.views_count) * 100).toFixed(1) : '0.0'}%
                                        </div>
                                        <p className="text-[8px] text-gray-600 mt-2 uppercase font-bold tracking-widest">Cliques/Views</p>
                                    </div>

                                    <div className="bg-navy p-6 rounded-sm border border-white/5">
                                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Destaque na Cidade</div>
                                        <div className="text-3xl font-black">{activePlan?.tier_weight === 4 ? 'TOP #1' : activePlan?.tier_weight >= 2 ? 'ALTO' : 'ORGÂNICO'}</div>
                                        <p className="text-[8px] text-gray-600 mt-2 uppercase font-bold tracking-widest">Ranking Estimado</p>
                                    </div>
                                </div>

                                {(!activePlan || activePlan.tier_weight < 3) && (
                                    <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-sm">
                                        <div className="flex items-center gap-4">
                                            <Star className="text-primary animate-pulse" />
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1">Desbloqueie o Mapa de Calor</h4>
                                                <p className="text-[10px] text-gray-400">Assine o plano <span className="text-primary font-bold">OURO</span> ou superior para ver os horários de maior pico do seu perfil!</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activePlan?.tier_weight >= 3 && (
                                    <div className="mt-8 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Mapa de Calor (Simulação)</h3>
                                        <div className="bg-navy border border-white/5 h-48 rounded-sm flex items-end justify-between p-4 gap-1">
                                            {[30, 45, 20, 60, 80, 100, 90, 70, 50, 40, 20, 10, 5, 10, 30, 50, 70, 95, 120, 110, 90, 80, 60, 40].map((v, i) => (
                                                <div key={i} className="flex-1 bg-primary/20 hover:bg-primary transition-colors cursor-help" style={{ height: `${v}%` }} title={`${i}h - ${v} visitas estimadas`} />
                                            ))}
                                        </div>
                                        <p className="text-[8px] text-gray-600 uppercase font-black text-center tracking-widest">Horário de Pico: 18:00 - 22:00</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
                {/* Hidden Inputs */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                />
                <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoUpload}
                    className="hidden"
                    accept="video/*"
                />
                <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    className="hidden"
                    accept="image/*"
                />
                <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverUpload}
                    className="hidden"
                    accept="image/*"
                />
            </main >
        </div >
    );
};
