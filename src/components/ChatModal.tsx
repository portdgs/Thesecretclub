import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    targetUserId?: string; // If provided, start/open chat with this user
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, currentUserId, targetUserId }) => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
            if (targetUserId) {
                startConversation(targetUserId);
            }
        }
    }, [isOpen, targetUserId]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);

            // Subscribe to real-time messages
            const channel = supabase
                .channel(`convo-${selectedConversation.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${selectedConversation.id}`
                    },
                    (payload: any) => {
                        setMessages((current) => [...current, payload.new]);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedConversation]);

    useEffect(scrollToBottom, [messages]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    p1:profiles!participant_1 (id, name, avatar_url),
                    p2:profiles!participant_2 (id, name, avatar_url)
                `)
                .or(`participant_1.eq.${currentUserId},participant_2.eq.${currentUserId}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;
            setConversations(data || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (convoId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', convoId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const startConversation = async (otherId: string) => {
        if (currentUserId === otherId) return;

        try {
            // Check if exists
            const p1 = currentUserId < otherId ? currentUserId : otherId;
            const p2 = currentUserId < otherId ? otherId : currentUserId;

            const { data: existing } = await supabase
                .from('conversations')
                .select('*')
                .eq('participant_1', p1)
                .eq('participant_2', p2)
                .single();

            if (existing) {
                setSelectedConversation(existing);
                return;
            }

            // Create new
            const { data: created, error: createError } = await supabase
                .from('conversations')
                .insert({ participant_1: p1, participant_2: p2 })
                .select()
                .single();

            if (createError) throw createError;
            setSelectedConversation(created);
            fetchConversations();
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || sending) return;

        try {
            setSending(true);
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: currentUserId,
                    content: newMessage.trim()
                });

            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-4xl h-[80vh] bg-navy-light rounded-xl border border-white/10 shadow-2xl flex overflow-hidden ml-0 md:ml-20"
            >
                {/* Conversations Sidebar */}
                <div className="w-1/3 border-r border-white/5 flex flex-col hidden md:flex">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare size={14} className="text-primary" />
                            Mensagens
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {loading && conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 opacity-20">
                                <Loader2 size={30} className="animate-spin" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 opacity-20 text-center p-4">
                                <MessageSquare size={30} className="mb-2" />
                                <p className="text-[10px] uppercase font-black uppercase tracking-tighter">Nenhuma conversa encontrada</p>
                            </div>
                        ) : (
                            conversations.map((convo) => {
                                const otherParticipant = convo.participant_1 === currentUserId ? convo.p2 : convo.p1;
                                return (
                                    <button
                                        key={convo.id}
                                        onClick={() => setSelectedConversation(convo)}
                                        className={`w-full p-4 flex items-center gap-3 transition-all hover:bg-white/5 text-left border-b border-white/5 ${selectedConversation?.id === convo.id ? 'bg-primary/10 border-r-2 border-r-primary' : ''}`}
                                    >
                                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
                                            <img
                                                src={otherParticipant?.avatar_url || `https://ui-avatars.com/api/?name=${otherParticipant?.name || 'User'}&background=random`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-bold text-sm truncate">{otherParticipant?.name || 'Membro'}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 truncate">{convo.last_message_text || 'Inicie uma conversa...'}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Message Window */}
                <div className="flex-1 flex flex-col bg-navy">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-navy-light">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
                                        <img
                                            src={(selectedConversation.participant_1 === currentUserId ? selectedConversation.p2 : selectedConversation.p1)?.avatar_url || "https://ui-avatars.com/api/?name=User&background=random"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold">{(selectedConversation.participant_1 === currentUserId ? selectedConversation.p2 : selectedConversation.p1)?.name || 'Membro'}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-[9px] text-gray-400 uppercase font-black">Online agora</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide">
                                {messages.map((msg, i) => {
                                    const isFromMe = msg.sender_id === currentUserId;
                                    return (
                                        <div
                                            key={msg.id || i}
                                            className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isFromMe
                                                ? 'bg-primary text-navy rounded-tr-sm'
                                                : 'bg-navy-light text-white rounded-tl-sm border border-white/5'}`}
                                            >
                                                <p>{msg.content}</p>
                                                <span className={`text-[8px] mt-1 block opacity-50 ${isFromMe ? 'text-navy' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={sendMessage} className="p-6 bg-navy-light border-t border-white/5 flex gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escreva sua mensagem..."
                                    className="flex-1 bg-navy border border-white/5 rounded-sm p-4 text-sm outline-none focus:border-primary/50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className="btn-primary w-12 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:grayscale transition-all"
                                >
                                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-navy/50">
                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare size={40} className="text-primary opacity-30" />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">TheSecret Chat</h3>
                            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest max-w-xs">A plataforma de encontros exclusiva com mensagens criptografadas e seguras.</p>
                            <div className="mt-12 md:hidden">
                                <button onClick={onClose} className="text-primary font-black uppercase text-[10px] tracking-widest underline">Voltar para a Lista</button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
