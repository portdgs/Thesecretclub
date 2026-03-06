import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Scale, X } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'age_verification' | 'terms_of_use';
    onAccept?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type, onAccept }) => {
    const [hasReadToBottom, setHasReadToBottom] = useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setHasReadToBottom(true);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 backdrop-blur-md"
                />

                {/* Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-navy-light border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-sm shadow-2xl"
                >
                    {type === 'terms_of_use' && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
                        >
                            <X size={20} />
                        </button>
                    )}

                    <div className="p-8 overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
                        {type === 'age_verification' ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 animate-pulse">
                                        <span className="text-3xl font-black text-primary italic">18+</span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Aviso de Conteúdo Adulto</h2>

                                <div className="space-y-4 text-gray-400 text-sm leading-relaxed text-left bg-black/20 p-6 rounded-sm border border-white/5">
                                    <p>
                                        <strong className="text-white">ESTE SITE É UM CLASSIFICADO DE SERVIÇOS ONLINE.</strong> O Clube Privado atua exclusivamente como plataforma de publicidade e divulgação para anunciantes independentes.
                                    </p>
                                    <p>
                                        <AlertTriangle className="inline-block text-yellow-500 mr-2" size={16} />
                                        Declaramos expressamente que não temos qualquer relação com a exploração sexual de terceiros (cafetinagem) ou facilitação de prostituição. Cada anunciante é inteiramente responsável por sua própria agenda e conduta.
                                    </p>
                                    <p>
                                        Ao entrar, você confirma que:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-2">
                                        <li>Possui <span className="text-white font-bold">18 anos de idade</span> ou mais.</li>
                                        <li>Concorda que o acesso a este conteúdo é legal em sua jurisdição.</li>
                                        <li>Não utilizará o site para fins ilícitos.</li>
                                    </ul>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => window.location.href = 'https://www.google.com'}
                                        className="py-4 border border-white/10 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-colors"
                                    >
                                        Sair / Sou Menor
                                    </button>
                                    <button
                                        onClick={onAccept}
                                        className="py-4 bg-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-primary-light transition-all shadow-lg shadow-primary/20"
                                    >
                                        Entrar no Site
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                                    <Scale className="text-primary" size={32} />
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Termos de Uso</h2>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Última atualização: Março de 2026</p>
                                    </div>
                                </div>

                                <div className="prose prose-invert prose-sm max-w-none text-gray-400 space-y-6">
                                    <section>
                                        <h3 className="text-white uppercase font-black tracking-widest text-xs mb-2">1. Natureza do Serviço</h3>
                                        <p>O CLUBE PRIVADO é uma plataforma digital de classificados destinada à divulgação de serviços artísticos, massagem e entretenimento prestados por anunciantes independentes. Atuamos como meros facilitadores de publicidade, não intervindo na negociação, agendamento ou prestação dos serviços.</p>
                                    </section>

                                    <section>
                                        <h3 className="text-white uppercase font-black tracking-widest text-xs mb-2">2. Proibição de Exploração Sexual</h3>
                                        <p>Em estrita conformidade com os Artigos 228, 229 e 230 do Código Penal Brasileiro, o CLUBE PRIVADO proíbe e combate qualquer forma de exploração sexual, rufianismo ou cafetinagem. Não recebemos comissões sobre serviços prestados e não exercemos controle hierárquico ou gerencial sobre os anunciantes.</p>
                                    </section>

                                    <section>
                                        <h3 className="text-white uppercase font-black tracking-widest text-xs mb-2">3. Restrição de Idade</h3>
                                        <p>O acesso e cadastro são exclusivos para maiores de 18 anos. A falsificação de dados para burlar esta restrição constitui violação grave destes termos e pode acarretar em medidas legais.</p>
                                    </section>

                                    <section>
                                        <h3 className="text-white uppercase font-black tracking-widest text-xs mb-2">4. Responsabilidade do Conteúdo</h3>
                                        <p>Os anunciantes são os únicos e exclusivos responsáveis pela veracidade das informações, fotos e vídeos publicados. O site reserva-se o direito de remover perfis que violem a dignidade humana ou utilizem materiais fraudulentos.</p>
                                    </section>

                                    <section>
                                        <h3 className="text-white uppercase font-black tracking-widest text-xs mb-2">5. Privacidade e Dados</h3>
                                        <p>O CLUBE PRIVADO preza pela LGPD (Lei Geral de Proteção de Dados). Seus dados de navegação são utilizados apenas para melhoria da experiência e nunca são vendidos a terceiros.</p>
                                    </section>
                                </div>

                                {onAccept && (
                                    <div className="pt-8 flex flex-col gap-4">
                                        <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-sm">
                                            <ShieldCheck className="text-primary shrink-0" size={20} />
                                            <p className="text-[10px] text-gray-300 uppercase leading-tight">Ao prosseguir, você declara ter lido e aceitado todos os termos acima descritos.</p>
                                        </div>
                                        <button
                                            onClick={onAccept}
                                            disabled={!hasReadToBottom}
                                            className={`py-4 font-black uppercase tracking-widest text-[10px] transition-all ${hasReadToBottom
                                                ? 'bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20'
                                                : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                                }`}
                                        >
                                            {hasReadToBottom ? 'Concordar e Continuar' : 'Role até o fim para aceitar'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
