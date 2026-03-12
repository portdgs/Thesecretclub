import React from 'react';
import { MapPin, Search, Check, HelpCircle, User, Plus, Menu, Navigation, MessageSquare, Bell } from 'lucide-react';
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
    activeCategory: 'singles' | 'casal';
    setActiveCategory: (cat: 'singles' | 'casal') => void;
    fetchNearbyProfiles: (lat: number, lng: number) => void;
    activeGender: string;
    setActiveGender: (gender: string) => void;
    availableCities: string[];
    availableNeighborhoods: string[];
    fetchProfiles: (city?: string, filter?: string) => void;
    handleWhatsAppClick: (profileId: string) => void;
    openProfile: (profile: any) => void;
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
    onMessageClick: (profileId: string) => void;
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
    fetchNearbyProfiles,
    handleWhatsAppClick,
    openProfile,
    isProfileModalOpen,
    setIsProfileModalOpen,
    selectedProfile,
    selectedPhotos,
    selectedVideos,
    handleProfileUpdate,
    isAuthOpen,
    setIsAuthOpen,
    isTermsOpen,
    setIsTermsOpen,
    isAgeVerified,
    setIsAgeVerified,
    onMessageClick,
}) => {
    const [viewMode, setViewMode] = React.useState<'grid' | 'feed' | 'radar'>('grid');
    const [isLocationSelectorOpen, setIsLocationSelectorOpen] = React.useState(false);
    const [localSearchCity, setLocalSearchCity] = React.useState(searchCity);

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
                onMessageClick={onMessageClick}
            />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 bg-navy/80 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <div
                        className="flex flex-col items-start cursor-pointer shrink-0"
                        onClick={() => {
                            setSearchCity('');
                            window.location.hash = '';
                        }}
                    >
                        <div className="text-xl font-black tracking-tighter text-white flex items-center">
                            <span>THE</span>
                            <span className="text-primary italic">SECRET</span>
                            <span>CLUB</span>
                        </div>
                        <span className="text-[8px] text-primary/60 font-medium tracking-[0.2em] uppercase -mt-1 ml-0.5">
                            A arte do encontro...
                        </span>
                    </div>

                    {/* Central Search Bar */}
                    <div className="flex-1 max-w-xl hidden md:flex relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Encontrar pessoas..."
                            className="w-full bg-white/10 border border-white/5 rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:bg-white/20 focus:border-white/20 transition-all placeholder:text-gray-400"
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                        />
                    </div>

                    {/* Header Icons & Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => window.location.hash = '#dashboard'}
                            className="p-2 text-gray-300 hover:text-white transition-colors relative"
                            title="Painel"
                        >
                            <User size={22} />
                        </button>

                        <button
                            onClick={() => onMessageClick('')}
                            className="p-2 text-gray-300 hover:text-white transition-colors relative"
                            title="Mensagens"
                        >
                            <MessageSquare size={22} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-pink rounded-full border border-navy"></span>
                        </button>

                        <button className="p-2 text-gray-300 hover:text-white transition-colors" title="Notificações">
                            <Bell size={22} />
                        </button>

                        <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block" />

                        <button
                            onClick={async () => {
                                const { supabase } = await import('../lib/supabase');
                                await supabase.auth.signOut();
                                window.location.hash = '';
                                window.location.reload();
                            }}
                            className="text-[10px] text-gray-400 hover:text-white uppercase tracking-widest font-bold transition-colors hidden sm:block"
                        >
                            Sair
                        </button>

                        <button className="lg:hidden p-2 text-gray-300">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>

                {/* Category & Gender Tabs */}
                <div className="bg-navy/50 backdrop-blur-sm scrollbar-hide overflow-x-auto border-t border-white/5">
                    <div className="container mx-auto flex items-center justify-start lg:justify-center gap-0 h-10">
                        {[
                            { label: 'Feed Social', action: () => setViewMode('feed') },
                            { label: 'Novidades', action: () => { setSearchCity(''); setViewMode('grid'); } },
                            { label: 'Vídeos', action: () => { setActiveFilter('Com Vídeo'); setViewMode('grid'); } },
                            { label: 'Livecam', action: () => { } },
                        ].map((link) => (
                            <button
                                key={link.label}
                                onClick={link.action}
                                className="px-6 h-full flex items-center text-[10px] font-bold text-white/70 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                {link.label}
                            </button>
                        ))}
                        <div className="h-4 w-[1px] bg-white/10 mx-4" />
                        {[
                            { label: 'MULHERES', cat: 'singles', gender: 'Mulheres' },
                            { label: 'HOMENS', cat: 'singles', gender: 'Homens' },
                            { label: 'CASAIS', cat: 'casal', gender: 'Todos' }
                        ].map((filter) => {
                            const isActive = (filter.cat === 'casal')
                                ? activeCategory === 'casal'
                                : (activeCategory === 'singles' && activeGender === filter.gender);

                            return (
                                <button
                                    key={filter.label}
                                    onClick={() => {
                                        setActiveCategory(filter.cat as any);
                                        setActiveGender(filter.gender);
                                    }}
                                    className={`relative px-6 sm:px-10 h-full flex items-center justify-center text-[10px] sm:text-xs font-black transition-all duration-300 hover:text-white group shrink-0 tracking-widest ${isActive ? 'text-white' : 'text-gray-500 hover:bg-white/5'
                                        }`}
                                >
                                    {filter.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeFilterTab"
                                            className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-t-full shadow-[0_0_10px_rgba(226,176,162,0.8)]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <main className="pt-0">
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

                {/* Featured Profiles (Stories - Sexlog Style) */}
                <section className="relative z-30 mt-8 pb-4 scrollbar-hide overflow-x-auto bg-navy/50 border-b border-white/5">
                    <div className="container mx-auto px-4 py-6 flex items-start gap-5 min-w-max">
                        {/* Boost your profile button (Sexlog style) */}
                        <div
                            onClick={() => window.location.hash = '#dashboard'}
                            className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-bordeaux flex items-center justify-center border-2 border-white/10 group-hover:border-pink transition-all">
                                <Plus className="text-white group-hover:scale-125 transition-transform" size={32} />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">Destaque</span>
                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">seu perfil</span>
                            </div>
                        </div>

                        {featuredProfiles.map((p) => {
                            const isBoosted = p.boost_until && new Date(p.boost_until) > new Date();
                            const isOnline = true; // Placeholder for online status
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => openProfile(p)}
                                    className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
                                >
                                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] ${isBoosted ? 'bg-gradient-to-tr from-pink via-purple-500 to-pink' : 'bg-gray-700'} group-hover:scale-105 transition-all duration-300 shadow-xl`}>
                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-navy">
                                            <img
                                                src={p.imageUrl || "https://images.unsplash.com/photo-1524504388940-b1c116d197e9?auto=format&fit=crop&q=80&w=200"}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Live/Online Indicator */}
                                        {isOnline && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full border-2 border-navy uppercase tracking-widest shadow-lg">
                                                LIVE
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center max-w-[80px]">
                                        <span className={`text-[10px] font-bold ${isBoosted ? 'text-pink' : 'text-gray-300'} tracking-tight truncate w-full text-center`}>
                                            {p.name.split(' ')[0]}
                                        </span>
                                        <span className="text-[8px] text-gray-500 font-medium uppercase tracking-tighter truncate w-full text-center leading-none mt-0.5">
                                            {p.profile_type === 'casal' ? 'Casal' : p.gender || 'Membro'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
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
                            <div className="mt-1">
                                {!isLocationSelectorOpen ? (
                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <MapPin size={12} className="text-primary" />
                                        Deseja mudar a sua localização? <button className="text-white hover:text-primary underline" onClick={() => setIsLocationSelectorOpen(true)}>Clique aqui</button>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Localizados em</p>
                                        <div className="flex items-center gap-2 max-w-md bg-white/5 border border-white/10 rounded-sm p-1">
                                            <div className="flex-1 flex items-center gap-3 px-3">
                                                <MapPin size={14} className="text-primary/50" />
                                                <input
                                                    type="text"
                                                    placeholder="Digite sua localização"
                                                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-white placeholder:text-gray-600 h-8"
                                                    value={localSearchCity}
                                                    onChange={(e) => setLocalSearchCity(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            setSearchCity(localSearchCity);
                                                            fetchProfiles(localSearchCity);
                                                            setIsLocationSelectorOpen(false);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (!navigator.geolocation) {
                                                        alert('Seu navegador não suporta geolocalização.');
                                                        return;
                                                    }
                                                    navigator.geolocation.getCurrentPosition(
                                                        (pos) => {
                                                            fetchNearbyProfiles(pos.coords.latitude, pos.coords.longitude);
                                                            setViewMode('radar');
                                                            setSearchCity('Perto de você');
                                                            setIsLocationSelectorOpen(false);
                                                        },
                                                        (err) => {
                                                            console.error('GPS Error:', err);
                                                            alert('Permita o acesso à sua localização para usar o Radar.');
                                                        }
                                                    );
                                                }}
                                                title="Usar minha localização (Radar)"
                                                className="p-2 aspect-square flex items-center justify-center bg-transparent text-pink hover:bg-pink/10 rounded-sm transition-all"
                                            >
                                                <Navigation size={18} />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex gap-4">
                                            <button
                                                onClick={() => {
                                                    setSearchCity(localSearchCity);
                                                    fetchProfiles(localSearchCity);
                                                    setIsLocationSelectorOpen(false);
                                                }}
                                                className="text-[9px] font-black uppercase text-primary hover:text-white transition-colors"
                                            >
                                                Aplicar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSearchCity('');
                                                    setLocalSearchCity('');
                                                    fetchProfiles('');
                                                    setIsLocationSelectorOpen(false);
                                                    setViewMode('grid');
                                                }}
                                                className="text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors"
                                            >
                                                Ver todo Brasil
                                            </button>
                                            <button
                                                onClick={() => setIsLocationSelectorOpen(false)}
                                                className="text-[9px] font-black uppercase text-gray-500 hover:text-white transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
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

                        <div className="flex justify-center mb-8 border-b border-white/5 pb-4">
                            <div className="bg-white/5 p-1 rounded-full flex gap-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid'
                                        ? 'bg-pink text-white shadow-[0_0_15px_rgba(255,0,102,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Vitrine
                                </button>
                                <button
                                    onClick={() => setViewMode('feed')}
                                    className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'feed'
                                        ? 'bg-pink text-white shadow-[0_0_15px_rgba(255,0,102,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Feed Social
                                </button>
                                <button
                                    onClick={() => {
                                        if (viewMode !== 'radar') {
                                            if (!navigator.geolocation) {
                                                alert('Seu navegador não suporta geolocalização.');
                                                return;
                                            }
                                            navigator.geolocation.getCurrentPosition(
                                                (pos) => {
                                                    fetchNearbyProfiles(pos.coords.latitude, pos.coords.longitude);
                                                    setViewMode('radar');
                                                },
                                                (err) => {
                                                    console.error('GPS Error:', err);
                                                    alert('Permita o acesso à sua localização para usar o Radar.');
                                                }
                                            );
                                        }
                                    }}
                                    className={`px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'radar'
                                        ? 'bg-pink text-white shadow-[0_0_15px_rgba(255,0,102,0.4)]'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <Navigation size={12} />
                                    Radar
                                </button>
                            </div>
                        </div>

                        {viewMode === 'radar' ? (
                            <div className="mt-8 animate-fade-in">
                                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                                    {profiles.length > 0 ? (
                                        profiles.map((p: any) => (
                                            <ProfileCard
                                                key={p.id}
                                                name={p.name || 'Membro'}
                                                age={p.age || 18}
                                                city={p.city || 'São Paulo'}
                                                neighborhood={p.neighborhood || 'Centro'}
                                                isVerified={p.verified}
                                                isBoosted={p.boost_until && new Date(p.boost_until) > new Date()}
                                                imageUrl={p.imageUrl}
                                                distance={p.distance_km}
                                                onClick={() => openProfile(p)}
                                            />
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center border border-dashed border-white/10">
                                            <Navigation size={40} className="text-gray-600 mx-auto mb-4 opacity-20" />
                                            <p className="text-gray-500 uppercase tracking-widest text-xs font-black">Nenhum membro ativo no radar próximo a você</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : viewMode === 'feed' ? (
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
                                                isVerified={p.verified}
                                                isBoosted={p.boost_until && new Date(p.boost_until) > new Date()}
                                                imageUrl={p.imageUrl}
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
                            <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em]">Anuncie seu perfil e tenha destaque exclusivo</p>
                        </div>

                        <div className="max-w-md mx-auto">
                            {([] as Array<{ name: string, price: string, tier: string, features: Array<{ text: string, hint?: string }>, popular?: boolean, platinum?: boolean }>).concat([
                                {
                                    name: 'Plano Único Full',
                                    price: '39,99',
                                    tier: 'Completo',
                                    platinum: true,
                                    features: [
                                        { text: 'Fotos Ilimitadas' },
                                        { text: 'Vídeos Ilimitados' },
                                        { text: 'Selo "Elite" VIP' },
                                        { text: 'Destaque Máximo', hint: 'Maior relevância nas buscas e vitrine' },
                                        { text: 'Topo Rotativo do Site', hint: 'O cupido fixará seu perfil nas 3 primeiras posições' }
                                    ]
                                },
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
        </div >
    );
};
