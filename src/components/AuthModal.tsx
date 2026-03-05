import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, User, Heart, ChevronRight, ChevronLeft } from 'lucide-react';

type UserRole = 'cliente' | 'acompanhante' | null;
type AuthStep = 'role' | 'form';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Captura referral code da URL
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            localStorage.setItem('referralId', ref);
            console.log('Referral capturado:', ref);
        }
    }, []);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>(null);
    const [step, setStep] = useState<AuthStep>('form');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            if (selectedRole) {
                localStorage.setItem('pendingRole', selectedRole);
            }
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // Manual Validation (Safari-friendly)
        if (!email.trim() || !email.includes('@')) {
            return setError('Por favor, informe um e-mail válido.');
        }
        if (!password || password.length < 6) {
            return setError('A senha deve ter pelo menos 6 caracteres.');
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                // Busca role após login e valida
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

                    if (profile?.role && selectedRole && profile.role !== selectedRole) {
                        // Role diferente — bloqueia login
                        await supabase.auth.signOut({ scope: 'local' });
                        const roleLabel = profile.role === 'cliente' ? 'Cliente' : 'Acompanhante';
                        throw new Error(`Esta conta já está cadastrada como "${roleLabel}". Por favor, volte e selecione o perfil correto.`);
                    }

                    if (!profile?.role && selectedRole) {
                        await supabase.from('profiles').update({ role: selectedRole }).eq('id', user.id);
                    }
                }

                window.location.hash = '#dashboard';
                onClose();
            } else {
                // Signup
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                if (data.user) {
                    // Check for referral code
                    const referredBy = localStorage.getItem('referralId');

                    await supabase.from('profiles').upsert({
                        id: data.user.id,
                        role: selectedRole || 'acompanhante',
                        name: email.split('@')[0],
                        city: 'São Paulo', // Cidade padrão
                        gender: 'Mulher',  // Gênero padrão
                        verified: false,
                        referred_by: referredBy || null, // Salva quem indicou
                        balance: 0.0 // Inicializa saldo zerado
                    }, { onConflict: 'id' });
                }

                window.location.hash = '#dashboard';
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setError(null);
        setSelectedRole(null);
        setStep('form');
        setEmail('');
        setPassword('');
        setIsLogin(true);
    };

    const selectRole = (role: UserRole) => {
        setSelectedRole(role);
        setStep('form');
    };

    const toggleAuthMode = () => {
        if (isLogin) {
            // Switching to Signup
            setIsLogin(false);
            if (!selectedRole) {
                setStep('role');
            }
        } else {
            // Switching to Login
            setIsLogin(true);
            setStep('form');
        }
        setError(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { onClose(); resetForm(); }}
                        className="absolute inset-0 bg-navy/90 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-navy-dark border border-white/10 rounded-sm p-8 shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            onClick={() => { onClose(); resetForm(); }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-lg"
                        >
                            ✕
                        </button>

                        {/* Step 1: Escolher Papel */}
                        {step === 'role' && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        onClick={() => { setIsLogin(true); setStep('form'); }}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <h2 className="text-xl font-black uppercase tracking-tight">
                                        Criar <span className="text-primary">Conta</span>
                                    </h2>
                                </div>
                                <p className="text-gray-500 text-xs mb-8">Escolha seu tipo de perfil para começar</p>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => selectRole('cliente')}
                                        className="w-full group bg-navy border border-white/10 hover:border-primary/50 rounded-sm p-6 text-left transition-all hover:bg-primary/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                <User size={22} className="text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-black text-sm uppercase tracking-wide">Cliente</h3>
                                                <p className="text-[10px] text-gray-500 mt-1">Busque e conecte-se com acompanhantes</p>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-600 group-hover:text-primary transition-colors" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => selectRole('acompanhante')}
                                        className="w-full group bg-navy border border-white/10 hover:border-primary/50 rounded-sm p-6 text-left transition-all hover:bg-primary/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                <Heart size={22} className="text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-black text-sm uppercase tracking-wide">Acompanhante</h3>
                                                <p className="text-[10px] text-gray-500 mt-1">Anuncie seus serviços e receba contatos</p>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-600 group-hover:text-primary transition-colors" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Form de Login/Cadastro */}
                        {step === 'form' && (
                            <div>
                                {/* Header */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-black uppercase tracking-tight">
                                        {isLogin ? 'Entrar no ' : 'Finalizar '}
                                        <span className="text-primary">Clube</span>
                                    </h2>
                                    {!isLogin && selectedRole && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${selectedRole === 'cliente'
                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                : 'bg-primary/10 text-primary border border-primary/20'
                                                }`}>
                                                {selectedRole === 'cliente' ? '👤 Perfil Cliente' : '💗 Perfil Acompanhante'}
                                            </span>
                                            <button
                                                onClick={() => setStep('role')}
                                                className="text-[9px] text-gray-500 hover:text-white underline uppercase tracking-widest"
                                            >
                                                Alterar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Google OAuth */}
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold text-sm py-3 rounded-sm hover:bg-gray-100 transition-all mb-4"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continuar com Google
                                </button>

                                {/* Divider */}
                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex-1 h-px bg-white/10"></div>
                                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">ou use e-mail</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>

                                {/* Email/Password Form */}
                                <form onSubmit={handleEmailAuth} className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="E-mail"
                                            className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                                        />
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Senha"
                                            className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
                                            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                            <p className="text-[10px] text-red-400">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn-primary py-3 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                                        {isLogin ? 'Entrar' : 'Cadastrar'}
                                    </button>
                                </form>

                                {/* Toggle Login/Cadastro */}
                                <p className="text-center text-xs text-gray-500 mt-6">
                                    {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
                                    <button
                                        onClick={toggleAuthMode}
                                        className="text-primary hover:text-primary-light font-bold transition-colors"
                                    >
                                        {isLogin ? 'Cadastre-se' : 'Entrar'}
                                    </button>
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
