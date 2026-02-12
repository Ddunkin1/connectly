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
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[#0A0A0B]">
            <NewGroupModal
                isOpen={newGroupModalOpen}
                onClose={() => setNewGroupModalOpen(false)}
                onCreated={handleGroupCreated}
            />
            <div className="flex flex-1 min-h-0 overflow-hidden bg-[#0A0A0B]">
                {/* Left panel - conversation list (slim w-64 for wider chat) */}
                <section className="w-64 shrink-0 border-r border-[#26262E] flex flex-col bg-[#0A0A0B]">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Messages</h2>
                            <Link to="/messages" className="p-2 rounded-lg hover:bg-[#16161E] text-slate-400 transition-colors" aria-label="Compose">
                                <span className="material-symbols-outlined">edit_note</span>
                            </Link>
                        </div>
                        <div className="relative mb-6">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input type="text" placeholder="Search messages" className="w-full bg-[#16161E] border-none rounded-xl pl-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div className="flex p-1 bg-[#16161E] rounded-xl mb-4">
                            <button type="button" onClick={() => setActiveTab('direct')} className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'direct' ? 'bg-white dark:bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}>Direct</button>
                            <button type="button" onClick={() => setActiveTab('groups')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'groups' ? 'bg-white dark:bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}>Groups</button>
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
                                <Button variant="primary" size="sm" className="w-full" onClick={() => setNewGroupModalOpen(true)}>New Group</Button>
                            </div>
                            <GroupConversationList
                                onSelectGroup={handleSelectGroup}
                                selectedGroupId={selectedGroup?.id}
                            />
                        </>
                    )}
                </section>

                {/* Center - chat: header fixed top, messages scroll, input fixed bottom */}
                <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-[#0A0A0B]/50">
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
                                    <div className="shrink-0 px-6 py-4 border-b border-[#26262E]">
                                        <h3 className="text-lg font-semibold text-white">{selectedGroup.name}</h3>
                                        <p className="text-sm text-slate-500">{selectedGroup.members?.length || 0} members</p>
                                    </div>
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                        <GroupMessageThread groupId={selectedGroup.id} />
                                    </div>
                                    <div className="shrink-0">
                                        <GroupMessageInput groupId={selectedGroup.id} onMessageSent={() => {}} />
                                    </div>
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
                </main>

                {/* Right panel - user details & shared media */}
                {showDirectContent && displayConversation && (
                    <>
                        <MessageUserPanel
                            otherUser={displayConversation.other_user}
                            mediaItems={conversationMedia}
                            onViewAllMedia={() => setSharedMediaModalOpen(true)}
                        />
                        <SharedMediaModal
                            isOpen={sharedMediaModalOpen}
                            onClose={() => setSharedMediaModalOpen(false)}
                            conversationId={displayConversation.id}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Messages;
