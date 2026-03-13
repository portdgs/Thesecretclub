import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, Share2, MoreHorizontal, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Post {
    id: string;
    user_id: string;
    content: string | null;
    media_url: string | null;
    media_type: 'image' | 'video' | null;
    created_at: string;
    author: {
        id: string;
        name: string;
        avatar_url: string | null;
        profile_type: string | null;
    };
    likes_count: number;
    has_liked: boolean;
}

interface PostCardProps {
    post: Post;
    currentUserId: string;
    onLikeToggle: (postId: string, newHasLiked: boolean, newCount: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onLikeToggle }) => {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    // Formatar timestamp
    const timeAgo = (dateStr: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "a";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "m";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "min";
        return Math.floor(seconds) + "s";
    };

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);

        const newHasLiked = !post.has_liked;
        const newCount = newHasLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1);

        // Optimistic UI Update
        onLikeToggle(post.id, newHasLiked, newCount);

        try {
            if (newHasLiked) {
                await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId });
            } else {
                await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUserId });
            }
        } catch (error) {
            console.error('Erro ao curtir:', error);
            // Revert on error
            onLikeToggle(post.id, post.has_liked, post.likes_count);
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <div className="bg-navy-light border border-white/5 rounded-sm p-4 shadow-2xl mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                        {post.author.avatar_url ? (
                            <img src={post.author.avatar_url} alt={post.author.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-full h-full p-2 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-sm text-white leading-tight flex items-center gap-2">
                            {post.author.name}
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                            <span className="uppercase tracking-widest text-primary">
                                {(post.author.profile_type?.toLowerCase() === 'acompanhante' || !post.author.profile_type) ? 'Membro' : post.author.profile_type}
                            </span>
                            <span>•</span>
                            <span>{timeAgo(post.created_at)}</span>
                        </div>
                    </div>
                </div>

                <button className="text-gray-500 hover:text-white transition-colors p-2">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            {/* Content Text */}
            {post.content && (
                <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
            )}

            {/* Media */}
            {post.media_url && post.media_type === 'image' && (
                <div
                    className="w-full rounded-sm overflow-hidden bg-black cursor-pointer aspect-auto max-h-[500px] relative group"
                    onClick={() => setIsLightboxOpen(true)}
                >
                    <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 uppercase text-[10px] tracking-widest font-bold">Ampliar</span>
                    </div>
                </div>
            )}

            {post.media_url && post.media_type === 'video' && (
                <div className="w-full rounded-sm overflow-hidden bg-black max-h-[500px]">
                    <video src={post.media_url} controls className="w-full h-full object-contain max-h-[500px]" />
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6">
                <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-2 text-xs font-bold transition-colors ${post.has_liked ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                >
                    <Heart size={18} className={post.has_liked ? "fill-primary" : ""} />
                    <span>{post.likes_count}</span>
                </button>

                <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors disabled:opacity-50">
                    <MessageCircle size={18} />
                    <span>0</span>
                </button>

                <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors ml-auto">
                    <Share2 size={16} />
                </button>
            </div>

            {/* Lightbox for Images */}
            <AnimatePresence>
                {isLightboxOpen && post.media_type === 'image' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-xl p-4 md:p-12"
                    >
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 bg-white/5 rounded-full"
                        >
                            <X size={24} />
                        </button>

                        <img
                            src={post.media_url!}
                            alt="Post lightbox"
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
