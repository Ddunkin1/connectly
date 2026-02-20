import React from 'react';
import { useForm } from 'react-hook-form';
import { useSendGroupMessage } from '../../hooks/useGroupConversations';

const GroupMessageInput = ({ groupId, onMessageSent }) => {
    const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { message: '' } });
    const sendMutation = useSendGroupMessage();
    const message = watch('message', '');

    const onSubmit = async (data) => {
        if (!data.message?.trim()) return;

        try {
            await sendMutation.mutateAsync({
                group_conversation_id: groupId,
                content: data.message.trim(),
            });
            reset();
            onMessageSent?.();
        } catch {
            // Error handled by mutation
        }
    };

    const canSend = message.trim();

    return (
        <div className="px-4 py-3 bg-[#1A1A1A] border-t border-[#3A3A3A]">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-[#2C2C2C] rounded-2xl px-3 py-2 flex items-center gap-2 border border-[#3A3A3A] focus-within:border-[#4A4A4A] transition-colors duration-200">
                    <input
                        {...register('message', {
                            maxLength: { value: 5000, message: 'Message cannot exceed 5000 characters' },
                        })}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-white placeholder:text-slate-500 min-w-0"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(onSubmit)();
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!canSend || sendMutation.isPending}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white hover:opacity-90 active:scale-95 disabled:hover:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        aria-label="Send"
                    >
                        {sendMutation.isPending ? (
                            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-xl">send</span>
                        )}
                    </button>
                </div>
                {message.length > 0 && (
                    <p className="text-[10px] text-slate-500 mt-1.5 px-1">{message.length}/5000</p>
                )}
            </form>
        </div>
    );
};

export default GroupMessageInput;
