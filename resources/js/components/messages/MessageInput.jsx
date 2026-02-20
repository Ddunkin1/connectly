import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSendMessage } from '../../hooks/useMessages';

const MessageInput = ({ conversationId, receiverId, onMessageSent }) => {
    const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { message: '' } });
    const sendMessageMutation = useSendMessage();
    const message = watch('message', '');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const fileInputRef = useRef(null);

    const canSend = message.trim() || mediaFile;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return;
        }
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isVideo && !isImage) return;
        setMediaFile(file);
        if (isImage) {
            const reader = new FileReader();
            reader.onloadend = () => setMediaPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const removeMedia = () => {
        if (mediaPreview && mediaFile?.type.startsWith('video/')) {
            URL.revokeObjectURL(mediaPreview);
        }
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = async (data) => {
        if (!canSend) return;

        try {
            const formData = new FormData();
            formData.append('receiver_id', receiverId);
            formData.append('message', (data.message || '').trim());
            if (mediaFile) formData.append('media', mediaFile);

            await sendMessageMutation.mutateAsync(formData);
            reset();
            removeMedia();
            if (onMessageSent) onMessageSent();
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <div className="px-4 py-3 bg-[#1A1A1A] border-t border-[#3A3A3A]">
            <form onSubmit={handleSubmit(onSubmit)}>
                {mediaPreview && (
                    <div className="mb-3 relative inline-block rounded-xl overflow-hidden border border-[#3A3A3A]">
                        {mediaFile?.type.startsWith('video/') ? (
                            <video src={mediaPreview} controls className="rounded-lg max-h-28" />
                        ) : (
                            <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-28 object-cover" />
                        )}
                        <button type="button" onClick={removeMedia} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors backdrop-blur-sm" aria-label="Remove media">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                )}
                <div className="bg-[#2C2C2C] rounded-2xl px-3 py-2 flex items-center gap-2 border border-[#3A3A3A] focus-within:border-[#4A4A4A] transition-colors duration-200">
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252525] transition-all shrink-0" aria-label="Attach">
                        <span className="material-symbols-outlined text-xl">add</span>
                    </button>
                    <input {...register('message')} placeholder="Type a message..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-white placeholder:text-slate-500 min-w-0" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(onSubmit)(); } }} />
                    <button type="button" className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252525] transition-all shrink-0" aria-label="Emoji">
                        <span className="material-symbols-outlined text-xl">sentiment_satisfied_alt</span>
                    </button>
                    <button type="submit" disabled={!canSend || sendMessageMutation.isPending} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:opacity-90 active:scale-95 disabled:hover:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0" aria-label="Send">
                        {sendMessageMutation.isPending ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span> : <span className="material-symbols-outlined text-xl">send</span>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MessageInput;
