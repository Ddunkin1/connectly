import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const RightSidebar = () => {
    // Mock data - replace with actual API calls
    const suggestedUsers = [
        { id: 1, name: 'John Doe', username: 'johndoe', avatar: null },
        { id: 2, name: 'Jane Smith', username: 'janesmith', avatar: null },
        { id: 3, name: 'Bob Wilson', username: 'bobwilson', avatar: null },
    ];

    const trendingCommunities = [
        { id: 1, name: 'Web Developers', members: 1234, avatar: null },
        { id: 2, name: 'React Enthusiasts', members: 856, avatar: null },
        { id: 3, name: 'Laravel Community', members: 2341, avatar: null },
    ];

    return (
        <aside className="hidden xl:block w-80 bg-white border-l border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <div className="p-4 space-y-6">
                {/* Suggested Users */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Who to Follow</h3>
                    <div className="space-y-3">
                        {suggestedUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between">
                                <Link
                                    to={`/profile/${user.username}`}
                                    className="flex items-center space-x-3 flex-1 hover:opacity-80"
                                >
                                    <Avatar src={user.avatar} alt={user.name} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-500">@{user.username}</p>
                                    </div>
                                </Link>
                                <Button size="sm" variant="outline">
                                    Follow
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trending Communities */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Trending Communities</h3>
                    <div className="space-y-3">
                        {trendingCommunities.map((community) => (
                            <Link
                                key={community.id}
                                to={`/communities/${community.id}`}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                            >
                                <Avatar src={community.avatar} alt={community.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{community.name}</p>
                                    <p className="text-xs text-gray-500">{community.members} members</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
