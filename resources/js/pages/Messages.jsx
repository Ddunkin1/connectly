import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useConversation, useConversationByUsername } from '../hooks/useConversations';
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
    const [groupAddModalOpen, setGroupAddModalOpen] = useState(false);
    const [conversationMedia, setConversationMedia] = useState([]);
    const [sharedMediaModalOpen, setSharedMediaModalOpen] = useState(false);
    
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
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[#1A1A1A]">
            <NewGroupModal
                isOpen={newGroupModalOpen}
                onClose={() => setNewGroupModalOpen(false)}
                onCreated={handleGroupCreated}
            />
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Left panel - conversation list (~1/4 width, Connectly style) */}
                <section className="w-[280px] shrink-0 border-r border-[var(--theme-border)] flex flex-col bg-[#1A1A1A]">
                    <div className="p-4 border-b border-[var(--theme-border)]">
                        <div className="flex items-center gap-2 mb-4">
                            <h1 className="text-lg font-semibold text-white">Connectly</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">PRO</span>
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                            <input type="text" placeholder="Search conversations..." className="w-full bg-[#2C2C2C] border-0 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary/30 focus:outline-none" />
                        </div>
                        <div className="flex p-1 bg-[#2C2C2C] rounded-lg mt-3">
                            <button type="button" onClick={() => setActiveTab('direct')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === 'direct' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>Direct</button>
                            <button type="button" onClick={() => setActiveTab('groups')} className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${activeTab === 'groups' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>Groups</button>
                        </div>
                    </div>
                    {showDirectContent && (
                        <ConversationList
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={displayConversation?.id}
                        />
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

                {/* Center - chat (~1/2 width) */}
                <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#1A1A1A]">
                    {showDirectContent && (
                        <>
                            {isLoadingConversation ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <LoadingSpinner />
                                </div>
                            ) : displayConversation ? (
                                <>
                                    <div className="shrink-0">
                                        <MessageChatHeader otherUser={displayConversation.other_user} />
                                    </div>
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                        <MessageThread
                                            conversationId={displayConversation.id}
                                            onMediaFromMessages={setConversationMedia}
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
                                <div className="flex-1 flex items-center justify-center bg-[#1A1A1A]">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-base mb-1">Select a conversation</p>
                                        <p className="text-slate-500 text-sm">Choose from the list to start messaging</p>
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
                                        <GroupChatHeader group={selectedGroup} onInviteClick={() => setGroupAddModalOpen(true)} />
                                    </div>
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#1A1A1A]">
                                        <GroupMessageThread groupId={selectedGroup.id} />
                                    </div>
                                    <div className="shrink-0">
                                        <GroupMessageInput groupId={selectedGroup.id} onMessageSent={() => {}} />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-[#1A1A1A]">
                                    <div className="text-center">
                                        <p className="text-slate-400 text-base mb-1">Select a group</p>
                                        <p className="text-slate-500 text-sm">Choose from the list or create a new one</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Right panel - contact details (~1/4 width, Connectly style) */}
                {showDirectContent && displayConversation && (
                    <>
                        <section className="w-[280px] shrink-0 border-l border-[var(--theme-border)] flex flex-col bg-[#1A1A1A] overflow-hidden">
                            <MessageUserPanel
                                otherUser={displayConversation.other_user}
                                mediaItems={conversationMedia}
                                onViewAllMedia={() => setSharedMediaModalOpen(true)}
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
                    <GroupMembersPanel
                        groupId={selectedGroup.id}
                        openAddModal={groupAddModalOpen}
                        onCloseAddModal={() => setGroupAddModalOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default Messages;
