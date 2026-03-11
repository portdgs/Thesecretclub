import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';
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
    city,
    neighborhood,
    isVerified,
    imageUrl,
    isBoosted,
    distance,
    onClick
}) => {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ y: -8 }}
            className="relative group rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 bg-white flex flex-col h-full"
        >
            {/* Image Section */}
            <div className="relative aspect-[4/5] overflow-hidden">
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Affinity Pill (Sexlog style) */}
                <div className="absolute bottom-3 left-3 bg-pink px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <span className="text-white text-[9px] font-black uppercase tracking-tighter">
                        {Math.floor(Math.random() * (98 - 60 + 1)) + 60}% de afinidade
                    </span>
                </div>

                {/* Status Online */}
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/90">Online</span>
                </div>

                {/* Action Buttons Overlay (Sexlog style) */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {isVerified && (
                        <div className="w-8 h-8 rounded-full bg-pink/90 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-xl">
                            <ShieldCheck size={16} />
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section (Light background like Sexlog) */}
            <div className="p-4 flex flex-col gap-1 bg-white">
                <h3 className="font-black text-lg text-gray-900 tracking-tight leading-none truncate">
                    {name.toLowerCase()}, {age}
                </h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter truncate">
                    {isBoosted ? 'Perfil em Destaque' : 'Membro do Clube'}
                </p>
                <div className="flex items-center gap-1 text-gray-400 text-[10px] font-medium tracking-tight mt-1">
                    <MapPin size={10} className="text-gray-400" />
                    <span className="truncate">{distance !== undefined ? `${distance.toFixed(1)}km` : neighborhood} • {city}</span>
                </div>
            </div>
        </motion.div>
    );
};
