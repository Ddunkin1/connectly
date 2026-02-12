import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSendMessage } from '../../hooks/useMessages';
import Button from '../common/Button';

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
        <div className="px-6 py-4 bg-[var(--theme-bg-main)]">
            <form onSubmit={handleSubmit(onSubmit)}>
                {mediaPreview && (
                    <div className="mb-3 relative inline-block">
                        {mediaFile?.type.startsWith('video/') ? (
                            <video src={mediaPreview} controls className="rounded-lg max-h-32" />
                        ) : (
                            <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-32 object-cover" />
                        )}
                        <button type="button" onClick={removeMedia} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600" aria-label="Remove media">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}
                <div className="bg-[var(--theme-surface-hover)] rounded-2xl p-2 flex items-center gap-2 border border-[var(--theme-border)]">
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors shrink-0" aria-label="Attach">
                        <span className="material-symbols-outlined">add_circle_outline</span>
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors shrink-0" aria-label="Image">
                        <span className="material-symbols-outlined">image</span>
                    </button>
                    <input {...register('message')} placeholder="Type a message..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-white placeholder:text-slate-500" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(onSubmit)(); } }} />
                    <button type="button" className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors shrink-0" aria-label="Emoji">
                        <span className="material-symbols-outlined">sentiment_satisfied_alt</span>
                    </button>
                    <button type="submit" disabled={!canSend || sendMessageMutation.isPending} className="bg-primary text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0" aria-label="Send">
                        {sendMessageMutation.isPending ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">send</span>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MessageInput;
