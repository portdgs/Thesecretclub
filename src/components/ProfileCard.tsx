import React from 'react';
import { ShieldCheck, MapPin, Star, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileCardProps {
    name: string;
    age: number;
    city: string;
    neighborhood: string;
    price: number;
    rating: number;
    isVerified: boolean;
    imageUrl: string;
    hasVideo?: boolean;
    planTier?: 'free' | 'bronze' | 'silver' | 'gold' | 'platinum';
    whatsapp?: string;
    isBoosted?: boolean;
    distance?: number;
    onWhatsAppClick?: () => void;
    onClick?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ProfileCard: React.FC<ProfileCardProps> = ({
    name,
    age,
    neighborhood,
    rating,
    isVerified,
    imageUrl,
    hasVideo,
    isBoosted,
    distance,
    onClick
}) => {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ y: -8 }}
            className="relative group rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 bg-navy-light aspect-[3/4]"
        >
            {/* Imagem com Efeito de Zoom no Hover */}
            <img
                src={imageUrl}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradiente Overlay (Transparente para Preto 70%) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent transition-opacity duration-500 group-hover:via-black/30 z-10 pointer-events-none" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
                {/* Status Online Pulsante */}
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">Online</span>
                </div>

                {/* Verificação */}
                <div className="flex flex-col items-end gap-2">
                    {isVerified && (
                        <div className="bg-[#e2b0a2]/90 backdrop-blur-sm text-navy flex items-center justify-center w-6 h-6 rounded-full shadow-[0_0_15px_rgba(226,176,162,0.6)]">
                            <ShieldCheck size={14} />
                        </div>
                    )}
                    {isBoosted && (
                        <div className="bg-primary/90 backdrop-blur-sm text-navy flex items-center justify-center px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(226,176,162,0.8)] gap-1">
                            <span className="text-[7px] font-black uppercase tracking-tighter">BOOST</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Informações do Perfil (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20 pointer-events-none flex flex-col justify-end">
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="font-bold text-xl sm:text-2xl text-white tracking-tight leading-none mb-1 drop-shadow-md">
                            {name}, <span className="font-light">{age}</span>
                        </h3>
                        <div className="flex items-center gap-1.5 text-gray-300 text-[10px] sm:text-xs font-medium tracking-wide uppercase mt-2">
                            <MapPin size={12} className="text-primary" />
                            <span>{distance !== undefined ? `a ${distance.toFixed(1)}km de você` : neighborhood}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-primary">
                            <Star size={10} fill="currentColor" />
                            <span className="text-[10px] font-bold text-white">{rating.toFixed(1)}</span>
                        </div>
                        {hasVideo && (
                            <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 flex items-center justify-center">
                                <Camera size={12} className="text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
