import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    User,
    Heart,
    Settings,
    LogOut,
    Eye,
    MessageCircle,
    MapPin,
    Search,
    Star,
    ChevronRight
} from 'lucide-react';

export const ClientDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Início');
    const [profile, setProfile] = useState<any>({ name: '' });
    const [favorites] = useState<any[]>([]);
    const [recentViews] = useState<any[]>([]);
    // const [loading, setLoading] = useState(true); // Removed as it was unused

    const menuItems = [
        { icon: LayoutDashboard, label: 'Início' },
        { icon: Heart, label: 'Favoritas' },
        { icon: Eye, label: 'Visualizadas' },
        { icon: Settings, label: 'Minha Conta' },
    ];

    useEffect(() => {
        const originalTitle = document.title;
        document.title = `${activeTab} | TheSecretclub`;
        fetchClientProfile();
        return () => { document.title = originalTitle; };
    }, [activeTab]);

    const fetchClientProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) setProfile(data);
        } catch (err) {
            console.error('Erro ao buscar perfil do cliente:', err);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut({ scope: 'local' });
        // Limpa manualmente qualquer sessão residual
        const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
        keysToRemove.forEach(k => localStorage.removeItem(k));
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-navy flex">
            {/* Sidebar */}
            <aside className="w-64 bg-navy-dark border-r border-white/5 p-6 flex flex-col fixed h-full z-20">
                <div className="text-xl font-light tracking-[0.4em] mb-12">
                    THE<span className="font-black text-primary">SECRETCLUB</span>
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
                            {activeTab} <span className="text-primary not-italic">{activeTab === 'Início' ? 'Painel' : ''}</span>
                        </h1>
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] mt-2">Área do Cliente</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-sm">
                            <User size={14} className="text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                {profile.name || 'Cliente'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Tab: Início */}
                {activeTab === 'Início' && (
                    <div className="space-y-8">
                        {/* Boas-vindas */}
                        <div className="bg-navy-light border border-white/5 p-8 rounded-sm">
                            <h2 className="text-xl font-black uppercase tracking-tight mb-2">
                                Olá, <span className="text-primary">{profile.name || 'Cliente'}</span>
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Bem-vindo ao seu painel exclusivo. Aqui você pode buscar membros, salvar favoritos e gerenciar sua conta.
                            </p>
                        </div>

                        {/* Cards de ação rápida */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <button
                                onClick={() => { window.location.hash = ''; }}
                                className="group bg-navy-light border border-white/5 hover:border-primary/30 p-8 rounded-sm transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                    <Search size={20} className="text-primary" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-wide mb-1">Explorar</h3>
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    Busque membros por cidade, categoria ou filtro
                                </p>
                                <ChevronRight size={14} className="text-gray-600 group-hover:text-primary transition-colors mt-3" />
                            </button>

                            <button
                                onClick={() => setActiveTab('Favoritas')}
                                className="group bg-navy-light border border-white/5 hover:border-primary/30 p-8 rounded-sm transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                    <Heart size={20} className="text-primary" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-wide mb-1">Favoritas</h3>
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    Veja seus membros favoritos salvos
                                </p>
                                <ChevronRight size={14} className="text-gray-600 group-hover:text-primary transition-colors mt-3" />
                            </button>

                            <button
                                onClick={() => setActiveTab('Minha Conta')}
                                className="group bg-navy-light border border-white/5 hover:border-primary/30 p-8 rounded-sm transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                    <Settings size={20} className="text-primary" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-wide mb-1">Configurações</h3>
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    Gerencie sua conta e preferências
                                </p>
                                <ChevronRight size={14} className="text-gray-600 group-hover:text-primary transition-colors mt-3" />
                            </button>
                        </div>

                        {/* Estatísticas simples */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-navy-light border border-white/5 p-6 rounded-sm text-center">
                                <Eye size={20} className="text-primary mx-auto mb-3" />
                                <p className="text-2xl font-black">{recentViews.length}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">Perfis Visualizados</p>
                            </div>
                            <div className="bg-navy-light border border-white/5 p-6 rounded-sm text-center">
                                <Heart size={20} className="text-primary mx-auto mb-3" />
                                <p className="text-2xl font-black">{favorites.length}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">Favoritas</p>
                            </div>
                            <div className="bg-navy-light border border-white/5 p-6 rounded-sm text-center">
                                <MessageCircle size={20} className="text-primary mx-auto mb-3" />
                                <p className="text-2xl font-black">0</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-1">Contatos Realizados</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab: Favoritas */}
                {activeTab === 'Favoritas' && (
                    <div className="space-y-6">
                        {favorites.length === 0 ? (
                            <div className="bg-navy-light border border-dashed border-white/10 p-16 rounded-sm text-center">
                                <Heart size={40} className="text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Nenhuma favorita ainda</p>
                                <p className="text-gray-600 text-[10px] mb-6">
                                    Clique no ícone de coração nos perfis para salvá-los aqui
                                </p>
                                <button
                                    onClick={() => { window.location.hash = ''; }}
                                    className="btn-primary px-8 py-3 inline-flex items-center gap-2"
                                >
                                    <Search size={14} />
                                    Explorar Membros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favorites.map((fav: any) => (
                                    <div key={fav.id} className="bg-navy-light border border-white/5 p-4 rounded-sm flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                            <img src={fav.imageUrl} alt={fav.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-sm">{fav.name}</h4>
                                            <p className="text-[9px] text-gray-500 flex items-center gap-1 mt-1">
                                                <MapPin size={8} /> {fav.city}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary">
                                            <Star size={10} fill="currentColor" />
                                            <span className="text-[10px] font-bold">{fav.rating?.toFixed(1) || '5.0'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Visualizadas */}
                {activeTab === 'Visualizadas' && (
                    <div className="space-y-6">
                        {recentViews.length === 0 ? (
                            <div className="bg-navy-light border border-dashed border-white/10 p-16 rounded-sm text-center">
                                <Eye size={40} className="text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Nenhuma visualização recente</p>
                                <p className="text-gray-600 text-[10px] mb-6">
                                    Os perfis que você visualizar aparecerão aqui
                                </p>
                                <button
                                    onClick={() => { window.location.hash = ''; }}
                                    className="btn-primary px-8 py-3 inline-flex items-center gap-2"
                                >
                                    <Search size={14} />
                                    Explorar Membros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recentViews.map((view: any) => (
                                    <div key={view.id} className="bg-navy-light border border-white/5 p-4 rounded-sm flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                            <img src={view.imageUrl} alt={view.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-sm">{view.name}</h4>
                                            <p className="text-[9px] text-gray-500 flex items-center gap-1 mt-1">
                                                <MapPin size={8} /> {view.city}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Minha Conta */}
                {activeTab === 'Minha Conta' && (
                    <div className="max-w-xl space-y-8">
                        <div className="bg-navy-light border border-white/5 p-8 rounded-sm space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Informações da Conta</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tipo de Conta</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <User size={12} />
                                        Cliente
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nome</span>
                                    <span className="text-sm font-bold">{profile.name || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Membro desde</span>
                                    <span className="text-[10px] text-gray-400">
                                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3">Zona de Perigo</h3>
                            <p className="text-[10px] text-gray-500 mb-4">Ao excluir sua conta, todos os seus dados serão removidos permanentemente.</p>
                            <button className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors border border-red-500/20 px-4 py-2 rounded-sm hover:bg-red-500/10">
                                Excluir Conta
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
