import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSendMessage } from '../../hooks/useMessages';
import Button from '../common/Button';

const MessageInput = ({ conversationId, receiverId, onMessageSent }) => {
    const { register, handleSubmit, reset, watch } = useForm();
    const sendMessageMutation = useSendMessage();
    const message = watch('message', '');

    const onSubmit = async (data) => {
        if (!data.message.trim()) {
            return;
        }

        try {
            await sendMessageMutation.mutateAsync({
                receiver_id: receiverId,
                message: data.message.trim(),
            });
            reset();
            if (onMessageSent) {
                onMessageSent();
            }
        } catch (error) {
            // Error handled by mutation
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="border-t border-gray-200 p-4">
            <div className="flex items-end space-x-2">
                <textarea
                    {...register('message', {
                        required: 'Message is required',
                        maxLength: {
                            value: 5000,
                            message: 'Message cannot exceed 5000 characters',
                        },
                    })}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#359EFF] focus:border-transparent resize-none"
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
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    loading={sendMessageMutation.isPending}
                >
                    Send
                </Button>
            </div>
            <div className="mt-1">
                {errors.message && (
                    <p className="text-xs text-red-500">{errors.message.message}</p>
                )}
                {message.length > 0 && (
                    <p className="text-xs text-gray-500">
                        {message.length}/5000
                    </p>
                )}
            </div>
        </form>
    );
};

export default MessageInput;
