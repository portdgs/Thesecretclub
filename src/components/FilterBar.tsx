import React from 'react';
import { Filter } from 'lucide-react';

interface FilterBarProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange }) => {
    const filters = ['Novidades', 'Verificados', 'Luxo+', 'Com Vídeo'];

    return (
        <div className="bg-navy pt-6 pb-2 sticky top-[80px] z-40">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex-shrink-0 flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 text-gray-500 hidden sm:flex">
                        <Filter size={16} />
                    </div>

                    {filters.map((label) => (
                        <button
                            key={label}
                            onClick={() => onFilterChange(label)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${activeFilter === label
                                ? 'bg-primary text-navy border-primary shadow-[0_0_15px_rgba(226,176,162,0.4)]'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
