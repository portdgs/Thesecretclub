import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ModelLandingPage } from './components/ModelLandingPage';
import { AmbassadorProgram } from './components/AffiliateProgram';
import { LandingPage } from './components/LandingPage';
import { FeedPage } from './components/FeedPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { ChatModal } from './components/ChatModal';

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
  const [activeCategory, setActiveCategory] = useState<'singles' | 'casal'>('singles');
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

  // Legal Modals State
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    return localStorage.getItem('age-verified') === 'true';
  });
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTargetUserId, setChatTargetUserId] = useState<string | undefined>(undefined);

  // Capture referral from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      console.log("[App] Referral ID capturado:", ref);
      localStorage.setItem('referralId', ref);
    }
  }, []);

  // Open Chat Event Listener
  useEffect(() => {
    const handleOpenChat = () => {
      setIsChatOpen(true);
    };
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  // Define fetchUserRole outside to be reused
  const fetchUserRole = useCallback(async (userId: string) => {
    console.log("[App] Buscando profile_type/admin para user:", userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_type, is_admin')
        .eq('id', userId);

      if (error) {
        console.error("[App] Erro ao buscar profile_type:", error);
        setUserRole('singles');
        setIsAdmin(false);
      } else if (data && data.length > 0) {
        console.log("[App] Profile_type/Admin encontrada:", data[0]);
        setUserRole(data[0].profile_type || 'singles');
        setIsAdmin(!!data[0].is_admin);
      } else {
        console.warn("[App] Perfil não encontrado para o usuário logado.");
        setUserRole('singles');
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("[App] Exception ao buscar profile_type:", err);
      setUserRole('singles');
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
          console.log("[App] Aplicando pendingRole (como profile_type):", pendingRole);
          localStorage.removeItem('pendingRole');
          const { data: existingProfile } = await supabase.from('profiles').select('profile_type').eq('id', currentUser.id);

          if (existingProfile && existingProfile.length > 0 && existingProfile[0].profile_type !== pendingRole) {
            setUserRole(existingProfile[0].profile_type);
            setRoleLoaded(true);
          } else {
            const referredBy = localStorage.getItem('referralId');
            await supabase.from('profiles').upsert({
              id: currentUser.id,
              profile_type: pendingRole,
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
        .or('profile_type.neq.cliente,profile_type.is.null');

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
        .select('*, plans(tier_weight, photos_limit, videos_limit)')
        .neq('profile_type', 'cliente');

      if (currentUser?.id) {
        query = query.neq('id', currentUser.id);
      }

      if (city && city.trim()) {
        const searchTerm = `%${city.trim()}%`;
        query = query.or(`city.ilike.${searchTerm},neighborhood.ilike.${searchTerm}`);
      }

      // Filter by profile_type (category)
      if (activeCategory === 'singles') {
        query = query.or('profile_type.eq.homem_single,profile_type.eq.mulher_single,profile_type.eq.membro,profile_type.eq.acompanhante,profile_type.is.null');
      } else {
        query = query.eq('profile_type', 'casal');
      }

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
      } else if (filter === 'Luxo+') {
        query = query.not('active_plan_id', 'is', null);
      }

      query = query
        .order('boost_until', { ascending: false, nullsFirst: false })
        .order('plan_tier_weight', { ascending: false })
        .order('created_at', { ascending: false });

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) {
        console.error('[App] Erro crítico ao buscar perfis:', profilesError.message || profilesError);
        setProfiles([]);
        return;
      }

      console.log("[App] Perfis retornados:", profilesData?.length || 0);

      const profilesWithMedia = await Promise.all((profilesData || []).map(async (profile: any) => {
        const { data: photoFiles } = await supabase.storage.from('Thesecretclub').list(profile.id, { limit: 1 });
        const { data: videoFiles } = await supabase.storage.from('Thesecretclub-video').list(profile.id, { limit: 1 });

        return {
          ...profile,
          imageUrl: photoFiles?.length ? supabase.storage.from('Thesecretclub').getPublicUrl(`${profile.id}/${photoFiles[0].name}`).data.publicUrl : null,
          videoUrl: videoFiles?.length ? supabase.storage.from('Thesecretclub-video').getPublicUrl(`${profile.id}/${videoFiles[0].name}`).data.publicUrl : null
        };
      }));

      if (filter === 'Com Vídeo') {
        setProfiles(profilesWithMedia.filter(p => p.videoUrl));
      } else {
        setProfiles(profilesWithMedia);
      }
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeGender, supabase.storage]);

  const fetchNearbyProfiles = useCallback(async (lat: number, lng: number, radius: number = 50) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_nearby_profiles', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radius
      });

      if (error) throw error;

      // Filter out the current user from the nearby results
      const filteredData = (data || []).filter((p: any) => p.id !== currentUser?.id);

      const profilesWithMedia = await Promise.all(filteredData.map(async (profile: any) => {
        const { data: photoFiles } = await supabase.storage.from('Thesecretclub').list(profile.id, { limit: 1 });
        const { data: videoFiles } = await supabase.storage.from('Thesecretclub-video').list(profile.id, { limit: 1 });

        return {
          ...profile,
          imageUrl: photoFiles?.length ? supabase.storage.from('Thesecretclub').getPublicUrl(`${profile.id}/${photoFiles[0].name}`).data.publicUrl : null,
          videoUrl: videoFiles?.length ? supabase.storage.from('Thesecretclub-video').getPublicUrl(`${profile.id}/${videoFiles[0].name}`).data.publicUrl : null
        };
      }));

      setProfiles(profilesWithMedia);
    } catch (error) {
      console.error('Error fetching nearby profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase.storage]);

  const fetchFeaturedProfiles = useCallback(async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*, plans(tier_weight, photos_limit, videos_limit)')
        .neq('profile_type', 'cliente');

      if (currentUser?.id) {
        query = query.neq('id', currentUser.id);
      }

      if (activeCategory === 'singles') {
        query = query.or('profile_type.eq.homem_single,profile_type.eq.mulher_single,profile_type.eq.membro,profile_type.eq.acompanhante,profile_type.is.null');
      } else {
        query = query.eq('profile_type', 'casal');
      }

      if (activeGender === 'Mulheres') {
        query = query.ilike('gender', '%Mulher%');
      } else if (activeGender === 'Homens') {
        query = query.ilike('gender', '%Homem%');
      } else if (activeGender === 'Trans') {
        query = query.ilike('gender', '%Trans%');
      }

      const { data, error } = await query
        .order('boost_until', { ascending: false, nullsFirst: false })
        .order('plan_tier_weight', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;

      const featured = await Promise.all((data || []).map(async (profile: any) => {
        const { data: photoFiles } = await supabase.storage.from('Thesecretclub').list(profile.id, { limit: 1 });
        return {
          ...profile,
          imageUrl: photoFiles?.length ? supabase.storage.from('Thesecretclub').getPublicUrl(`${profile.id}/${photoFiles[0].name}`).data.publicUrl : null,
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      await supabase.rpc('increment_clicks', {
        profile_id: profileId,
        visitor_id: authUser?.id || null
      });
    } catch (error) {
      console.error('Error incrementing clicks:', error);
    }
  };

  const isDashboardView = currentHash === '#dashboard';
  const isAdminView = currentHash === '#admin';
  const isModelLandingView = currentHash === '#sejaummembro' || currentPath === '/sejaummembro';
  const isAmbassadorView = currentPath.toLowerCase() === '/programadeafiliadosadulto';

  const handleProfileUpdate = useCallback((profileId: string, updates: any) => {
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, ...updates } : p
    ));
  }, []);

  const openProfile = async (profile: any) => {
    try {
      setSelectedProfile(profile);
      setIsProfileModalOpen(true);

      const photosLimit = profile.plans?.photos_limit ?? 3;
      const videosLimit = profile.plans?.videos_limit ?? 0;

      const { data: photoFiles } = await supabase.storage.from('Thesecretclub').list(profile.id);
      const photoUrls = (photoFiles || []).map((file: any) =>
        supabase.storage.from('Thesecretclub').getPublicUrl(`${profile.id}/${file.name}`).data.publicUrl
      );

      const { data: videoFiles } = await supabase.storage.from('Thesecretclub-video').list(profile.id);
      const videoUrls = (videoFiles || []).map((file: any) =>
        supabase.storage.from('Thesecretclub-video').getPublicUrl(`${profile.id}/${file.name}`).data.publicUrl
      );

      setSelectedPhotos(photoUrls.slice(0, photosLimit));
      setSelectedVideos(videoUrls.slice(0, videosLimit));
    } catch (error) {
      console.error('Error fetching full profile media:', error);
    }
  };

  // SEO & Data fetch Effect
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if (currentHash === '#dashboard') {
      document.title = 'Dashboard | TheSecretclub';
    } else if (currentHash === '#admin') {
      document.title = 'Admin Panel | TheSecretclub';
    } else if (isModelLandingView) {
      document.title = 'Seja um Membro | TheSecretclub';
    } else if (!user) {
      document.title = 'TheSecretclub | Acesso Exclusivo por Convite';
    } else if (searchCity) {
      document.title = `Acompanhantes em ${searchCity} | TheSecretclub`;
    } else {
      document.title = 'TheSecretclub | Feed';
    }

    // Only fetch data if user is authenticated
    if (user) {
      fetchProfiles(searchCity, activeFilter);
      fetchFeaturedProfiles();
      fetchAvailableCities();
    }

  }, [currentHash, currentPath, isModelLandingView, isAmbassadorView, searchCity, activeFilter, activeGender, user, fetchProfiles, fetchFeaturedProfiles, fetchAvailableCities]);

  // Invite validation callback
  const handleInviteValidated = useCallback((_code: string) => {
    setIsAuthOpen(true);
  }, []);

  // Guard: Global Loading
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
  if (isAmbassadorView) {
    return (
      <>
        <AmbassadorProgram onLoginClick={() => setIsAuthOpen(true)} />
        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

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

  // GATEKEEPING: Unauthenticated users see the Landing Page
  if (!user) {
    return (
      <>
        <LandingPage
          onLoginClick={() => setIsAuthOpen(true)}
          onInviteValidated={handleInviteValidated}
        />
        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          )}
        </AnimatePresence>
      </>
    );
  }

  // AUTHENTICATED: Show the Feed
  return (
    <AnimatePresence mode="wait">
      <div className="min-h-screen bg-navy text-white">
        <FeedPage
          user={user}
          profiles={profiles}
          featuredProfiles={featuredProfiles}
          loading={loading}
          searchCity={searchCity}
          setSearchCity={setSearchCity}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          activeGender={activeGender}
          setActiveGender={setActiveGender}
          availableCities={availableCities}
          availableNeighborhoods={availableNeighborhoods}
          fetchProfiles={fetchProfiles}
          fetchNearbyProfiles={fetchNearbyProfiles}
          handleWhatsAppClick={handleWhatsAppClick}
          onMessageClick={(id: string) => {
            setChatTargetUserId(id);
            setIsChatOpen(true);
          }}
          openProfile={openProfile}
          isProfileModalOpen={isProfileModalOpen}
          setIsProfileModalOpen={setIsProfileModalOpen}
          selectedProfile={selectedProfile}
          selectedPhotos={selectedPhotos}
          selectedVideos={selectedVideos}
          handleProfileUpdate={handleProfileUpdate}
          isAuthOpen={isAuthOpen}
          setIsAuthOpen={setIsAuthOpen}
          isTermsOpen={isTermsOpen}
          setIsTermsOpen={setIsTermsOpen}
          isAgeVerified={isAgeVerified}
          setIsAgeVerified={setIsAgeVerified}
        />

        {isChatOpen && user && (
          <ChatModal
            isOpen={isChatOpen}
            onClose={() => {
              setIsChatOpen(false);
              setChatTargetUserId(undefined);
            }}
            currentUserId={user.id}
            targetUserId={chatTargetUserId}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
