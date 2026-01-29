import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversation, useConversationByUsername } from '../hooks/useConversations';
import ConversationList from '../components/messages/ConversationList';
import MessageThread from '../components/messages/MessageThread';
import MessageInput from '../components/messages/MessageInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Messages = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [selectedConversation, setSelectedConversation] = useState(null);
    
    // If username is provided, get or create conversation by username
    const { 
        data: conversationByUsernameData, 
        isLoading: conversationByUsernameLoading,
        error: conversationByUsernameError 
    } = useConversationByUsername(username);
    
    // If conversation ID is selected (from list), get that conversation
    const { data: conversationData, isLoading: conversationLoading } = useConversation(
        selectedConversation?.id && !username ? selectedConversation.id : null
    );

    // Update selected conversation when username-based conversation loads
    useEffect(() => {
        if (username && conversationByUsernameData?.conversation) {
            setSelectedConversation(conversationByUsernameData.conversation);
        }
    }, [username, conversationByUsernameData]);

    // Handle errors
    useEffect(() => {
        if (conversationByUsernameError) {
            const errorMessage = conversationByUsernameError.response?.data?.message || 'Failed to load conversation';
            toast.error(errorMessage);
            // Navigate back to messages list if user not found
            if (conversationByUsernameError.response?.status === 404) {
                navigate('/messages', { replace: true });
            }
        }
    }, [conversationByUsernameError, navigate]);

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        // Update URL if needed
        if (conversation.other_user?.username) {
            navigate(`/messages/${conversation.other_user.username}`, { replace: true });
        }
    };

    const handleMessageSent = () => {
        // Refresh conversation data after sending message
        // This is handled by query invalidation in the hook
    };

    // Determine which conversation to display
    const displayConversation = username 
        ? conversationByUsernameData?.conversation 
        : selectedConversation || conversationData?.conversation;
    
    const isLoadingConversation = username 
        ? conversationByUsernameLoading 
        : conversationLoading;

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-200px)]">
            <div className="bg-white rounded-lg border border-gray-200 h-full flex">
                {/* Conversations Sidebar */}
                <div className="w-80 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                    </div>
                    <ConversationList
                        onSelectConversation={handleSelectConversation}
                        selectedConversationId={displayConversation?.id}
                    />
                </div>

                {/* Message Thread */}
                <div className="flex-1 flex flex-col">
                    {isLoadingConversation ? (
                        <div className="flex-1 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : displayConversation ? (
                        <>
                            {/* Conversation Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {displayConversation.other_user?.name}
                                    </h3>
                                    <span className="text-sm text-gray-500">
                                        @{displayConversation.other_user?.username}
                                    </span>
                                </div>
                            </div>

                            {/* Messages */}
                            <MessageThread conversationId={displayConversation.id} />

                            {/* Message Input */}
                            <MessageInput
                                conversationId={displayConversation.id}
                                receiverId={displayConversation.other_user?.id}
                                onMessageSent={handleMessageSent}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-gray-500 text-lg mb-2">Select a conversation</p>
                                <p className="text-gray-400 text-sm">
                                    Choose a conversation from the list to start messaging
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
