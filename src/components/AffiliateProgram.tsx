import React from 'react';
import {
    TrendingUp,
    Link as LinkIcon,
    Share2,
    DollarSign,
    CheckCircle2,
    ShieldCheck,
    Plus
} from 'lucide-react';

interface AmbassadorProgramProps {
    onLoginClick: () => void;
}

export const AmbassadorProgram: React.FC<AmbassadorProgramProps> = ({ onLoginClick }) => {
    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-[#e2b0a2] selection:text-navy">
            {/* Header / Logo Area */}
            <header className="py-8 px-6 border-b border-white/5 bg-navy/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center rotate-3 border border-primary/30 cursor-pointer"
                            onClick={() => window.location.href = '/'}
                        >
                            <Plus className="text-primary transform -rotate-3" size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-widest uppercase flex flex-col leading-tight cursor-pointer" onClick={() => window.location.href = '/'}>
                            <span>The</span>
                            <span className="text-primary">Secretclub</span>
                        </h1>
                    </div>
                    <button onClick={onLoginClick} className="px-6 py-2 bg-primary text-navy font-bold rounded-full text-sm hover:scale-105 transition-all shadow-[0_0_15px_rgba(226,176,162,0.3)]">
                        Login / Cadastro
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-primary rounded-full blur-[150px]"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 uppercase tracking-widest">
                        <TrendingUp size={16} />
                        PROGRAMA DE EMBAIXADORES OFICIAL
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight uppercase tracking-tighter">
                        Indique e Ganhe <span className="text-primary italic underline underline-offset-8">como Embaixador</span>
                    </h2>
                    <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Ganhe <strong className="text-white">20% de comissão VITÁLICIA</strong> sobre todos os planos e destaques comprados pelos membros que você indicar para o TheSecretclub.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={onLoginClick} className="px-10 py-5 bg-primary text-navy font-black text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(226,176,162,0.4)] hover:bg-white flex items-center justify-center gap-2">
                            Quero Ser Embaixador <LinkIcon size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Steps / How it works */}
            <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Como Funciona?</h3>
                        <p className="text-gray-500 text-sm uppercase tracking-widest">3 passos simples para começar a lucrar</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

                        {/* Step 1 */}
                        <div className="relative p-8 rounded-3xl bg-navy border border-white/5 text-center flex flex-col items-center hover:border-primary/30 transition-all z-10 group">
                            <div className="w-20 h-20 bg-primary border-4 border-[#0a0a0b] rounded-full flex items-center justify-center text-navy font-black text-2xl mb-6 shadow-xl group-hover:scale-110 transition-transform">
                                1
                            </div>
                            <h4 className="text-xl font-bold mb-3 uppercase tracking-widest">Cadastre-se</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Crie sua conta gratuitamente no TheSecretclub. No seu painel (Dashboard), acesse a aba "Embaixadores" para pegar seu Link Exclusivo.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative p-8 rounded-3xl bg-navy border border-white/5 text-center flex flex-col items-center hover:border-primary/30 transition-all z-10 group">
                            <div className="w-20 h-20 bg-primary border-4 border-[#0a0a0b] rounded-full flex items-center justify-center text-navy font-black text-2xl mb-6 shadow-xl group-hover:scale-110 transition-transform">
                                2
                            </div>
                            <h4 className="text-xl font-bold mb-3 uppercase tracking-widest">Compartilhe</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Envie seu link para amigos e conhecidos ou divulgue em suas redes sociais e grupos. Quanto mais divulgar, maior a chance de ganhar.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative p-8 rounded-3xl bg-navy border border-white/5 text-center flex flex-col items-center hover:border-primary/30 transition-all z-10 group">
                            <div className="w-20 h-20 bg-primary border-4 border-[#0a0a0b] rounded-full flex items-center justify-center text-navy font-black text-2xl mb-6 shadow-xl group-hover:scale-110 transition-transform">
                                3
                            </div>
                            <h4 className="text-xl font-bold mb-3 uppercase tracking-widest">Receba PIX</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Ganhe 20% toda vez que uma indicada sua assinar ou renovar um plano premium. Saque suas comissões direto para o seu PIX.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits detailed */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
                    <div className="flex-1 w-full bg-gradient-to-br from-primary/10 to-transparent p-12 rounded-[40px] border border-primary/20 relative overflow-hidden">
                        <DollarSign className="absolute -right-10 -bottom-10 text-primary/10 w-64 h-64" />
                        <h2 className="text-4xl font-black mb-6 italic uppercase tracking-tighter text-white relative z-10">Lucro <span className="text-primary">Recorrente</span></h2>
                        <p className="text-lg text-gray-300 mb-6 relative z-10 leading-relaxed font-light">
                            Nossa comissão não é paga apenas na primeira venda. Você ganha <strong className="text-white font-bold">20% todos os meses</strong> em que sua indicada mantiver uma assinatura ativa no site.
                        </p>
                        <ul className="space-y-4 relative z-10">
                            {[
                                "Acompanhamento transparente pelo painel",
                                "Saque mínimo flexível via PIX",
                                "Sem limite de indicações",
                                "Válido para renovações vitalícias"
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 items-center">
                                    <CheckCircle2 className="text-primary shrink-0" size={20} />
                                    <span className="text-white font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex-1">
                        <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">Regras <span className="text-gray-500 italic">Básicas</span></h2>
                        <div className="space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/10 text-gray-400">
                                    <Share2 size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">Apenas Novos Cadastros</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed font-light">
                                        A comissão é válida apenas para membros que se cadastrarem pela primeira vez utilizando o seu link exclusivo.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/10 text-gray-400">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">Pagamentos Confirmados</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed font-light">
                                        As comissões ficam disponíveis no seu saldo assim que o pagamento da indicada é confirmado (PIX na hora, Cartão após aprovação).
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/10 text-gray-400">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">Saques Descomplicados</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed font-light">
                                        Basta ter uma chave PIX idêntica ao seu CPF cadastrado. Os pagamentos das comissões são processados em até 48 horas úteis após a solicitação.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-24 px-6 text-center border-t border-white/5 bg-gradient-to-t from-primary/5 to-transparent">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tighter">Pronta para começar?</h2>
                    <p className="text-gray-400 mb-10 text-lg font-light">Junte-se ao nosso programa de embaixador e comece a monetizar seus contatos hoje mesmo.</p>
                    <button onClick={onLoginClick} className="px-12 py-5 bg-white text-navy font-black text-sm uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        Pegar Meu Link de Embaixador
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 text-center bg-black">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center rotate-3 border border-primary/30">
                            <Plus className="text-primary transform -rotate-3" size={16} />
                        </div>
                        <p className="text-sm font-bold tracking-[0.2em] uppercase text-white">The <span className="text-primary">Secretclub</span></p>
                    </div>
                    <p className="text-[10px] text-gray-600 max-w-sm uppercase tracking-widest leading-loose">
                        © 2026 TheSecretclub.
                        Termos aplicáveis ao programa de embaixadores na plataforma.
                    </p>
                </div>
            </footer>
        </div>
    );
};
