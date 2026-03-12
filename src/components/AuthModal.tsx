import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, ChevronLeft, KeyRound, Sparkles, Users, Heart } from 'lucide-react';

type MemberGender = 'homem' | 'mulher' | null;
type MemberStatus = 'single' | 'casal' | null;
type AuthStep = 'invite' | 'onboarding' | 'form';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            localStorage.setItem('referralId', ref);
        }
    }, []);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<AuthStep>('form');
    const [inviteCode, setInviteCode] = useState('');
    const [inviteValidated, setInviteValidated] = useState(false);

    // Onboarding data
    const [memberGender, setMemberGender] = useState<MemberGender>(null);
    const [memberStatus, setMemberStatus] = useState<MemberStatus>(null);
    const [onboardingPhase, setOnboardingPhase] = useState<'gender' | 'status'>('gender');

    // Check if there's a pre-validated invite code from LandingPage
    useEffect(() => {
        const pendingCode = localStorage.getItem('pendingInviteCode');
        if (pendingCode) {
            setInviteCode(pendingCode);
            setInviteValidated(true);
            setIsLogin(false);
            setStep('onboarding');
        }
    }, [isOpen]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            if (memberGender) localStorage.setItem('pendingGender', memberGender);
            if (memberStatus) localStorage.setItem('pendingStatus', memberStatus);
            if (inviteCode) localStorage.setItem('pendingInviteCode', inviteCode);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: { access_type: 'offline', prompt: 'consent' },
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
                window.location.hash = '';
                onClose();
            } else {
                if (!inviteValidated && !inviteCode.trim()) {
                    throw new Error('Código de convite é obrigatório para o cadastro.');
                }

                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                if (data.user) {
                    // Consume the secure invite code
                    const codeToUse = inviteCode.trim() || localStorage.getItem('pendingInviteCode') || '';
                    let referredBy = localStorage.getItem('referralId');

                    if (codeToUse) {
                        // 1. Try referral system (secure tokens)
                        const { data: inviterId } = await supabase.rpc('validate_and_use_secure_invite', {
                            guest_email: email.trim().toLowerCase(),
                            token: codeToUse.toLowerCase(),
                            new_user_uuid: data.user.id
                        });

                        if (inviterId) {
                            referredBy = inviterId;
                        } else {
                            // 2. Fallback to legacy invite_codes system
                            await supabase.rpc('validate_and_use_invite', {
                                invite_code: codeToUse.toUpperCase(),
                                user_uuid: data.user.id
                            });
                        }
                    }
                    localStorage.removeItem('pendingInviteCode');

                    // Build profile name from gender + status
                    const genderLabel = memberGender === 'homem' ? 'Homem' : memberGender === 'mulher' ? 'Mulher' : '';
                    const statusLabel = memberStatus === 'casal' ? 'Casal' : memberStatus === 'single' ? 'Single' : '';

                    await supabase.from('profiles').upsert({
                        id: data.user.id,
                        profile_type: 'cliente',
                        name: email.split('@')[0],
                        gender: genderLabel || 'Não informado',
                        relationship_status: statusLabel || 'Não informado',
                        city: '',
                        verified: false,
                        referred_by: referredBy || null,
                        balance: 0.0
                    }, { onConflict: 'id' });
                }

                window.location.hash = '';
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
        setStep('form');
        setEmail('');
        setPassword('');
        setIsLogin(true);
        setInviteCode('');
        setInviteValidated(false);
        setMemberGender(null);
        setMemberStatus(null);
        setOnboardingPhase('gender');
        localStorage.removeItem('pendingInviteCode');
    };

    const handleInviteSubmit = async () => {
        if (!email.trim() || !email.includes('@')) {
            setError('Por favor, informe um e-mail válido primeiro.');
            return;
        }
        if (!inviteCode.trim()) {
            setError('Digite seu token de convite.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('generated_invites')
                .select('id, is_used')
                .eq('final_token', inviteCode.trim())
                .eq('invited_email', email.trim().toLowerCase())
                .single();

            if (error || !data) { setError('Convite inválido ou e-mail não confere com o convite.'); return; }
            if (data.is_used) { setError('Este convite já foi utilizado.'); return; }

            setInviteValidated(true);
            setStep('onboarding');
            setOnboardingPhase('gender');
        } catch {
            setError('Erro ao validar convite.');
        } finally {
            setLoading(false);
        }
    };

    const selectGender = (gender: MemberGender) => {
        setMemberGender(gender);
        setOnboardingPhase('status');
    };

    const selectStatus = (status: MemberStatus) => {
        setMemberStatus(status);
        setStep('form');
    };

    const toggleAuthMode = () => {
        if (isLogin) {
            setIsLogin(false);
            const pendingCode = localStorage.getItem('pendingInviteCode');
            if (pendingCode) {
                setInviteCode(pendingCode);
                setInviteValidated(true);
                setStep('onboarding');
            } else {
                setStep('invite');
            }
        } else {
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
                        className="relative w-full max-w-md bg-navy-dark border border-white/10 rounded-2xl p-8 shadow-2xl"
                    >
                        <button
                            onClick={() => { onClose(); resetForm(); }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-lg"
                        >
                            ✕
                        </button>

                        {/* ── STEP: INVITE CODE ── */}
                        {step === 'invite' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => { setIsLogin(true); setStep('form'); }} className="text-gray-500 hover:text-white transition-colors">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <h2 className="text-xl font-black uppercase tracking-tight">
                                        Código de <span className="text-primary">Convite</span>
                                    </h2>
                                </div>
                                <p className="text-gray-500 text-xs mb-8">
                                    TheSecretclub é exclusivo por convite. Insira o e-mail autorizado e seu token de acesso.
                                </p>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                            placeholder="Seu E-mail"
                                            className="w-full bg-navy border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => { setInviteCode(e.target.value); setError(null); }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                                            placeholder="Token de Acesso (Ex: a1b2c3d4...)"
                                            className="w-full bg-navy border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 tracking-widest font-mono"
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                            <p className="text-[10px] text-red-400">{error}</p>
                                        </div>
                                    )}

                                    <button onClick={handleInviteSubmit} disabled={loading}
                                        className="w-full btn-primary py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={14} />}
                                        Validar Convite
                                    </button>
                                </div>

                                <p className="text-center text-xs text-gray-500 mt-6">
                                    Já tem conta?{' '}
                                    <button onClick={() => { setIsLogin(true); setStep('form'); setError(null); }} className="text-primary hover:text-primary-light font-bold transition-colors">Entrar</button>
                                </p>
                            </motion.div>
                        )}

                        {/* ── STEP: ONBOARDING ── */}
                        {step === 'onboarding' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <button
                                        onClick={() => {
                                            if (onboardingPhase === 'status') {
                                                setOnboardingPhase('gender');
                                            } else {
                                                setStep(inviteValidated ? 'invite' : 'form');
                                            }
                                        }}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <h2 className="text-xl font-black uppercase tracking-tight">
                                        Sobre <span className="text-primary">Você</span>
                                    </h2>
                                </div>

                                {inviteValidated && (
                                    <div className="flex items-center gap-2 mb-6 p-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                                        <Sparkles size={12} className="text-green-400" />
                                        <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider">
                                            Convite validado: {inviteCode}
                                        </span>
                                    </div>
                                )}

                                {/* Progress dots */}
                                <div className="flex items-center justify-center gap-2 mb-8">
                                    <div className={`w-2 h-2 rounded-full transition-all ${onboardingPhase === 'gender' ? 'bg-primary w-6' : 'bg-primary'}`} />
                                    <div className={`w-2 h-2 rounded-full transition-all ${onboardingPhase === 'status' ? 'bg-primary w-6' : 'bg-white/20'}`} />
                                    <div className="w-2 h-2 rounded-full bg-white/20" />
                                </div>

                                <AnimatePresence mode="wait">
                                    {/* Phase 1: Gender */}
                                    {onboardingPhase === 'gender' && (
                                        <motion.div
                                            key="gender"
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <p className="text-gray-400 text-sm mb-6 text-center">Como você se identifica?</p>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => selectGender('homem')}
                                                    className={`group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 border ${memberGender === 'homem'
                                                        ? 'border-blue-400/50 bg-blue-500/10 shadow-[0_0_20px_rgba(96,165,250,0.15)]'
                                                        : 'border-white/10 bg-white/5 hover:border-blue-400/30 hover:bg-blue-500/5'
                                                        }`}
                                                >
                                                    <div className="text-4xl mb-3">👨</div>
                                                    <h3 className="font-black text-sm uppercase tracking-wide text-white">Homem</h3>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>

                                                <button
                                                    onClick={() => selectGender('mulher')}
                                                    className={`group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 border ${memberGender === 'mulher'
                                                        ? 'border-pink-400/50 bg-pink-500/10 shadow-[0_0_20px_rgba(244,114,182,0.15)]'
                                                        : 'border-white/10 bg-white/5 hover:border-pink-400/30 hover:bg-pink-500/5'
                                                        }`}
                                                >
                                                    <div className="text-4xl mb-3">👩</div>
                                                    <h3 className="font-black text-sm uppercase tracking-wide text-white">Mulher</h3>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Phase 2: Status */}
                                    {onboardingPhase === 'status' && (
                                        <motion.div
                                            key="status"
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <p className="text-gray-400 text-sm mb-6 text-center">Qual é o seu status?</p>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => selectStatus('single')}
                                                    className={`group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 border ${memberStatus === 'single'
                                                        ? 'border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(226,176,162,0.15)]'
                                                        : 'border-white/10 bg-white/5 hover:border-primary/30 hover:bg-primary/5'
                                                        }`}
                                                >
                                                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                                                        <Heart size={24} className="text-primary" />
                                                    </div>
                                                    <h3 className="font-black text-sm uppercase tracking-wide text-white">Single</h3>
                                                    <p className="text-[10px] text-gray-500 mt-1">Estou sozinho(a)</p>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>

                                                <button
                                                    onClick={() => selectStatus('casal')}
                                                    className={`group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 border ${memberStatus === 'casal'
                                                        ? 'border-purple-400/50 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                                                        : 'border-white/10 bg-white/5 hover:border-purple-400/30 hover:bg-purple-500/5'
                                                        }`}
                                                >
                                                    <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                                                        <Users size={24} className="text-purple-400" />
                                                    </div>
                                                    <h3 className="font-black text-sm uppercase tracking-wide text-white">Casal</h3>
                                                    <p className="text-[10px] text-gray-500 mt-1">Estamos juntos</p>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* ── STEP: FORM ── */}
                        {step === 'form' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                                <div className="mb-8">
                                    <h2 className="text-xl font-black uppercase tracking-tight">
                                        {isLogin ? 'Entrar no ' : 'Finalizar '}
                                        <span className="text-primary">TheSecretclub</span>
                                    </h2>
                                    {!isLogin && memberGender && memberStatus && (
                                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10">
                                                {memberGender === 'homem' ? '👨 Homem' : '👩 Mulher'}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10">
                                                {memberStatus === 'single' ? '💗 Single' : '👥 Casal'}
                                            </span>
                                            <button
                                                onClick={() => { setStep('onboarding'); setOnboardingPhase('gender'); }}
                                                className="text-[9px] text-gray-500 hover:text-white underline uppercase tracking-widest"
                                            >
                                                Alterar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Google OAuth */}
                                <button onClick={handleGoogleLogin} disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold text-sm py-3 rounded-xl hover:bg-gray-100 transition-all mb-4">
                                    <svg width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continuar com Google
                                </button>

                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex-1 h-px bg-white/10"></div>
                                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">ou use e-mail</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>

                                <form onSubmit={handleEmailAuth} className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            placeholder="E-mail"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50" />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Senha"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50" />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                            <p className="text-[10px] text-red-400">{error}</p>
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading}
                                        className="w-full btn-primary py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                                        {isLogin ? 'Entrar' : 'Cadastrar'}
                                    </button>
                                </form>

                                <p className="text-center text-xs text-gray-500 mt-6">
                                    {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
                                    <button onClick={toggleAuthMode} className="text-primary hover:text-primary-light font-bold transition-colors">
                                        {isLogin ? 'Cadastre-se' : 'Entrar'}
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
