import React from 'react';
import { MapPin, Search, Check, HelpCircle, TrendingUp, ShieldCheck, User, Plus, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfileCard } from './ProfileCard';
import { ProfileModal } from './ProfileModal';
import { AuthModal } from './AuthModal';
import { LegalModal } from './LegalModal';
import { Feed } from './Feed';

interface FeedPageProps {
    user: any;
    profiles: any[];
    featuredProfiles: any[];
    loading: boolean;
    searchCity: string;
    setSearchCity: (city: string) => void;
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    activeCategory: 'acompanhante' | 'massagista';
    setActiveCategory: (cat: 'acompanhante' | 'massagista') => void;
    activeGender: string;
    setActiveGender: (gender: string) => void;
    availableCities: string[];
    availableNeighborhoods: string[];
    fetchProfiles: (city?: string, filter?: string) => void;
    handleWhatsAppClick: (profileId: string) => void;
    openProfile: (profile: any) => void;
    isAdmin: boolean;
    // Profile Modal
    isProfileModalOpen: boolean;
    setIsProfileModalOpen: (open: boolean) => void;
    selectedProfile: any;
    selectedPhotos: string[];
    selectedVideos: string[];
    handleProfileUpdate: (profileId: string, updates: any) => void;
    // Auth
    isAuthOpen: boolean;
    setIsAuthOpen: (open: boolean) => void;
    // Legal
    isTermsOpen: boolean;
    setIsTermsOpen: (open: boolean) => void;
    isAgeVerified: boolean;
    setIsAgeVerified: (v: boolean) => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({
    user,
    profiles,
    featuredProfiles,
    loading,
    searchCity,
    setSearchCity,
    activeFilter,
    setActiveFilter,
    activeCategory,
    setActiveCategory,
    activeGender,
    setActiveGender,
    availableCities,
    availableNeighborhoods,
    fetchProfiles,
    handleWhatsAppClick,
    openProfile,
    isAdmin,
    isProfileModalOpen,
    setIsProfileModalOpen,
    selectedProfile,
    selectedPhotos,
    selectedVideos,
    handleProfileUpdate,
    isAuthOpen,
    setIsAuthOpen,
    isTermsOpen,
    isAgeVerified,
    setIsAgeVerified,
}) => {
    const [viewMode, setViewMode] = React.useState<'grid' | 'feed'>('grid');

    return (
        <div className="min-h-screen bg-navy text-white font-sans selection:bg-primary selection:text-navy">
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                profile={selectedProfile}
                photos={selectedPhotos}
                videos={selectedVideos}
                user={user}
                onLoginClick={() => setIsAuthOpen(true)}
                onProfileUpdate={handleProfileUpdate}
                onWhatsAppClick={handleWhatsAppClick}
            />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            {/* Header */}
            <header className="fixed top-0 z-50 w-full bg-navy/70 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
                <div className="border-b border-white/5">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => {
                                setSearchCity('');
                                window.location.hash = '';
                            }}
                        >
                            <div className="w-8 h-8 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center rotate-3 border border-primary/30">
                                <Plus className="text-primary transform -rotate-3" size={20} />
                            </div>
                            <div className="text-xl font-bold tracking-tight text-white">
                                THE<span className="text-primary tracking-widest font-black uppercase ml-0.5 drop-shadow-sm">SECRET</span>CLUB
                            </div>
                        </div>

                        <div className="flex-1 flex justify-center hidden lg:flex overflow-hidden">
                            <h1 className="text-lg sm:text-xl font-serif font-light tracking-tight text-white/95 whitespace-nowrap">
                                A arte do <span className="text-primary italic">encontro</span> em sua <span className="text-primary italic"> melhor</span> forma
                            </h1>
                        </div>

                        <div className="flex-1" />

                        <div className="flex items-center gap-2 sm:gap-6">
                            <button
                                onClick={() => window.location.hash = '#dashboard'}
                                className="flex items-center gap-2 text-[11px] font-black text-white/80 hover:text-primary transition-colors tracking-tight uppercase"
                            >
                                <User size={16} />
                                <span>PAINEL</span>
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => window.location.hash = '#admin'}
                                    className="hidden sm:flex items-center gap-2 text-[11px] font-black text-primary border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/10 transition-all tracking-tight uppercase"
                                >
                                    <ShieldCheck size={14} />
                                    <span>ADMIN</span>
                                </button>
                            )}

                            <button
                                onClick={async () => {
                                    const { supabase } = await import('../lib/supabase');
                                    await supabase.auth.signOut();
                                    window.location.hash = '';
                                    window.location.reload();
                                }}
                                className="text-[10px] text-gray-500 hover:text-red-400 uppercase tracking-widest font-bold transition-colors"
                            >
                                Sair
                            </button>

                            <div className="flex lg:hidden items-center gap-3 ml-2 border-l pl-4 border-white/10">
                                <Menu className="text-gray-500 hover:text-primary transition-colors cursor-pointer" size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category & Gender Tabs */}
                <div className="bg-white/5 backdrop-blur-sm scrollbar-hide overflow-x-auto border-t border-white/5">
                    <div className="container mx-auto flex items-center justify-start lg:justify-center gap-0 h-12">
                        {(['acompanhante', 'massagista'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setActiveCategory(cat);
                                    setActiveGender('Mulheres');
                                }}
                                className={`relative px-4 sm:px-10 h-full flex items-center justify-center text-[11px] sm:text-sm font-bold transition-all duration-300 hover:text-white group shrink-0 ${activeCategory === cat ? 'text-white' : 'text-gray-500 hover:bg-white/5'
                                    }`}
                            >
                                {cat === 'acompanhante' ? 'ACOMPANHANTES' : 'MASSAGISTAS'}
                                {activeCategory === cat && (
                                    <motion.div
                                        layoutId="categoryTab"
                                        className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(226,176,162,0.8)]"
                                    />
                                )}
                            </button>
                        ))}

                        <div className="h-6 w-px bg-white/10 mx-2" />

                        {(activeCategory === 'acompanhante'
                            ? ['MULHERES', 'HOMENS', 'TRANS']
                            : ['MULHERES', 'HOMENS']
                        ).map((gender) => {
                            const genderMap: Record<string, string> = {
                                'MULHERES': 'Mulheres',
                                'HOMENS': 'Homens',
                                'TRANS': 'Trans',
                            };
                            const genderValue = genderMap[gender];
                            const isActive = activeGender === genderValue;

                            return (
                                <button
                                    key={gender}
                                    onClick={() => setActiveGender(genderValue)}
                                    className={`relative px-4 sm:px-8 h-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all duration-300 hover:text-white shrink-0 ${isActive ? 'text-primary' : 'text-gray-500 hover:bg-white/5'
                                        }`}
                                >
                                    {gender}
                                    {isActive && (
                                        <motion.div
                                            layoutId="genderTab"
                                            className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/60 rounded-t-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <main className="pt-[121px]">
                {/* Hero / Search */}
                <section className="relative min-h-[400px] md:min-h-[35vh] flex flex-col items-center justify-start md:justify-center pt-12 md:pt-12 pb-32 md:pb-12 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/60 to-navy z-10" />
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                            poster="https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=2560&auto=format&fit=crop"
                        >
                            <source src="https://cdn.pixabay.com/video/2020/05/18/39562-424177587_large.mp4" type="video/mp4" />
                        </video>
                    </div>

                    <div className="relative z-20 container mx-auto px-4 text-center">
                        <div className="flex justify-center gap-4 md:gap-8 mb-4 text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">
                            <span>Privacidade</span>
                            <span className="text-primary">•</span>
                            <span>Luxo</span>
                            <span className="text-primary">•</span>
                            <span>Exclusividade</span>
                        </div>

                        <h1 className="lg:hidden text-xl sm:text-3xl font-serif font-light mb-6 tracking-tight">
                            A arte do <span className="font-serif font-normal text-primary italic">encontro</span> em sua <span className="font-serif font-normal text-primary italic">melhor</span> forma
                        </h1>

                        <div className="max-w-3xl mx-auto mt-6 relative z-20">
                            <div className="bg-navy/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-2 shadow-2xl">
                                <div className="flex-1 relative flex items-center bg-white/5 rounded-xl px-4 py-1 border border-white/5 group hover:border-white/20 transition-all">
                                    <MapPin className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Qual cidade ou bairro?"
                                        className="w-full bg-transparent text-white pl-3 pr-4 py-3 outline-none placeholder:text-gray-500 font-light"
                                        value={searchCity}
                                        onChange={(e) => setSearchCity(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
                                    />
                                </div>
                                <div className="hidden md:flex flex-1 relative items-center bg-white/5 rounded-xl px-4 py-1 border border-white/5 group hover:border-white/20 transition-all">
                                    <Search className="text-gray-400 group-hover:text-primary transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Estilo (ex: Luxo, Massagem...)"
                                        className="w-full bg-transparent text-white pl-3 pr-4 py-3 outline-none placeholder:text-gray-500 font-light"
                                        disabled
                                    />
                                </div>
                                <button
                                    onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-primary text-navy px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(226,176,162,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                                >
                                    Buscar
                                </button>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3 mt-8 mb-6 md:mb-0">
                                {availableNeighborhoods.slice(0, 3).map(hood => (
                                    <button key={hood} onClick={() => { setSearchCity(hood); document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-full px-4 py-1.5 bg-white/5 hover:bg-white/10 outline-none transition-all">{hood}</button>
                                ))}
                                <button onClick={() => { setActiveFilter('Recém Chegadas'); document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-full px-4 py-1.5 bg-white/5 hover:bg-white/10 outline-none transition-all">Novidades</button>
                                <button onClick={() => { setActiveFilter('Elite'); document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[10px] uppercase font-bold tracking-widest text-primary border border-primary/20 rounded-full px-4 py-1.5 bg-primary/10 hover:bg-primary/20 outline-none transition-all shadow-[0_0_10px_rgba(226,176,162,0.1)]">Destaques da Semana</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Profiles (Stories) */}
                {featuredProfiles.length > 0 && (
                    <section className="relative z-30 mt-20 lg:-mt-12 pb-8 scrollbar-hide overflow-x-auto">
                        <div className="container mx-auto px-4 flex gap-4 min-w-max">
                            {featuredProfiles.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => openProfile(p)}
                                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                                >
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 border-2 border-primary ring-2 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:ring-primary/40 group-hover:shadow-lg group-hover:shadow-primary/20 active:scale-95">
                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-navy">
                                            <img
                                                src={p.imageUrl || "https://images.unsplash.com/photo-1524504388940-b1c116d197e9?auto=format&fit=crop&q=80&w=200"}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 tracking-tight uppercase truncate max-w-[64px] sm:max-w-[80px]">
                                        {p.name.split(' ')[0]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Affiliate Banner */}
                <section className="bg-navy pt-8 pb-4">
                    <div className="container mx-auto px-4">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-primary/40 transition-all duration-500">
                            <div className="relative z-10 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                                    <div className="bg-primary/20 p-1.5 rounded-lg">
                                        <TrendingUp size={18} className="text-primary" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Oportunidade</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">
                                    Quer ganhar <span className="text-primary not-italic underline underline-offset-4">Renda Extra?</span>
                                </h2>
                                <p className="text-gray-400 text-xs sm:text-sm font-medium max-w-xl">
                                    Ganhe <span className="text-white font-bold">15% de comissão vitalícia</span> indicando o TheSecretclub para suas amigas. Comece hoje!
                                </p>
                            </div>
                            <a
                                href="/programadeafiliadosadulto"
                                className="relative z-10 bg-primary text-navy px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(226,176,162,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] whitespace-nowrap"
                            >
                                Quero Participar
                            </a>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/20 transition-all duration-700" />
                        </div>
                    </div>
                </section>

                {/* Profile Grid */}
                <section id="showcase" className="bg-navy py-8">
                    <div className="container mx-auto px-4">
                        <div className="mb-8 border-l-4 border-primary pl-6">
                            <h2 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight tracking-tighter">
                                Encontre membros em <br className="sm:hidden" />
                                <span className="text-primary italic"> {searchCity || 'todo o Brasil'} </span>
                            </h2>
                            <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                                <MapPin size={12} className="text-primary" />
                                Deseja mudar a sua localização? <button className="text-white hover:text-primary underline" onClick={() => setSearchCity('')}>Clique aqui</button>
                            </div>
                        </div>

                        {/* Filter bar inline */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['Todos', 'Verificados', 'Luxo+', 'Com Vídeo'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => {
                                        setActiveFilter(f);
                                        fetchProfiles(searchCity, f);
                                    }}
                                    className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full border transition-all ${activeFilter === f
                                        ? 'bg-primary/10 text-primary border-primary/30'
                                        : 'text-gray-500 border-white/10 hover:border-white/20 hover:text-white'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex justify-center mb-8 border-b border-white/5 pb-4">
                            <div className="bg-white/5 p-1 rounded-full flex gap-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid'
                                        ? 'bg-primary text-navy shadow-[0_0_15px_rgba(226,176,162,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Vitrine
                                </button>
                                <button
                                    onClick={() => setViewMode('feed')}
                                    className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'feed'
                                        ? 'bg-primary text-navy shadow-[0_0_15px_rgba(226,176,162,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Feed Social
                                </button>
                            </div>
                        </div>

                        {viewMode === 'feed' ? (
                            <div className="py-8 animate-fade-in">
                                <Feed
                                    currentUserId={user?.id}
                                    profileType={user?.user_metadata?.profile_type}
                                />
                            </div>
                        ) : (
                            <div className="mt-8 animate-fade-in">
                                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                                    {loading ? (
                                        [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                            <div key={i} className="bg-navy border border-white/5 rounded-md overflow-hidden animate-pulse flex flex-col h-[350px]">
                                                <div className="w-full h-3/4 bg-white/5" />
                                                <div className="p-4 flex flex-col gap-3 flex-1">
                                                    <div className="h-4 bg-white/10 w-2/3 rounded" />
                                                    <div className="h-3 bg-white/5 w-1/2 rounded" />
                                                    <div className="h-2 bg-white/5 w-1/3 rounded mt-auto" />
                                                </div>
                                            </div>
                                        ))
                                    ) : profiles.length > 0 ? (
                                        profiles.map((p: any) => (
                                            <ProfileCard
                                                key={p.id}
                                                name={p.name || 'Membro'}
                                                age={p.age || 18}
                                                city={p.city || 'São Paulo'}
                                                neighborhood={p.neighborhood || 'Centro'}
                                                price={p.price_min || 0}
                                                rating={p.rating || 5.0}
                                                isVerified={p.verified}
                                                imageUrl={p.imageUrl}
                                                hasVideo={!!p.videoUrl}
                                                planTier={
                                                    p.plans?.tier_weight === 4 ? 'platinum' :
                                                        p.plans?.tier_weight === 3 ? 'gold' :
                                                            p.plans?.tier_weight === 2 ? 'silver' :
                                                                p.plans?.tier_weight === 1 ? 'bronze' : 'free'
                                                }
                                                whatsapp={p.whatsapp}
                                                onWhatsAppClick={() => handleWhatsAppClick(p.id)}
                                                onClick={() => openProfile(p)}
                                            />
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center border border-dashed border-white/10">
                                            <p className="text-gray-500 uppercase tracking-widest text-xs font-black">Nenhum membro encontrado nesta categoria</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Plans Section */}
                <section id="assinaturas" className="bg-navy-dark pt-32 pb-40 border-y border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Escolha seu <span className="text-primary not-italic underline underline-offset-8">Plano</span></h2>
                            <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em]">Anuncie seus serviços e receba mais contatos</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {([] as Array<{ name: string, price: string, tier: string, features: Array<{ text: string, hint?: string }>, popular?: boolean, platinum?: boolean }>).concat([
                                { name: 'Bronze', price: '37,90', tier: 'Básico', features: [{ text: 'Até 10 Fotos' }, { text: 'Destaque Padrão' }] },
                                { name: 'Prata', price: '87,00', tier: 'Intermediário', features: [{ text: 'Até 15 Fotos' }, { text: '1 Vídeo' }, { text: 'Destaque Médio' }] },
                                { name: 'Ouro', price: '174,00', tier: 'Recomendado', popular: true, features: [{ text: 'Fotos Ilimitadas' }, { text: '3 Vídeos' }, { text: 'Selo "Mais Popular"' }, { text: 'Destaque Alto', hint: 'Maior relevância nas buscas e vitrine' }] },
                                { name: 'Platina', price: '397,00', tier: 'Elite', platinum: true, features: [{ text: 'Fotos Ilimitadas' }, { text: 'Vídeos Ilimitados' }, { text: 'Selo "Elite"' }, { text: 'Topo Rotativo do Site', hint: 'O cupido fixará seu perfil nas 3 primeiras posições' }] },
                            ]).map((plan) => (
                                <div key={plan.name} className={`relative p-8 rounded-xl transition-all duration-300 group ${plan.platinum
                                    ? 'bg-white/5 backdrop-blur-md border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                                    : plan.popular
                                        ? 'bg-navy border border-primary/50 shadow-[0_0_20px_rgba(226,176,162,0.15)] scale-105 z-10 hover:shadow-[0_0_30px_rgba(226,176,162,0.3)]'
                                        : 'bg-navy border border-white/5 hover:border-white/10'
                                    }`}>

                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-navy text-[8px] font-black uppercase px-3 py-1 tracking-widest rounded-full shadow-[0_0_10px_rgba(226,176,162,0.8)]">
                                            Mais Popular
                                        </div>
                                    )}
                                    {plan.platinum && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-navy text-[8px] font-black uppercase px-3 py-1 tracking-widest rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                            Elite
                                        </div>
                                    )}

                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${plan.platinum ? 'text-white' : 'text-gray-400'}`}>{plan.name}</h3>

                                    <div className="flex items-start gap-1 mb-8">
                                        <span className="text-xs text-gray-400 font-sans mt-2">R$</span>
                                        <span className="text-5xl font-bold font-sans tracking-tighter text-white">{plan.price.split(',')[0]}</span>
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold font-sans text-white">,{plan.price.split(',')[1]}</span>
                                            <span className="text-[9px] text-gray-500 uppercase tracking-widest">/mês</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-10">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className={`text-[11px] font-bold flex items-center gap-3 relative group/tooltip ${plan.platinum ? 'text-gray-200' : 'text-gray-400'}`}>
                                                <Check size={14} className="text-primary flex-shrink-0" />
                                                <span>{f.text}</span>
                                                {f.hint && (
                                                    <div className="relative flex items-center">
                                                        <HelpCircle size={12} className="text-gray-500 hover:text-white cursor-help transition-colors" />
                                                        <div className="absolute left-1/2 -top-8 -translate-x-1/2 bg-gray-800 text-white text-[9px] py-1 px-2 rounded opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all whitespace-nowrap z-50 pointer-events-none border border-white/10 shadow-xl">
                                                            {f.hint}
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    <button onClick={() => setIsAuthOpen(true)} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${plan.platinum
                                        ? 'bg-white text-navy hover:bg-gray-200 shadow-xl'
                                        : plan.popular
                                            ? 'bg-primary text-navy hover:bg-primary-light shadow-xl'
                                            : 'bg-white/5 text-white hover:bg-white/10'
                                        }`}>
                                        Assinar Agora
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Cities */}
                <section id="cidades" className="container mx-auto px-6 py-32">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Cidades <span className="text-primary not-italic">Elite</span></h2>
                            <p className="text-gray-400 text-xs uppercase tracking-[0.4em] mt-4">Selecione seu próximo destino</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        {availableCities.length > 0 ? (
                            availableCities.map((cityName, index) => {
                                const bgImages = [
                                    'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=800&auto=format&fit=crop',
                                    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=800&auto=format&fit=crop',
                                    'https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&w=800&auto=format&fit=crop',
                                    'https://images.unsplash.com/photo-1610406856429-269e8b23ad7f?q=80&w=800&auto=format&fit=crop',
                                    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop',
                                ];
                                const bgImage = bgImages[index % bgImages.length];

                                return (
                                    <button
                                        key={cityName}
                                        onClick={() => {
                                            setSearchCity(cityName);
                                            fetchProfiles(cityName);
                                            document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="group relative overflow-hidden rounded-2xl aspect-[4/3] w-[160px] sm:w-[200px] flex items-end justify-start p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_-5px_rgba(226,176,162,0.3)] border border-white/5"
                                    >
                                        <img
                                            src={bgImage}
                                            alt={cityName}
                                            className="absolute inset-0 w-full h-full object-cover transition-all duration-700 opacity-40 group-hover:scale-110 group-hover:opacity-70"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                        <div className="relative z-10 text-left">
                                            <h3 className="font-black text-xl sm:text-2xl text-white uppercase leading-none tracking-tight">
                                                {cityName.split(' ')[0]}
                                            </h3>
                                            {cityName.split(' ').length > 1 && (
                                                <p className="text-[10px] sm:text-xs text-primary uppercase tracking-[0.2em] font-bold mt-1">
                                                    {cityName.substring(cityName.split(' ')[0].length).trim()}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="w-full text-center py-10 text-gray-600 uppercase text-[10px] font-black tracking-widest">Aguardando perfis...</div>
                        )}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-navy border-t border-white/10 py-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                        &copy; 2024 TheSecretclub. Todos os direitos reservados.
                    </p>
                    <div className="flex justify-center gap-8 text-[9px] uppercase tracking-widest text-gray-600">
                        <button
                            onClick={() => setIsTermsOpen(true)}
                            className="hover:text-primary transition-colors uppercase tracking-widest"
                        >
                            Termos de Uso
                        </button>
                        <a href="#" className="hover:text-primary transition-colors uppercase tracking-widest">Privacidade</a>
                        <a href="#" className="hover:text-primary transition-colors uppercase tracking-widest">Contato</a>
                    </div>
                </div>
            </footer>

            <LegalModal
                isOpen={!isAgeVerified}
                type="age_verification"
                onAccept={() => {
                    localStorage.setItem('age-verified', 'true');
                    setIsAgeVerified(true);
                }}
                onClose={() => { }}
            />

            <LegalModal
                isOpen={isTermsOpen}
                type="terms_of_use"
                onClose={() => setIsTermsOpen(false)}
            />
        </div>
    );
};
