import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';

const Communities = () => {
    // Mock data - replace with actual API calls
    const joinedCommunities = [
        { id: 1, name: 'Web Developers', description: 'A community for web developers', members: 1234, avatar: null },
        { id: 2, name: 'React Enthusiasts', description: 'React.js community', members: 856, avatar: null },
    ];

    const suggestedCommunities = [
        { id: 3, name: 'Laravel Community', description: 'Laravel PHP framework', members: 2341, avatar: null },
        { id: 4, name: 'Designers', description: 'UI/UX Design community', members: 567, avatar: null },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
                <p className="text-gray-500 mt-1">Discover and join communities</p>
            </div>

            {/* Joined Communities */}
            {joinedCommunities.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Communities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {joinedCommunities.map((community) => (
                            <Link
                                key={community.id}
                                to={`/communities/${community.id}`}
                                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start space-x-3">
                                    <Avatar src={community.avatar} alt={community.name} size="lg" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900">{community.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                            {community.description}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {community.members} members
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggested Communities */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Discover Communities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestedCommunities.map((community) => (
                        <div
                            key={community.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start space-x-3 mb-3">
                                <Avatar src={community.avatar} alt={community.name} size="lg" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900">{community.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                        {community.description}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {community.members} members
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                                Join
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Communities;
