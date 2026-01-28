import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const RightSidebar = () => {
    // Mock data - replace with actual API calls
    const trendingTopics = [
        { tag: '#WebDevTips', category: 'Technology', posts: '12.5k' },
        { tag: '#FigmaUpdate', category: 'Design', posts: '8.2k' },
        { tag: '#NoCodeRevolution', category: 'Productivity', posts: '5.1k' },
    ];

    const suggestedCommunities = [
        { id: 1, name: 'Photography Club', members: '4.2k', icon: 'camera_alt' },
        { id: 2, name: 'Startup Founders', members: '12.8k', icon: 'rocket_launch' },
    ];

    return (
        <aside className="hidden xl:block w-80 bg-white border-l border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <div className="p-4 space-y-6">
                {/* Trending Topics */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Trending Topics</h3>
                        <span className="material-symbols-outlined text-gray-400 text-lg">show_chart</span>
                    </div>
                    <div className="space-y-3">
                        {trendingTopics.map((topic, index) => (
                            <Link
                                key={index}
                                to={`/hashtag/${topic.tag.replace('#', '')}`}
                                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">{topic.category}</p>
                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#359EFF] transition-colors">
                                            {topic.tag}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{topic.posts} posts</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Link
                        to="/explore"
                        className="block mt-3 text-sm text-[#359EFF] hover:underline text-center"
                    >
                        Show More
                    </Link>
                </div>

                {/* Suggested Communities */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggested Communities</h3>
                    <div className="space-y-3">
                        {suggestedCommunities.map((community) => (
                            <div
                                key={community.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-600">
                                            {community.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{community.name}</p>
                                        <p className="text-xs text-gray-500">{community.members} members</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="primary">
                                    Join
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Link
                        to="/communities"
                        className="block mt-3 text-sm text-[#359EFF] hover:underline text-center"
                    >
                        View All
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
