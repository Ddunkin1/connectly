import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCommunities, useJoinCommunity, useLeaveCommunity, useCreateCommunity } from '../hooks/useCommunities';
import useAuthStore from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { CommunitySkeleton } from '../components/common/skeletons';
import Modal from '../components/common/Modal';

const inputBase =
    'w-full px-4 py-3 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all';

const Communities = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const { data, isLoading, error } = useCommunities();
    const joinMutation = useJoinCommunity();
    const leaveMutation = useLeaveCommunity();
    const createMutation = useCreateCommunity();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        privacy: 'public',
        requires_approval: false,
    });

    const joinedCommunities = data?.communities?.filter((c) => c.is_member === true) || [];
    const suggestedCommunities = data?.communities?.filter((c) => c.is_member === false) || [];

    const handleJoin = (communityId, e) => {
        e.preventDefault();
        e.stopPropagation();
        joinMutation.mutate(communityId);
    };

    const handleLeave = (communityId, e) => {
        e.preventDefault();
        e.stopPropagation();
        leaveMutation.mutate(communityId);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(createForm, {
            onSuccess: (res) => {
                setCreateModalOpen(false);
                setCreateForm({ name: '', description: '', privacy: 'public', requires_approval: false });
                const community = res?.data?.community;
                if (community?.id) navigate(`/communities/${community.id}`);
            },
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <CommunitySkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <div className="rounded-2xl border border-red-200 bg-red-500/10 p-6 text-center">
                    <p className="text-red-400 font-medium">Failed to load communities.</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-6 px-1">
            {/* Page header */}
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Communities</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Find and join spaces around shared interests, or create your own.
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateModalOpen(true)}
                    className="rounded-xl px-4 py-2 inline-flex items-center gap-2 shrink-0"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Create community
                </Button>
            </header>

            {/* What communities do — short explainer */}
            <details className="mb-8 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] overflow-hidden">
                <summary className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] cursor-pointer list-none flex items-center gap-2 hover:bg-[var(--theme-surface-hover)]">
                    <span className="material-symbols-outlined text-[var(--theme-accent)]">info</span>
                    What are communities?
                </summary>
                <div className="px-4 pb-4 pt-0 text-sm text-[var(--text-secondary)] space-y-2 border-t border-[var(--theme-border)]">
                    <p><strong className="text-[var(--text-primary)]">Communities</strong> are spaces where people with shared interests can post, discuss, and connect. You can:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong className="text-[var(--text-primary)]">Join</strong> public communities or get invited to private ones</li>
                        <li><strong className="text-[var(--text-primary)]">Post</strong> text, images, and videos to the community feed</li>
                        <li><strong className="text-[var(--text-primary)]">Engage</strong> with posts (like, comment, share) like on the main feed</li>
                        <li><strong className="text-[var(--text-primary)]">Create</strong> your own community and set it as public or private</li>
                        <li><strong className="text-[var(--text-primary)]">Moderate</strong> (as creator) — approve posts, remove content, or delete the community</li>
                    </ul>
                </div>
            </details>

            {/* Joined Communities */}
            {joinedCommunities.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                        Your communities
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {joinedCommunities.map((community) => (
                            <Link
                                key={community.id}
                                to={`/communities/${community.id}`}
                                className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] transition-colors shadow-post-card"
                            >
                                <Avatar src={community.avatar} alt={community.name} size="lg" className="w-12 h-12 rounded-xl shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-[var(--text-primary)] truncate">{community.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                                        {community.description || 'No description'}
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]/80 mt-2">
                                        {community.members_count ?? 0} members
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Discover / Suggested Communities */}
            <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                    Discover communities
                </h2>
                {suggestedCommunities.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-10 text-center shadow-post-card">
                        <span className="material-symbols-outlined text-5xl text-[var(--text-secondary)]/50 mb-4 block">groups</span>
                        <p className="text-[var(--text-primary)] font-medium">No communities yet</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                            Be the first to create a community and invite others to join.
                        </p>
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setCreateModalOpen(true)}
                            className="mt-6 rounded-xl px-5 py-2.5 inline-flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Create community
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {suggestedCommunities.map((community) => {
                            const isJoining = joinMutation.isPending && joinMutation.variables === community.id;
                            return (
                                <div
                                    key={community.id}
                                    className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-post-card flex flex-col"
                                >
                                    <Link to={`/communities/${community.id}`} className="flex items-start gap-3 mb-4 flex-1 min-w-0">
                                        <Avatar src={community.avatar} alt={community.name} size="lg" className="w-12 h-12 rounded-xl shrink-0" />
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-[var(--text-primary)] truncate">{community.name}</h3>
                                            <p className="text-sm text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                                                {community.description || 'No description'}
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)]/80 mt-2">
                                                {community.members_count ?? 0} members
                                            </p>
                                        </div>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full rounded-xl border-[var(--theme-border)] text-[var(--text-primary)]"
                                        onClick={(e) => handleJoin(community.id, e)}
                                        disabled={isJoining}
                                        loading={isJoining}
                                    >
                                        {isJoining ? 'Joining…' : 'Join'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Create Community Modal */}
            <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create community" size="md">
                <form onSubmit={handleCreateSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Name</label>
                        <input
                            type="text"
                            value={createForm.name}
                            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                            required
                            maxLength={255}
                            placeholder="e.g. Design Feedback"
                            className={inputBase}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
                        <textarea
                            value={createForm.description}
                            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                            rows={3}
                            maxLength={1000}
                            placeholder="What is this community about?"
                            className={`${inputBase} resize-none`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Privacy</label>
                        <select
                            value={createForm.privacy}
                            onChange={(e) => setCreateForm((f) => ({ ...f, privacy: e.target.value }))}
                            className={inputBase}
                        >
                            <option value="public">Public — Anyone can find and join</option>
                            <option value="private">Private — Invite only</option>
                        </select>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={createForm.requires_approval}
                            onChange={(e) => setCreateForm((f) => ({ ...f, requires_approval: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded border-[var(--theme-border)] text-[var(--theme-accent)] focus:ring-[var(--theme-accent)] bg-[var(--theme-surface)]"
                        />
                        <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--text-primary)]">
                            Posts require moderator approval
                        </span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2 border-t border-[var(--theme-border)]">
                        <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)} className="text-[var(--text-primary)]">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createMutation.isPending || !createForm.name.trim()}
                            className="rounded-xl px-5 py-2.5"
                        >
                            {createMutation.isPending ? 'Creating…' : 'Create community'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Communities;
