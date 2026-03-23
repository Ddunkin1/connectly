import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConnections } from '../hooks/useConnections';
import { useFriendRequests } from '../hooks/useFriendRequests';
import Avatar from '../components/common/Avatar';
import { SimplePageSkeleton } from '../components/common/skeletons';
import ProfilePreviewCard from '../components/profile/ProfilePreviewCard';

const tabOptions = [
    { id: 'all', label: 'All' },
    { id: 'following', label: 'Following' },
    { id: 'followers', label: 'Followers' },
    { id: 'mutuals', label: 'Mutuals' },
    { id: 'requests', label: 'Requests' },
];

const Connections = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [previewUser, setPreviewUser] = useState(null);
    const { data: connections, isLoading: connectionsLoading } = useConnections();
    const { data: friendRequests, isLoading: friendRequestsLoading } = useFriendRequests();

    const followers = connections?.followers ?? [];
    const following = connections?.following ?? [];
    const mutuals = connections?.mutuals ?? [];

    const allUnique = (() => {
        const byId = new Map();
        [...followers, ...following].forEach((u) => {
            if (!byId.has(u.id)) {
                byId.set(u.id, u);
            }
        });
        return Array.from(byId.values());
    })();

    const receivedRequests = friendRequests?.received ?? [];
    const sentRequests = friendRequests?.sent ?? [];

    const renderUserRow = (user) => (
        <div
            key={user.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar
                    src={user.profile_picture}
                    alt={user.name}
                    size="md"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs shrink-0">
                {typeof user.followers_count === 'number' && (
                    <span className="text-slate-500 hidden sm:inline">{user.followers_count} followers</span>
                )}
                <button
                    type="button"
                    onClick={() => setPreviewUser(user)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-[var(--text-primary)] hover:bg-white/10 text-[11px] font-medium"
                >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    View profile
                </button>
                <Link
                    to={`/messages/${user.username}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-[11px] text-slate-200 hover:bg-white/10"
                >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Message
                </Link>
            </div>
        </div>
    );

    const renderRequestRow = (request, type) => {
        const counterpart = type === 'received' ? request.sender : request.receiver;
        if (!counterpart) return null;
        return (
            <div
                key={request.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar
                        src={counterpart.profile_picture}
                        alt={counterpart.name}
                        size="md"
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{counterpart.name}</p>
                        <p className="text-xs text-slate-500 truncate">@{counterpart.username}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">{type === 'received' ? 'Received' : 'Sent'}</span>
                    <button
                        type="button"
                        onClick={() => setPreviewUser(counterpart)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 text-[var(--text-primary)] hover:bg-white/10 text-[11px] font-medium"
                    >
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        View profile
                    </button>
                </div>
            </div>
        );
    };

    const loading = connectionsLoading || friendRequestsLoading;

    let content = null;
    if (loading) {
        content = <SimplePageSkeleton rows={8} title={false} />;
    } else {
        switch (activeTab) {
            case 'following':
                content =
                    following.length === 0 ? (
                        <p className="text-sm text-slate-500 px-4 py-6">You&apos;re not following anyone yet.</p>
                    ) : (
                        following.map(renderUserRow)
                    );
                break;
            case 'followers':
                content =
                    followers.length === 0 ? (
                        <p className="text-sm text-slate-500 px-4 py-6">You don&apos;t have any followers yet.</p>
                    ) : (
                        followers.map(renderUserRow)
                    );
                break;
            case 'mutuals':
                content =
                    mutuals.length === 0 ? (
                        <p className="text-sm text-slate-500 px-4 py-6">
                            You don&apos;t have any mutual connections yet.
                        </p>
                    ) : (
                        mutuals.map(renderUserRow)
                    );
                break;
            case 'requests':
                const anyRequests = receivedRequests.length > 0 || sentRequests.length > 0;
                content = !anyRequests ? (
                    <p className="text-sm text-slate-500 px-4 py-6">No pending friend requests.</p>
                ) : (
                    <>
                        {receivedRequests.length > 0 && (
                            <>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600 px-4 mb-1">
                                    Received
                                </p>
                                {receivedRequests.map((req) => renderRequestRow(req, 'received'))}
                            </>
                        )}
                        {sentRequests.length > 0 && (
                            <>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600 px-4 mt-4 mb-1">
                                    Sent
                                </p>
                                {sentRequests.map((req) => renderRequestRow(req, 'sent'))}
                            </>
                        )}
                    </>
                );
                break;
            case 'all':
            default:
                content =
                    allUnique.length === 0 ? (
                        <p className="text-sm text-slate-500 px-4 py-6">
                            You don&apos;t have any connections yet. Start by following people from Search or your feed.
                        </p>
                    ) : (
                        allUnique.map(renderUserRow)
                    );
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Connections</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        View the people you follow, your followers, mutuals, and pending requests.
                    </p>
                </div>
            </div>

            <div className="glass-morphism rounded-full p-1 flex items-center justify-between mb-4">
                {tabOptions.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-primary text-white active-tab-glow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="theme-surface rounded-2xl border border-white/5 divide-y divide-white/5 min-h-[320px]">
                {content}
            </div>

            <ProfilePreviewCard
                user={previewUser}
                isOpen={!!previewUser}
                onClose={() => setPreviewUser(null)}
            />
        </div>
    );
};

export default Connections;

