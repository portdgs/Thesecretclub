import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PostComposer } from './PostComposer';
import { PostCard, type Post } from './PostCard';
import { Loader2 } from 'lucide-react';

interface FeedProps {
    currentUserId: string;
    profileType?: string | null;
}

const POSTS_PER_PAGE = 10;

export const Feed: React.FC<FeedProps> = ({ currentUserId }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);

    const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchPosts(posts.length);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, posts.length]);

    const fetchPosts = async (offset = 0) => {
        try {
            if (offset === 0) setLoading(true);
            else setLoadingMore(true);

            // Fetch posts
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
                    id, user_id, content, media_url, media_type, created_at,
                    author:profiles!user_id(id, name, avatar_url, profile_type)
                `)
                .order('created_at', { ascending: false })
                .range(offset, offset + POSTS_PER_PAGE - 1);

            if (postsError) throw postsError;

            if (!postsData || postsData.length === 0) {
                setHasMore(false);
                if (offset === 0) setPosts([]);
                return;
            }

            // Fetch likes for these posts
            const postIds = postsData.map((p: any) => p.id);

            // Count total likes
            const { data: likesCountData } = await supabase
                .from('post_likes')
                .select('post_id')
                .in('post_id', postIds);

            const likeCounts = (likesCountData || []).reduce((acc: any, like: any) => {
                acc[like.post_id] = (acc[like.post_id] || 0) + 1;
                return acc;
            }, {});

            // Check if current user liked
            const { data: userLikesData } = await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', currentUserId)
                .in('post_id', postIds);

            const userLikedSet = new Set((userLikesData || []).map((l: any) => l.post_id));

            const formattedPosts: Post[] = postsData.map((p: any) => ({
                id: p.id,
                user_id: p.user_id,
                content: p.content,
                media_url: p.media_url,
                media_type: p.media_type as 'image' | 'video' | null,
                created_at: p.created_at,
                author: Array.isArray(p.author) ? p.author[0] : p.author,
                likes_count: likeCounts[p.id] || 0,
                has_liked: userLikedSet.has(p.id)
            }));

            if (offset === 0) {
                setPosts(formattedPosts);
            } else {
                setPosts(prev => [...prev, ...formattedPosts]);
            }

            setHasMore(postsData.length === POSTS_PER_PAGE);

        } catch (error) {
            console.error('Erro ao buscar posts:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchPosts(0);
    }, []);

    const handlePostCreated = () => {
        fetchPosts(0); // Refresh feed to show new post at top
    };

    const handleLikeToggle = (postId: string, newHasLiked: boolean, newCount: number) => {
        setPosts(prev => prev.map(p =>
            p.id === postId
                ? { ...p, has_liked: newHasLiked, likes_count: newCount }
                : p
        ));
    };

    return (
        <div className="max-w-xl mx-auto w-full">
            <PostComposer userId={currentUserId} onPostCreated={handlePostCreated} />

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-navy-light border border-white/5 rounded-sm p-12 text-center text-gray-500">
                    Nenhuma publicação encontrada. Seja o primeiro a postar!
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post, index) => {
                        if (posts.length === index + 1) {
                            return (
                                <div ref={lastPostElementRef} key={post.id}>
                                    <PostCard
                                        post={post}
                                        currentUserId={currentUserId}
                                        onLikeToggle={handleLikeToggle}
                                    />
                                </div>
                            );
                        } else {
                            return (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={currentUserId}
                                    onLikeToggle={handleLikeToggle}
                                />
                            );
                        }
                    })}

                    {loadingMore && (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                    )}

                    {!hasMore && posts.length > 0 && (
                        <div className="text-center py-6 text-gray-500 text-[10px] uppercase tracking-widest font-black">
                            Você chegou ao fim do feed
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
