import React from 'react';
import { useForm } from 'react-hook-form';
import { useSendGroupMessage } from '../../hooks/useGroupConversations';
import Button from '../common/Button';

const GroupMessageInput = ({ groupId, onMessageSent }) => {
    const { register, handleSubmit, reset, watch } = useForm();
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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="border-t border-gray-200 p-4 theme-surface">
            <div className="flex items-end space-x-2">
                <textarea
                    {...register('message', {
                        required: 'Message is required',
                        maxLength: { value: 5000, message: 'Message cannot exceed 5000 characters' },
                    })}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent resize-none theme-bg-main theme-text"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(onSubmit)();
                        }
                    }}
                />
                <Button
                    type="submit"
                    size="sm"
                    disabled={!message.trim() || sendMutation.isPending}
                    loading={sendMutation.isPending}
                >
                    Send
                </Button>
            </div>
            {message.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{message.length}/5000</p>
            )}
        </form>
    );
};

export default GroupMessageInput;
