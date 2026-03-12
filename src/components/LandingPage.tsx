import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, KeyRound, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
    onLoginClick: () => void;
    onInviteValidated: (code: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onInviteValidated }) => {
    const [showInvite, setShowInvite] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [autoValidating, setAutoValidating] = useState(false);

    // Auto-detect token from URL params (from ambassador link)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        const refFromUrl = params.get('ref');

        // Store referral ID if present
        if (refFromUrl) {
            localStorage.setItem('referralId', refFromUrl);
        }

        if (tokenFromUrl) {
            setInviteCode(tokenFromUrl);
            setShowInvite(true);
            setAutoValidating(true);
            // Auto-validate the token
            (async () => {
                try {
                    const trimmedCode = tokenFromUrl.trim().toLowerCase();
                    const { data, error: queryError } = await supabase
                        .from('generated_invites')
                        .select('id, is_used, invited_email')
                        .eq('final_token', trimmedCode)
                        .single();

                    if (queryError || !data) {
                        setError('Código de convite inválido ou não encontrado.');
                        setAutoValidating(false);
                        return;
                    }

                    if (data.is_used) {
                        setError('Este código já foi utilizado.');
                        setAutoValidating(false);
                        return;
                    }

                    setSuccess(true);
                    localStorage.setItem('pendingInviteCode', trimmedCode);

                    // Clean the URL params
                    window.history.replaceState({}, '', window.location.pathname);

                    setTimeout(() => {
                        onInviteValidated(trimmedCode);
                    }, 1500);
                } catch {
                    setError('Erro ao validar convite.');
                    setAutoValidating(false);
                }
            })();
        }
    }, []);

    const handleInviteSubmit = async () => {
        if (!inviteCode.trim()) {
            setError('Digite seu código de convite.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check if invite token exists in generated_invites table
            const trimmedCode = inviteCode.trim().toLowerCase();
            const { data, error: queryError } = await supabase
                .from('generated_invites')
                .select('id, is_used, invited_email')
                .eq('final_token', trimmedCode)
                .single();

            if (queryError || !data) {
                setError('Código de convite inválido ou não encontrado.');
                return;
            }

            if (data.is_used) {
                setError('Este código já foi utilizado.');
                return;
            }

            // Store valid invite code for use during registration
            setSuccess(true);
            localStorage.setItem('pendingInviteCode', trimmedCode);

            setTimeout(() => {
                onInviteValidated(trimmedCode);
            }, 1200);

        } catch {
            setError('Erro ao validar convite. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy relative overflow-hidden flex items-center justify-center">
            {/* Animated background layers */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(226,176,162,0.08)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(226,176,162,0.05)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(226,176,162,0.03)_0%,transparent_40%)]" />
            </div>

            {/* Floating orbs */}
            <motion.div
                animate={{
                    y: [-20, 20, -20],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 left-1/6 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
            />
            <motion.div
                animate={{
                    y: [20, -30, 20],
                    opacity: [0.2, 0.5, 0.2],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute bottom-1/4 right-1/6 w-96 h-96 rounded-full bg-primary/3 blur-3xl"
            />

            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(226,176,162,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(226,176,162,0.3) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Main content */}
            <div className="relative z-10 w-full max-w-lg mx-auto px-6 text-center">
                {/* Logo / Brand */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="mb-12"
                >
                    {/* Decorative line */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.2, delay: 0.3 }}
                        className="w-16 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-8"
                    />

                    {/* Brand name */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-3">
                        <span className="text-white">THE</span>
                        <span className="text-primary landing-text-glow">SECRET</span>
                        <span className="text-white">CLUB</span>
                    </h1>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-gray-500 font-bold"
                    >
                        Acesso exclusivo por convite
                    </motion.p>

                    {/* Decorative line */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                        className="w-16 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-8"
                    />
                </motion.div>

                {/* Action buttons / Invite form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="space-y-4"
                >
                    <AnimatePresence mode="wait">
                        {!showInvite ? (
                            <motion.div
                                key="buttons"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {/* Login Button */}
                                <button
                                    onClick={onLoginClick}
                                    className="w-full group relative overflow-hidden bg-primary text-navy py-4 rounded-sm font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 hover:bg-white hover:shadow-[0_0_40px_rgba(226,176,162,0.3)] active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        <Lock size={14} />
                                        Entrar
                                    </span>
                                </button>

                                {/* Invite Button */}
                                <button
                                    onClick={() => setShowInvite(true)}
                                    className="w-full group relative overflow-hidden bg-transparent border border-white/10 text-white py-4 rounded-sm font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        <KeyRound size={14} className="text-primary" />
                                        Tenho um convite
                                    </span>
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="invite"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="bg-navy-dark border border-white/10 rounded-sm p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles size={16} className="text-primary" />
                                        <h3 className="text-sm font-black uppercase tracking-wide text-white">
                                            Código de Convite
                                        </h3>
                                    </div>

                                    <div className="relative mb-4">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => {
                                                setInviteCode(e.target.value);
                                                setError(null);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                                            placeholder={autoValidating ? "Validando convite automático..." : "Cole seu token de acesso aqui"}
                                            disabled={success || autoValidating}
                                            className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 tracking-widest font-mono transition-all disabled:opacity-50"
                                        />
                                    </div>

                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-sm mb-4"
                                            >
                                                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                                <p className="text-[10px] text-red-400">{error}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Success */}
                                    <AnimatePresence>
                                        {success && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-sm mb-4"
                                            >
                                                <Sparkles size={14} className="text-green-400 flex-shrink-0" />
                                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">
                                                    Convite válido! Redirecionando...
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        onClick={handleInviteSubmit}
                                        disabled={loading || success || autoValidating}
                                        className="w-full bg-primary text-navy py-3 rounded-sm font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading || autoValidating ? (
                                            <Loader2 className="animate-spin" size={14} />
                                        ) : success ? (
                                            <Sparkles size={14} />
                                        ) : (
                                            <ArrowRight size={14} />
                                        )}
                                        {loading || autoValidating ? 'Validando...' : success ? 'Validado!' : 'Validar Convite'}
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowInvite(false);
                                        setInviteCode('');
                                        setError(null);
                                        setSuccess(false);
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
                                >
                                    ← Voltar
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Footer tagline */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="mt-16"
                >
                    <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 font-bold">
                        Privacidade <span className="text-primary/60">•</span> Luxo <span className="text-primary/60">•</span> Exclusividade
                    </p>
                </motion.div>
            </div>
        </div>
    );
};
