import { useState, useEffect, useCallback } from 'react';
import { MapPin, ChevronRight, Check, Search, User, Plus, Menu, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileCard } from './components/ProfileCard';
import { FilterBar } from './components/FilterBar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ProfileModal } from './components/ProfileModal';
import { ModelLandingPage } from './components/ModelLandingPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [searchCity, setSearchCity] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [activeCategory, setActiveCategory] = useState<'acompanhante' | 'massagista'>('acompanhante');
  const [activeGender, setActiveGender] = useState('Mulheres');
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([]);

  // Profile Modal State
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // Capture referral from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      console.log("[App] Referral ID capturado:", ref);
      localStorage.setItem('referralId', ref);
    }
  }, []);

  // Define fetchUserRole outside to be reused
  const fetchUserRole = useCallback(async (userId: string) => {
    console.log("[App] Buscando role/admin para user:", userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('id', userId);

      if (error) {
        console.error("[App] Erro ao buscar role:", error);
        setUserRole('acompanhante');
        setIsAdmin(false);
      } else if (data && data.length > 0) {
        console.log("[App] Role/Admin encontrada:", data[0]);
        setUserRole(data[0].role || 'acompanhante');
        setIsAdmin(!!data[0].is_admin);
      } else {
        console.warn("[App] Perfil não encontrado para o usuário logado.");
        setUserRole('acompanhante');
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("[App] Exception ao buscar role:", err);
      setUserRole('acompanhante');
      setIsAdmin(false);
    } finally {
      setRoleLoaded(true);
    }
  }, []);

  // Auth listener
  useEffect(() => {
    console.log("[App] Iniciando monitoramento de sessão...");

    if (!isSupabaseConfigured) {
      console.warn("[App] Supabase não configurado.");
      setRoleLoaded(true);
      return;
    }

    // Capture initial session ONE-TIME
    let isInitialFetchDone = false;
    supabase.auth.getSession().then(({ data }: { data: any }) => {
      if (isInitialFetchDone) return;
      const currentUser = data?.session?.user ?? null;
      console.log("[App] Sessão inicial capturada:", currentUser?.id || "Ninguém");
      setUser(currentUser);
      if (currentUser) {
        fetchUserRole(currentUser.id);
      } else {
        setRoleLoaded(true);
      }
      isInitialFetchDone = true;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log(`[App] Auth Change Event: ${event}`);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const pendingRole = localStorage.getItem('pendingRole');
        if (pendingRole) {
          console.log("[App] Aplicando pendingRole:", pendingRole);
          localStorage.removeItem('pendingRole');
          const { data: existingProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id);

          if (existingProfile && existingProfile.length > 0 && existingProfile[0].role !== pendingRole) {
            setUserRole(existingProfile[0].role);
            setRoleLoaded(true);
          } else {
            const referredBy = localStorage.getItem('referralId');
            await supabase.from('profiles').upsert({
              id: currentUser.id,
              role: pendingRole,
              name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
              referred_by: referredBy || null,
            }, { onConflict: 'id' });
            setUserRole(pendingRole);
            setRoleLoaded(true);
          }
        } else {
          // Avoid duplicate calls if initial fetch is already handling it
          if (isInitialFetchDone) {
            fetchUserRole(currentUser.id);
          }
        }
      } else {
        setUserRole(null);
        setIsAdmin(false);
        setRoleLoaded(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserRole]);

  // Safety timeout - Keep it but increase slightly to give RLS/DB time
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!roleLoaded) {
        console.warn("[App] Timeout de carregamento de role atingido. Forçando desbloqueio.");
        setRoleLoaded(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [roleLoaded]);

  // Hash change listener
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentHash(window.location.hash);
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const fetchAvailableCities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('city, neighborhood')
        .or('role.neq.cliente,role.is.null');

      if (error) throw error;
      const cities = Array.from(new Set(data.map((p: any) => p.city).filter(Boolean)));
      const hoods = Array.from(new Set(data.map((p: any) => p.neighborhood).filter(Boolean)));
      setAvailableCities(cities as string[]);
      setAvailableNeighborhoods(hoods as string[]);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  }, []);

  const fetchProfiles = useCallback(async (city?: string, filter: string = 'Todos') => {
    try {
      setLoading(true);
      console.log("[App] Buscando perfis (Home)... City:", city || "Todas");
      let query = supabase
        .from('profiles')
        .select('*, plans(tier_weight)')
        .neq('role', 'cliente');
      if (city && city.trim()) {
        const searchTerm = `%${city.trim()}%`;
        query = query.or(`city.ilike.${searchTerm},neighborhood.ilike.${searchTerm}`);
      }

      // Filter by profile_type (category)
      query = query.eq('profile_type', activeCategory);

      // Filter by gender within the category
      if (activeGender === 'Mulheres') {
        query = query.ilike('gender', '%Mulher%');
      } else if (activeGender === 'Homens') {
        query = query.ilike('gender', '%Homem%');
      } else if (activeGender === 'Trans') {
        query = query.ilike('gender', '%Trans%');
      }

      if (filter === 'Verificados') {
        query = query.eq('verified', true);
      } else if (filter === 'Elite') {
        query = query.not('active_plan_id', 'is', null);
      }

      // Removed order by plans temporarily to debug visibility
      query = query.order('created_at', { ascending: false });

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) {
        console.error('[App] Erro crítico ao buscar perfis:', profilesError.message || profilesError);
        setProfiles([]);
        return;
      }

      console.log("[App] Perfis retornados:", profilesData?.length || 0);

      const profilesWithMedia = await Promise.all((profilesData || []).map(async (profile: any) => {
        const { data: photoFiles } = await supabase.storage.from('public-photos').list(profile.id, { limit: 1 });
        const { data: videoFiles } = await supabase.storage.from('public-videos').list(profile.id, { limit: 1 });

        return {
          ...profile,
          imageUrl: photoFiles?.length ? supabase.storage.from('public-photos').getPublicUrl(`${profile.id}/${photoFiles[0].name}`).data.publicUrl : null,
          videoUrl: videoFiles?.length ? supabase.storage.from('public-videos').getPublicUrl(`${profile.id}/${videoFiles[0].name}`).data.publicUrl : null
        };
      }));

      setProfiles(profilesWithMedia);
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
    } finally {
      setLoading(false);
    }
  }, [activeGender, activeCategory]);

  const fetchFeaturedProfiles = useCallback(async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*, plans(tier_weight)')
        .neq('role', 'cliente')
        .eq('profile_type', activeCategory);

      if (activeGender === 'Mulheres') {
        query = query.ilike('gender', '%Mulher%');
      } else if (activeGender === 'Homens') {
        query = query.ilike('gender', '%Homem%');
      } else if (activeGender === 'Trans') {
        query = query.ilike('gender', '%Trans%');
      }

      // Removed order by plans temporarily to guarantee visibility
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      const featured = await Promise.all((data || []).map(async (profile: any) => {
        const { data: photoFiles } = await supabase.storage.from('public-photos').list(profile.id, { limit: 1 });
        return {
          ...profile,
          imageUrl: photoFiles?.length ? supabase.storage.from('public-photos').getPublicUrl(`${profile.id}/${photoFiles[0].name}`).data.publicUrl : null,
        };
      }));

      setFeaturedProfiles(featured.filter(p => p.imageUrl));
      if (error) {
        console.error('[App] Erro ao buscar perfis em destaque:', error.message || error);
        return;
      }
    } catch (error) {
      console.error('Erro ao buscar perfis em destaque:', error);
    }
  }, [activeGender, activeCategory]);

  const handleWhatsAppClick = async (profileId: string) => {
    try {
      await supabase.rpc('increment_clicks', { profile_id: profileId });
    } catch (error) {
      console.error('Error incrementing clicks:', error);
    }
  };

  const isDashboardView = currentHash === '#dashboard';
  const isAdminView = currentHash === '#admin';
  const isModelLandingView = currentHash === '#sejaumamodelo' || currentPath === '/sejaumamodelo';

  const handleProfileUpdate = useCallback((profileId: string, updates: any) => {
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, ...updates } : p
    ));
  }, []);

  const openProfile = async (profile: any) => {
    try {
      setSelectedProfile(profile);
      setIsProfileModalOpen(true);

      const { data: photoFiles } = await supabase.storage.from('public-photos').list(profile.id);
      const photoUrls = (photoFiles || []).map((file: any) =>
        supabase.storage.from('public-photos').getPublicUrl(`${profile.id}/${file.name}`).data.publicUrl
      );

      const { data: videoFiles } = await supabase.storage.from('public-videos').list(profile.id);
      const videoUrls = (videoFiles || []).map((file: any) =>
        supabase.storage.from('public-videos').getPublicUrl(`${profile.id}/${file.name}`).data.publicUrl
      );

      setSelectedPhotos(photoUrls);
      setSelectedVideos(videoUrls);
    } catch (error) {
      console.error('Error fetching full profile media:', error);
    }
  };

  // SEO & Data fetch Effect
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Titles
    if (currentHash === '#dashboard') {
      document.title = 'Dashboard | Clube Privado';
    } else if (currentHash === '#admin') {
      document.title = 'Admin Panel | Clube Privado';
    } else if (isModelLandingView) {
      document.title = 'Seja uma Modelo | Clube Privado';
    } else if (searchCity) {
      document.title = `Acompanhantes em ${searchCity} | Clube Privado`;
    } else {
      document.title = 'Clube Privado | Acompanhantes de Luxo e Elite';
    }

    // REMOVED THE GUARD: Fetch data REGARDLESS of hash for Home to be populated correctly on fallback
    fetchProfiles(searchCity, activeFilter);
    fetchFeaturedProfiles();
    fetchAvailableCities();

  }, [currentHash, currentPath, isModelLandingView, searchCity, activeFilter, activeGender, fetchProfiles, fetchFeaturedProfiles, fetchAvailableCities]);

  // Guard: Global Loading (Wait for role to prevent UI flicker/stale redirects)
  if (!roleLoaded && (user || isDashboardView || isAdminView)) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-xs uppercase tracking-widest">Carregando...</p>
        </div>
      </div>
    );
  }

  // Final Routing Logic
  if (isModelLandingView) {
    return <ModelLandingPage />;
  }

  if (isAdminView && isAdmin) {
    return <AdminPanel />;
  }

  if (isDashboardView && user) {
    if (userRole === 'cliente') {
      return <ClientDashboard />;
    }
    return <Dashboard user={user} />;
  }

  // Default: Home Page
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
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-2 text-center text-[10px] font-black uppercase z-[200] tracking-widest">
          Atenção: Configure o arquivo .env com seu Supabase URL e Key para ativar o Login
        </div>
      )}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <header className="fixed top-0 z-50 w-full bg-navy/70 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
        <div className="border-b border-white/5">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                setSearchCity('');
                setCurrentHash('');
                window.location.hash = '';
              }}
            >
              <div className="w-8 h-8 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center rotate-3 border border-primary/30">
                <Plus className="text-primary transform -rotate-3" size={20} />
              </div>
              <div className="text-xl font-bold tracking-tight text-white">
                CLUBE<span className="text-primary tracking-widest font-black uppercase ml-1 drop-shadow-sm">PRIVADO</span>
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2 sm:gap-6">
              {!user && (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="hidden lg:block text-[10px] font-black text-white border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-navy hover:border-white transition-all tracking-widest uppercase shadow-sm hover:shadow-white/20"
                >
                  CADASTRE-SE GRÁTIS
                </button>
              )}

              <button
                onClick={() => user ? window.location.hash = '#dashboard' : setIsAuthOpen(true)}
                className="flex items-center gap-2 text-[11px] font-black text-white/80 hover:text-primary transition-colors tracking-tight uppercase"
              >
                {user ? (
                  <>
                    <User size={16} />
                    <span>PAINEL</span>
                  </>
                ) : (
                  <>
                    <span>LOGIN</span>
                    <ChevronRight size={14} className="text-primary" />
                  </>
                )}
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

              <div className="flex lg:hidden items-center gap-3 ml-2 border-l pl-4 border-white/10">
                <Menu className="text-gray-500 hover:text-primary transition-colors cursor-pointer" size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm scrollbar-hide overflow-x-auto border-t border-white/5">
          <div className="container mx-auto px-4 flex items-center justify-center gap-0 h-12">
            {/* Level 1: Category tabs */}
            {(['acompanhante', 'massagista'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setActiveGender('Mulheres');
                }}
                className={`relative px-6 sm:px-10 h-full flex items-center justify-center text-[13px] sm:text-sm font-bold transition-all duration-300 hover:text-white group ${activeCategory === cat ? 'text-white' : 'text-gray-500 hover:bg-white/5'
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

            {/* Divider */}
            <div className="h-6 w-px bg-white/10 mx-2" />

            {/* Level 2: Gender sub-tabs */}
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
                  className={`relative px-4 sm:px-8 h-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all duration-300 hover:text-white ${isActive ? 'text-primary' : 'text-gray-500 hover:bg-white/5'
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
        <section className="relative min-h-[45vh] md:min-h-[35vh] py-8 md:py-12 flex items-center justify-center overflow-hidden">
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

            <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-light mb-4 tracking-tight whitespace-nowrap">
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

              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {availableNeighborhoods.slice(0, 3).map(hood => (
                  <button key={hood} onClick={() => { setSearchCity(hood); document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-full px-4 py-1.5 bg-white/5 hover:bg-white/10 outline-none transition-all">{hood}</button>
                ))}
                <button onClick={() => { setActiveFilter('Recém Chegadas'); document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-full px-4 py-1.5 bg-white/5 hover:bg-white/10 outline-none transition-all">Novidades</button>
                <button onClick={() => { setActiveFilter('Elite'); document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[10px] uppercase font-bold tracking-widest text-primary border border-primary/20 rounded-full px-4 py-1.5 bg-primary/10 hover:bg-primary/20 outline-none transition-all shadow-[0_0_10px_rgba(226,176,162,0.1)]">Destaques da Semana</button>
              </div>
            </div>
          </div>
        </section>

        {featuredProfiles.length > 0 && (
          <section className="bg-navy/50 backdrop-blur-sm border-b border-white/5 py-5 scrollbar-hide overflow-x-auto">
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

        <section id="showcase" className="bg-navy py-8">
          <div className="container mx-auto px-4">
            <div className="mb-8 border-l-4 border-primary pl-6">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight tracking-tighter">
                Encontre acompanhantes em <br className="sm:hidden" />
                <span className="text-primary italic"> {searchCity || 'todo o Brasil'} </span>
              </h1>
              <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                <MapPin size={12} className="text-primary" />
                Deseja mudar a sua localização? <button className="text-white hover:text-primary underline" onClick={() => setSearchCity('')}>Clique aqui</button>
              </div>
            </div>

            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={(f: string) => {
                setActiveFilter(f);
                fetchProfiles(searchCity, f);
              }}
            />

            <div className="mt-8">
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
                      name={p.name || 'Modelo'}
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
                    <p className="text-gray-500 uppercase tracking-widest text-xs font-black">Nenhuma modelo encontrada nesta categoria</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="assinaturas" className="bg-navy-dark pt-32 pb-40 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-24">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Escolha seu <span className="text-primary not-italic underline underline-offset-8">Plano</span></h2>
              <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em]">Aumente sua visibilidade e receba mais contatos</p>
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
                // Determine a nice bokeh night city background depending on the index to add variety
                const bgImages = [
                  'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=800&auto=format&fit=crop', // Blueish bokeh
                  'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=800&auto=format&fit=crop', // Night lights
                  'https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&w=800&auto=format&fit=crop', // Golden bokeh
                  'https://images.unsplash.com/photo-1610406856429-269e8b23ad7f?q=80&w=800&auto=format&fit=crop', // Purple bokeh
                  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop', // Street lights
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
                    {/* Background Image */}
                    <img
                      src={bgImage}
                      alt={cityName}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-700 opacity-40 group-hover:scale-110 group-hover:opacity-70"
                    />

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Text Content */}
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
                )
              })
            ) : (
              <div className="w-full text-center py-10 text-gray-600 uppercase text-[10px] font-black tracking-widest">Aguardando perfis...</div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-navy border-t border-white/10 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">
            &copy; 2024 Clube Privado. Todos os direitos reservados.
          </p>
          <div className="flex justify-center gap-8 text-[9px] uppercase tracking-widest text-gray-600">
            <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Contato</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
