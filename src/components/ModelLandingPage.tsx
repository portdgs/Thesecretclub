import React, { useState } from 'react';
import {
    ShieldCheck,
    Lock,
    CheckCircle2,
    Camera,
    Send,
    Smartphone,
    Users,
    Award,
    Plus
} from 'lucide-react';

export const ModelLandingPage: React.FC = () => {
    const [formData, setFormData] = useState({
        nome: '',
        idade: '',
        cidade: '',
        instagram: '',
        whatsapp: '',
        mensagem: ''
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui seria a integração com sua API ou WhatsApp
        console.log('Dados enviados:', formData);
        setSubmitted(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-[#e2b0a2] selection:text-navy">
            {/* Header / Logo Area */}
            <header className="py-8 px-6 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 bg-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center rotate-3 border border-primary/30 cursor-pointer"
                            onClick={() => window.location.href = '/'}
                        >
                            <Plus className="text-primary transform -rotate-3" size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-widest uppercase flex flex-col leading-tight cursor-pointer" onClick={() => window.location.href = '/'}>
                            <span>Clube</span>
                            <span className="text-primary">Privado</span>
                        </h1>
                    </div>
                    <a href="#form" className="hidden md:block px-6 py-2 border border-white/20 rounded-full text-sm hover:bg-white hover:text-black transition-all">
                        Candidatar-me
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary rounded-full blur-[160px]"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-8">
                        <Award size={14} />
                        CONVITE EXCLUSIVO PARA MODELOS DE ELITE
                    </div>
                    <h2 className="text-4xl md:text-6xl font-serif font-medium mb-8 leading-tight">
                        Faça parte do <span className="italic text-primary">marketplace</span> mais exclusivo do Brasil
                    </h2>
                    <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        O Clube Privado conecta as modelos mais sofisticadas do país a um público selecionado, garantindo privacidade absoluta e rentabilidade superior.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="#form" className="px-10 py-4 bg-primary text-navy font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(226,176,162,0.3)]">
                            Quero ser Modelo
                        </a>
                        <a href="#beneficios" className="px-10 py-4 bg-white/5 border border-white/10 font-bold rounded-full hover:bg-white/10 transition-colors">
                            Saiba Mais
                        </a>
                    </div>
                </div>
            </section>

            {/* Benefícios */}
            <section id="beneficios" className="py-24 px-6 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-4 italic uppercase tracking-widest text-primary">Privacidade Total</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Controlamos rigorosamente quem acessa seu perfil. Ferramentas avançadas para proteger sua identidade e imagens.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-4 italic uppercase tracking-widest text-primary">Audiência Qualificada</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Nosso público é composto pela alta elite empresarial e corporativa. Menos tempo com curiosos, mais tempo com clientes reais.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl border border-white/5 bg-white/5 hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                                <Smartphone size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-4 italic uppercase tracking-widest text-primary">Gestão Inteligente</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Plataforma otimizada para dispositivos móveis com suporte 24/7 para auxiliar sua jornada e segurança.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Requisitos */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1">
                        <h2 className="text-3xl font-serif font-medium mb-8">Padrão de Qualidade <span className="text-primary">Clube Privado</span></h2>
                        <div className="space-y-6">
                            {[
                                "Ensaios fotográficos de alta qualidade",
                                "Educação, pontualidade e discrição",
                                "Perfil verificado pessoalmente",
                                "Atendimento exclusivo e cordial"
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <CheckCircle2 className="text-primary shrink-0 mt-1" size={20} />
                                    <span className="text-gray-300 text-lg font-light">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 w-full bg-gradient-to-br from-primary/10 to-transparent p-12 rounded-[40px] border border-white/5 text-center">
                        <Camera className="mx-auto text-primary mb-6" size={48} />
                        <p className="text-xl font-medium mb-4 italic">Ainda não tem fotos profissionais?</p>
                        <p className="text-gray-400 font-light">Nossa equipe de marketing auxilia as modelos selecionadas com estúdios parceiros de alto nível.</p>
                    </div>
                </div>
            </section>

            {/* Formulário */}
            <section id="form" className="py-24 px-6 mb-20">
                <div className="max-w-2xl mx-auto bg-white/[0.03] border border-white/10 rounded-[40px] p-8 md:p-12 relative shadow-2xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-serif mb-4 italic text-primary">Inicie sua Carreira</h2>
                        <p className="text-gray-400 font-light">Preencha os campos abaixo. Entraremos em contato para agendar uma entrevista discreta.</p>
                    </div>

                    {submitted ? (
                        <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                                <Send size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 uppercase tracking-wider">Candidatura Recebida</h3>
                            <p className="text-gray-400">Verificamos seu perfil e retornaremos via WhatsApp em até 24h.</p>
                            <button onClick={() => setSubmitted(false)} className="mt-8 text-primary underline underline-offset-4 decoration-1 block mx-auto">
                                Enviar outra candidatura
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="mt-8 w-full py-4 bg-primary text-navy font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-white transition-all shadow-xl max-w-xs mx-auto flex items-center justify-center gap-2"
                            >
                                Ir para a Página Principal
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500 ml-1">Nome Artístico</label>
                                    <input
                                        required
                                        type="text"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleChange}
                                        placeholder="Como deseja ser chamada"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500 ml-1">Idade</label>
                                    <input
                                        required
                                        type="number"
                                        name="idade"
                                        value={formData.idade}
                                        onChange={handleChange}
                                        placeholder="Mínimo 18 anos"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 ml-1">Cidade Principal</label>
                                <input
                                    required
                                    type="text"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    placeholder="Ex: São Paulo, Rio de Janeiro..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 ml-1">Instagram (Opcional)</label>
                                <input
                                    type="text"
                                    name="instagram"
                                    value={formData.instagram}
                                    onChange={handleChange}
                                    placeholder="@seuusuario"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 ml-1">WhatsApp de Contato</label>
                                <input
                                    required
                                    type="tel"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    placeholder="(00) 00000-0000"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary/50 focus:outline-none transition-all font-mono placeholder:text-gray-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-500 ml-1">Sobre Você</label>
                                <textarea
                                    name="mensagem"
                                    value={formData.mensagem}
                                    onChange={handleChange}
                                    placeholder="Conte um pouco sobre sua experiência..."
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary/50 focus:outline-none transition-all resize-none placeholder:text-gray-600"
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full py-5 bg-primary text-navy font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-3 shadow-xl">
                                <Send size={18} />
                                Enviar Candidatura
                            </button>

                            <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-2 mt-4">
                                <ShieldCheck size={14} className="text-primary" />
                                Seus dados são protegidos por criptografia e jamais compartilhados.
                            </p>
                        </form>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 text-center bg-black">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 backdrop-blur-sm rounded-lg flex items-center justify-center rotate-3 border border-primary/30">
                            <Plus className="text-primary transform -rotate-3" size={16} />
                        </div>
                        <p className="text-sm font-bold tracking-[0.2em] uppercase text-white">Clube <span className="text-primary">Privado</span></p>
                    </div>
                    <p className="text-[10px] text-gray-600 max-w-sm uppercase tracking-widest leading-loose">
                        © 2026 Clube Privado Marketplace de Luxo. <br /> Todos os direitos reservados.
                        Proibida a entrada para menores de 18 anos.
                    </p>
                </div>
            </footer>
        </div>
    );
};
