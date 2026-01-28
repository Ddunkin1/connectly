import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import useAuthStore from '../../store/authStore';

const QuickChat = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const user = useAuthStore((state) => state.user);

    // Mock data
    const chats = [
        { id: 1, name: 'John Doe', username: 'johndoe', avatar: null, lastMessage: 'Hey, how are you?', online: true },
        { id: 2, name: 'Jane Smith', username: 'janesmith', avatar: null, lastMessage: 'Thanks for the help!', online: false },
    ];

    return (
        <>
            {/* Quick Chat Widget */}
            <div className="fixed bottom-4 right-4 z-50">
                {!isCollapsed ? (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-gray-200">
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <Avatar src={user?.profile_picture} alt={user?.name} size="sm" />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">Quick Chat</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setIsCollapsed(true)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Collapse"
                                >
                                    <span className="material-symbols-outlined text-lg">expand_less</span>
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Close"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Chat List - Always visible when not collapsed */}
                        <div className="flex-1 overflow-y-auto max-h-96">
                            {chats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => navigate(`/messages/${chat.username}`)}
                                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                                >
                                    <div className="relative">
                                        <Avatar src={chat.avatar} alt={chat.name} size="sm" />
                                        {chat.online && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-gray-900">{chat.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center space-x-2 hover:bg-gray-50 transition-colors"
                    >
                        <div className="relative">
                            <Avatar src={user?.profile_picture} alt={user?.name} size="sm" />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">Quick Chat</span>
                        <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                    </button>
                )}
            </div>
        </>
    );
};

export default QuickChat;
