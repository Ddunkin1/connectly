import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversation, useConversationByUsername } from '../hooks/useConversations';
import ConversationList from '../components/messages/ConversationList';
import MessageThread from '../components/messages/MessageThread';
import MessageInput from '../components/messages/MessageInput';
import GroupConversationList from '../components/messages/GroupConversationList';
import GroupMessageThread from '../components/messages/GroupMessageThread';
import GroupMessageInput from '../components/messages/GroupMessageInput';
import NewGroupModal from '../components/messages/NewGroupModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Messages = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('direct');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
    
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

    // When URL has username, show Direct tab
    useEffect(() => {
        if (username) setActiveTab('direct');
    }, [username]);

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
        setSelectedGroup(null);
        if (conversation.other_user?.username) {
            navigate(`/messages/${conversation.other_user.username}`, { replace: true });
        }
    };

    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
        setSelectedConversation(null);
        navigate('/messages', { replace: true });
    };

    const handleGroupCreated = (group) => {
        setActiveTab('groups');
        setSelectedGroup(group);
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

    const showDirectContent = activeTab === 'direct';
    const showGroupContent = activeTab === 'groups';

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-200px)]">
            <NewGroupModal
                isOpen={newGroupModalOpen}
                onClose={() => setNewGroupModalOpen(false)}
                onCreated={handleGroupCreated}
            />
            <div className="theme-surface rounded-lg border border-gray-200 h-full flex">
                {/* Sidebar */}
                <div className="w-80 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold theme-text">Messages</h2>
                    </div>
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('direct')}
                            className={`flex-1 py-2 text-sm font-medium ${
                                activeTab === 'direct'
                                    ? 'border-b-2 border-[var(--theme-accent)] text-[var(--theme-accent)]'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Direct
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`flex-1 py-2 text-sm font-medium ${
                                activeTab === 'groups'
                                    ? 'border-b-2 border-[var(--theme-accent)] text-[var(--theme-accent)]'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Groups
                        </button>
                    </div>
                    {showDirectContent && (
                        <ConversationList
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={displayConversation?.id}
                        />
                    )}
                    {showGroupContent && (
                        <>
                            <div className="p-2 border-b border-gray-200">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setNewGroupModalOpen(true)}
                                >
                                    New Group
                                </Button>
                            </div>
                            <GroupConversationList
                                onSelectGroup={handleSelectGroup}
                                selectedGroupId={selectedGroup?.id}
                            />
                        </>
                    )}
                </div>

                {/* Message Thread */}
                <div className="flex-1 flex flex-col min-h-0">
                    {showDirectContent && (
                        <>
                            {isLoadingConversation ? (
                        <div className="flex-1 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                            ) : displayConversation ? (
                                <>
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="text-lg font-semibold theme-text">
                                                {displayConversation.other_user?.name}
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                @{displayConversation.other_user?.username}
                                            </span>
                                        </div>
                                    </div>
                                    <MessageThread conversationId={displayConversation.id} />
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
                        </>
                    )}
                    {showGroupContent && (
                        <>
                            {selectedGroup ? (
                                <>
                                    <div className="p-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold theme-text">
                                            {selectedGroup.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {selectedGroup.members?.length || 0} members
                                        </p>
                                    </div>
                                    <GroupMessageThread groupId={selectedGroup.id} />
                                    <GroupMessageInput groupId={selectedGroup.id} onMessageSent={() => {}} />
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-gray-500 text-lg mb-2">Select a group</p>
                                        <p className="text-gray-400 text-sm">
                                            Choose a group from the list or create a new one
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
