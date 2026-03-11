import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Image as ImageIcon, Video, Send, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostComposerProps {
    userId: string;
    onPostCreated: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ userId, onPostCreated }) => {
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limite de 50MB
        if (file.size > 50 * 1024 * 1024) {
            alert('O arquivo deve ter no máximo 50MB.');
            return;
        }

        const type = file.type.startsWith('video/') ? 'video' : 'image';
        setMediaType(type);
        setMediaFile(file);

        const objectUrl = URL.createObjectURL(file);
        setMediaPreview(objectUrl);
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /**
     * Custom upload function using XMLHttpRequest to track progress
     * since supabase.storage.from('...').upload() does not support progress events natively
     */
    const uploadWithProgress = async (file: File, path: string): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("No session");

                // Get the Supabase URL and Key from the client instance
                const supabaseUrl = (supabase as any).supabaseUrl;
                const supabaseKey = (supabase as any).supabaseKey;

                const xhr = new XMLHttpRequest();
                const uploadUrl = `${supabaseUrl}/storage/v1/object/user-content/${path}`;

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(path);
                    } else {
                        reject(new Error(`Upload failed: ${xhr.statusText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.open('POST', uploadUrl, true);
                xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
                xhr.setRequestHeader('apikey', supabaseKey);
                // Important: set Content-Type so Supabase knows what it is receiving
                xhr.setRequestHeader('Content-Type', file.type);

                // For files, we need to bypass the default payload wrapper 
                // and send the raw file buffer or blob.
                xhr.send(file);
            } catch (error) {
                reject(error);
            }
        });
    };

    const handlePost = async () => {
        if (!content.trim() && !mediaFile) return;

        try {
            setUploading(true);
            setUploadProgress(0);

            let mediaUrl = null;
            let finalMediaType = null;

            if (mediaFile) {
                const fileExt = mediaFile.name.split('.').pop();
                const fileName = `${userId}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

                await uploadWithProgress(mediaFile, fileName);

                const { data: { publicUrl } } = supabase.storage
                    .from('user-content')
                    .getPublicUrl(fileName);

                mediaUrl = publicUrl;
                finalMediaType = mediaType;
            }

            const { error: postError } = await supabase
                .from('posts')
                .insert({
                    user_id: userId,
                    content: content.trim() || null,
                    media_url: mediaUrl,
                    media_type: finalMediaType
                });

            if (postError) throw postError;

            // Limpa o formulário
            setContent('');
            removeMedia();
            onPostCreated();

        } catch (error: any) {
            console.error('Erro ao postar:', error);
            alert('Não foi possível enviar a publicação. Tente novamente.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="bg-navy-light border border-white/5 rounded-sm p-4 shadow-xl mb-6">
            <div className="flex gap-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="O que está acontecendo?"
                    disabled={uploading}
                    className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none min-h-[60px] focus:outline-none"
                    rows={content.split('\n').length > 2 ? 4 : 2}
                />
            </div>

            <AnimatePresence>
                {mediaPreview && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative mt-4 rounded-sm overflow-hidden bg-black max-w-sm"
                    >
                        <button
                            onClick={removeMedia}
                            disabled={uploading}
                            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors z-10 disabled:opacity-50"
                        >
                            <X size={16} />
                        </button>

                        {mediaType === 'video' ? (
                            <video src={mediaPreview} controls className="w-full max-h-64 object-contain" />
                        ) : (
                            <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-cover" />
                        )}

                        {uploading && uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col backdrop-blur-sm">
                                <span className="text-white text-sm font-bold mb-2">{uploadProgress}%</span>
                                <div className="w-3/4 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-primary hover:bg-primary/10 p-2 rounded-sm transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                        title="Adicionar Foto"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="text-primary hover:bg-primary/10 p-2 rounded-sm transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                        title="Adicionar Vídeo"
                    >
                        <Video size={20} />
                    </button>
                </div>

                <button
                    onClick={handlePost}
                    disabled={uploading || (!content.trim() && !mediaFile)}
                    className="btn-primary py-2 px-6 rounded-sm font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            Postar
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
