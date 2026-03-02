import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSendMessage } from '../../hooks/useMessages';
import toast from 'react-hot-toast';

const ALLOWED_MEDIA_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'application/zip',
];
const isAllowedMedia = (file) => {
    const type = (file.type || '').toLowerCase();
    if (ALLOWED_MEDIA_TYPES.includes(type)) return true;
    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    return ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip'].includes(ext);
};

const MessageInput = ({ conversationId, receiverId, onMessageSent }) => {
    const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { message: '' } });
    const sendMessageMutation = useSendMessage();
    const message = watch('message', '');
    const [mediaFiles, setMediaFiles] = useState([]); // { file, preview } for images/videos, { file, preview: null } for docs
    const [attachMenuOpen, setAttachMenuOpen] = useState(false);
    const fileInputRef = useRef(null);
    const attachMenuRef = useRef(null);

    const canSend = message.trim() || mediaFiles.length > 0;

    const openFileDialog = (accept) => {
        setAttachMenuOpen(false);
        if (!fileInputRef.current) return;
        fileInputRef.current.accept = accept;
        fileInputRef.current.multiple = true;
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (!files.length) return;
        const maxSize = 50 * 1024 * 1024; // 50MB
        const entries = [];
        for (const file of files) {
            if (!isAllowedMedia(file)) {
                toast.error(`"${file.name}" is not supported. Use Photo, Video, or File for PDF and documents.`);
                continue;
            }
            if (file.size > maxSize) {
                toast.error(`"${file.name}" is too large. Maximum size is 50MB.`);
                continue;
            }
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');
            entries.push({
                file,
                preview: isImage ? null : isVideo ? URL.createObjectURL(file) : null,
            });
        }
        if (!entries.length) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        const imageIndices = entries.map((e, i) => (e.file.type.startsWith('image/') ? i : -1)).filter((i) => i >= 0);
        if (imageIndices.length === 0) {
            setMediaFiles((prev) => [...prev, ...entries]);
        } else {
            Promise.all(
                imageIndices.map(
                    (i) =>
                        new Promise((resolve) => {
                            const r = new FileReader();
                            r.onloadend = () => resolve({ i, result: r.result });
                            r.readAsDataURL(entries[i].file);
                        })
                )
            ).then((results) => {
                results.forEach(({ i, result }) => {
                    entries[i].preview = result;
                });
                setMediaFiles((prev) => [...prev, ...entries]);
            });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeMedia = (index) => {
        setMediaFiles((prev) => {
            const next = prev.filter((_, i) => i !== index);
            const item = prev[index];
            if (item?.preview && item?.file?.type?.startsWith('video/')) URL.revokeObjectURL(item.preview);
            return next;
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const clearAllMedia = () => {
        mediaFiles.forEach((item) => {
            if (item.preview && item.file?.type?.startsWith('video/')) URL.revokeObjectURL(item.preview);
        });
        setMediaFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = async (data) => {
        if (!canSend) return;

        const text = (data.message || '').trim();
        const filesToSend = mediaFiles.map((x) => x.file);

        try {
            if (text) {
                const formData = new FormData();
                formData.append('receiver_id', receiverId);
                formData.append('message', text);
                await sendMessageMutation.mutateAsync(formData);
                reset();
                if (onMessageSent) onMessageSent();
            }
            for (const file of filesToSend) {
                const formData = new FormData();
                formData.append('receiver_id', receiverId);
                formData.append('message', '');
                formData.append('media', file);
                await sendMessageMutation.mutateAsync(formData);
                if (onMessageSent) onMessageSent();
            }
            reset();
            clearAllMedia();
        } catch (err) {
            const resData = err.response?.data;
            const msg = resData?.message
                || (resData?.errors && typeof resData.errors === 'object' && Object.values(resData.errors).flat().length
                    ? Object.values(resData.errors).flat().find(Boolean)
                    : null)
                || (err.code === 'ECONNABORTED' ? 'Upload took too long. Try a smaller file or check your connection.' : err.message)
                || 'Failed to send. Try again or use a smaller file.';
            toast.error(msg);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
                setAttachMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="px-4 pt-3 pb-0 bg-[var(--theme-bg-main)] border-t border-[var(--theme-border)]">
            <form onSubmit={handleSubmit(onSubmit)}>
                {mediaFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {mediaFiles.map((item, index) => (
                            <div key={index} className="relative inline-block rounded-xl overflow-hidden border border-[var(--theme-border)]">
                                {item.file.type.startsWith('video/') && item.preview ? (
                                    <video src={item.preview} controls className="rounded-lg max-h-28" />
                                ) : item.file.type.startsWith('image/') && item.preview ? (
                                    <img src={item.preview} alt="" className="rounded-lg max-h-28 object-cover w-auto" />
                                ) : (
                                    <div className="px-4 py-3 flex items-center gap-2 bg-[var(--theme-surface-hover)] min-w-[200px]">
                                        <span className="material-symbols-outlined text-[var(--text-primary)]/70">description</span>
                                        <span className="text-sm text-[var(--text-primary)] truncate flex-1">{item.file.name}</span>
                                    </div>
                                )}
                                <button type="button" onClick={() => removeMedia(index)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-colors backdrop-blur-sm" aria-label="Remove">
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="bg-[var(--theme-surface)] rounded-2xl px-3 py-2 flex items-center gap-2 border border-[var(--theme-border)] focus-within:border-[var(--theme-accent)]/50 transition-colors duration-200">
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                    <div className="relative shrink-0" ref={attachMenuRef}>
                        <button
                            type="button"
                            onClick={() => setAttachMenuOpen((v) => !v)}
                            className="w-10 h-10 rounded-full bg-[var(--theme-bg-main)] flex items-center justify-center text-[var(--text-primary)]/70 hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-all"
                            aria-label="Attach"
                        >
                            <span className="material-symbols-outlined text-xl">add</span>
                        </button>
                        {attachMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-1 py-1 min-w-[160px] rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] shadow-xl z-20">
                                <button type="button" onClick={() => openFileDialog('image/*')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left">
                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">photo_library</span>
                                    Photo
                                </button>
                                <button type="button" onClick={() => openFileDialog('video/*')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left">
                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">videocam</span>
                                    Video
                                </button>
                                <button type="button" onClick={() => openFileDialog('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--theme-surface)] transition-colors text-left">
                                    <span className="material-symbols-outlined text-lg text-[var(--text-primary)]/70">folder</span>
                                    File
                                </button>
                            </div>
                        )}
                    </div>
                    <input {...register('message')} placeholder="Type a message..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 min-w-0" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(onSubmit)(); } }} />
                    <button type="button" className="w-10 h-10 rounded-full bg-[var(--theme-bg-main)] flex items-center justify-center text-[var(--text-primary)]/70 hover:text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-all shrink-0" aria-label="Emoji">
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
