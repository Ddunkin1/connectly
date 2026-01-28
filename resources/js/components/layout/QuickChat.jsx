import React, { useState } from 'react';
import Avatar from '../common/Avatar';

const QuickChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState(null);

    // Mock data
    const chats = [
        { id: 1, name: 'John Doe', username: 'johndoe', avatar: null, lastMessage: 'Hey, how are you?' },
        { id: 2, name: 'Jane Smith', username: 'janesmith', avatar: null, lastMessage: 'Thanks for the help!' },
    ];

    return (
        <>
            {/* Chat Dock */}
            <div className="fixed bottom-4 right-4 z-50">
                {!isOpen ? (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 bg-[#359EFF] text-white rounded-full shadow-lg hover:bg-[#2a8eef] transition-colors flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">chat</span>
                    </button>
                ) : (
                    <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-gray-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Messages</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {chats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat)}
                                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100"
                                >
                                    <Avatar src={chat.avatar} alt={chat.name} size="sm" />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium text-gray-900">{chat.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default QuickChat;
