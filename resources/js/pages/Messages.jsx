import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useConversation, useConversationByUsername, useConversations } from '../hooks/useConversations';
import ConversationList from '../components/messages/ConversationList';
import MessageThread from '../components/messages/MessageThread';
import MessageInput from '../components/messages/MessageInput';
import MessageChatHeader from '../components/messages/MessageChatHeader';
import MessageUserPanel from '../components/messages/MessageUserPanel';
import SharedMediaModal from '../components/messages/SharedMediaModal';
import GroupConversationList from '../components/messages/GroupConversationList';
import GroupMessageThread from '../components/messages/GroupMessageThread';
import GroupMessageInput from '../components/messages/GroupMessageInput';
import GroupMembersPanel from '../components/messages/GroupMembersPanel';
import NewGroupModal from '../components/messages/NewGroupModal';
import GroupChatHeader from '../components/messages/GroupChatHeader';
import { SkeletonBlock } from '../components/common/skeletons';
import Button from '../components/common/Button';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useConnections } from '../hooks/useConnections';

const Messages = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('direct');
    const [mobileView, setMobileView] = useState('list');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
    const [groupAddModalOpen, setGroupAddModalOpen] = useState(false);
    const [conversationMedia, setConversationMedia] = useState([]);
    const [conversationPinned, setConversationPinned] = useState([]);
    const [sharedMediaModalOpen, setSharedMediaModalOpen] = useState(false);
    
    // If username is provided, get or create conversation by username
    const { 
        data: conversationByUsernameData, 
        isLoading: conversationByUsernameLoading,
        error: conversationByUsernameError 
    } = useConversationByUsername(username);

    const { data: conversationsData } = useConversations();
    const { data: connectionsData } = useConnections();
    
    // If conversation ID is selected (from list), get that conversation
    const { data: conversationData, isLoading: conversationLoading } = useConversation(
        selectedConversation?.id && !username ? selectedConversation.id : null
    );

    // Update selected conversation when username-based conversation loads
    useEffect(() => {
        if (username && conversationByUsernameData?.conversation) {
            setSelectedConversation(conversationByUsernameData.conversation);
            setMobileView('chat');
            // Sync sidebar — the server may have un-hidden this conversation
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    }, [username, conversationByUsernameData, queryClient]);

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
        setMobileView('chat');
        if (conversation.other_user?.username) {
            navigate(`/messages/${conversation.other_user.username}`, { replace: true });
        }
    };

    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
        setSelectedConversation(null);
        setMobileView('chat');
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

    const existingConversationUserIds =
        conversationsData?.pages
            ?.flatMap((p) => p.data?.conversations ?? [])
            ?.map((c) => c.other_user?.id)
            .filter((id) => id != null) ?? [];

    const mutuals = connectionsData?.mutuals ?? [];
    const suggestedToMessage = mutuals
        .filter((u) => !existingConversationUserIds.includes(u.id))
        .slice(0, 5);

    return (
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[var(--theme-bg-main)]">
            <NewGroupModal
                isOpen={newGroupModalOpen}
                onClose={() => setNewGroupModalOpen(false)}
                onCreated={handleGroupCreated}
            />
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Left panel - conversation list — full-width on mobile when mobileView=list, fixed width on sm+ */}
                <section className={`${mobileView === 'list' ? 'flex' : 'hidden'} sm:flex w-full sm:w-[280px] shrink-0 border-r border-[var(--theme-border)] flex-col bg-[var(--theme-bg-main)]`}>
                    <div className="p-4 border-b border-[var(--theme-border)]">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Messages</h2>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-primary)]/60 text-lg">search</span>
                            <input type="text" placeholder="Search conversations..." className="w-full bg-[var(--theme-surface)] border-0 rounded-lg pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50 focus:ring-2 focus:ring-primary/30 focus:outline-none" />
                        </div>
                        <div className="flex p-1 bg-[var(--theme-surface)] rounded-lg mt-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab('direct')}
                                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                    activeTab === 'direct'
                                        ? 'bg-primary text-white'
                                        : 'text-[var(--text-primary)]/70 hover:text-[var(--text-primary)]'
                                }`}
                            >
                                Direct
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('groups')}
                                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                    activeTab === 'groups'
                                        ? 'bg-primary text-white'
                                        : 'text-[var(--text-primary)]/70 hover:text-[var(--text-primary)]'
                                }`}
                            >
                                Groups
                            </button>
                        </div>
                    </div>
                    {showDirectContent && (
                        <>
                            {suggestedToMessage.length > 0 && (
                                <div className="px-4 pt-3 pb-2 border-b border-[var(--theme-border)]">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-primary)]/50 mb-2">
                                        People you may want to message
                                    </p>
                                    <div className="space-y-1.5">
                                        {suggestedToMessage.map((u) => (
                                            <Link
                                                key={u.id}
                                                to={`/messages/${u.username}`}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--theme-surface)] transition-colors"
                                            >
                                                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                                                    <img
                                                        src={u.profile_picture}
                                                        alt={u.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                                        {u.name}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--text-primary)]/60 truncate">
                                                        @{u.username}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <ConversationList
                                onSelectConversation={handleSelectConversation}
                                selectedConversationId={displayConversation?.id}
                            />
                        </>
                    )}
                    {showGroupContent && (
                        <>
                            <div className="px-6 pb-4">
                                <Button
                                    variant="primary"
                                    size="md"
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-primary/20"
                                    onClick={() => setNewGroupModalOpen(true)}
                                >
                                    <span className="material-symbols-outlined text-xl">group_add</span>
                                    New Group
                                </Button>
                            </div>
                            <GroupConversationList
                                onSelectGroup={handleSelectGroup}
                                selectedGroupId={selectedGroup?.id}
                                onNewGroup={() => setNewGroupModalOpen(true)}
                            />
                        </>
                    )}
                </section>

                {/* Center - chat — full-width on mobile when mobileView=chat, flex-1 on sm+ */}
                <main className={`${mobileView === 'chat' ? 'flex' : 'hidden'} sm:flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden bg-[var(--theme-bg-main)]`}>
                    {showDirectContent && (
                        <>
                            {isLoadingConversation ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
                                    <SkeletonBlock className="h-14 w-14 rounded-full" />
                                    <SkeletonBlock className="h-4 w-48 max-w-[80%]" />
                                    <SkeletonBlock className="h-3 w-64 max-w-[90%]" />
                                </div>
                            ) : displayConversation ? (
                                <>
                                    <div className="shrink-0">
                                        <MessageChatHeader otherUser={displayConversation.other_user} conversationId={displayConversation.id} onBack={() => setMobileView('list')} isSelf={displayConversation.other_user?.id === user?.id} />
                                    </div>
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                        <MessageThread
                                            conversationId={displayConversation.id}
                                            onMediaFromMessages={setConversationMedia}
                                            onPinnedFromMessages={setConversationPinned}
                                        />
                                    </div>
                                    <div className="shrink-0">
                                        <MessageInput
                                            conversationId={displayConversation.id}
                                            receiverId={displayConversation.other_user?.id}
                                            onMessageSent={handleMessageSent}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-[var(--theme-bg-main)]">
                                    <div className="text-center">
                                        <p className="text-[var(--text-primary)]/80 text-base mb-1">Select a conversation</p>
                                        <p className="text-[var(--text-primary)]/60 text-sm">Choose from the list to start messaging</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {showGroupContent && (
                        <>
                            {selectedGroup ? (
                                <>
                                    <div className="shrink-0">
                                        <GroupChatHeader group={selectedGroup} onInviteClick={() => setGroupAddModalOpen(true)} onBack={() => setMobileView('list')} />
                                    </div>
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[var(--theme-bg-main)]">
                                        <GroupMessageThread groupId={selectedGroup.id} />
                                    </div>
                                    <div className="shrink-0">
                                        <GroupMessageInput groupId={selectedGroup.id} onMessageSent={() => {}} />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-[var(--theme-bg-main)]">
                                    <div className="text-center">
                                        <p className="text-[var(--text-primary)]/80 text-base mb-1">Select a group</p>
                                        <p className="text-[var(--text-primary)]/60 text-sm">Choose from the list or create a new one</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Right panel - contact details — hidden on mobile */}
                {showDirectContent && displayConversation && (
                    <>
                        <section className="hidden lg:flex w-[280px] shrink-0 border-l border-[var(--theme-border)] flex-col bg-[var(--theme-bg-main)] overflow-hidden">
                            <MessageUserPanel
                                otherUser={displayConversation.other_user}
                                conversationId={displayConversation.id}
                                mediaItems={conversationMedia}
                                pinnedItems={conversationPinned}
                                onViewAllMedia={() => setSharedMediaModalOpen(true)}
                                onConversationDeleted={() => {
                                    setSelectedConversation(null);
                                    navigate('/messages', { replace: true });
                                }}
                            />
                        </section>
                        <SharedMediaModal
                            isOpen={sharedMediaModalOpen}
                            onClose={() => setSharedMediaModalOpen(false)}
                            conversationId={displayConversation.id}
                        />
                    </>
                )}
                {showGroupContent && selectedGroup && (
                    <div className="hidden lg:flex">
                        <GroupMembersPanel
                            groupId={selectedGroup.id}
                            openAddModal={groupAddModalOpen}
                            onCloseAddModal={() => setGroupAddModalOpen(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
