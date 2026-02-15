import React, { useState, useRef } from 'react';
import { useGroupConversationWithMessages } from '../../hooks/useGroupConversations';
import { useAddGroupMembers, useRemoveGroupMember, useSetGroupMemberNickname } from '../../hooks/useGroupConversations';
import { searchAPI } from '../../services/api';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import Button from '../common/Button';
import useAuthStore from '../../store/authStore';

const GroupMembersPanel = ({ groupId }) => {
    const user = useAuthStore((state) => state.user);
    const { data } = useGroupConversationWithMessages(groupId);
    const group = data?.group;
    const members = group?.members || [];

    const addMembersMutation = useAddGroupMembers();
    const removeMemberMutation = useRemoveGroupMember();
    const setNicknameMutation = useSetGroupMemberNickname();

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedToAdd, setSelectedToAdd] = useState([]);
    const [nicknameEdit, setNicknameEdit] = useState(null);
    const nicknameInputRef = useRef(null);

    const memberIds = members.map((m) => m.id);
    const isAdmin = members.find((m) => m.id === user?.id)?.pivot?.role === 'admin';

    const getDisplayName = (member) => {
        const nick = member?.pivot?.nickname;
        return (nick && nick.trim()) || member?.name || 'Unknown';
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await searchAPI.search(searchQuery.trim(), 'users');
            const users = res.data?.users?.data ?? res.data?.users ?? [];
            setSearchResults(Array.isArray(users) ? users : []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const toggleAdd = (id) => {
        setSelectedToAdd((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleAddMembers = async () => {
        const toAdd = selectedToAdd.filter((id) => !memberIds.includes(id));
        if (toAdd.length === 0) return;
        try {
            await addMembersMutation.mutateAsync({ groupId, memberIds: toAdd });
            setAddModalOpen(false);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedToAdd([]);
        } catch {}
    };

    const handleRemoveMember = (userId) => {
        if (!window.confirm('Remove this member from the group?')) return;
        removeMemberMutation.mutate({ groupId, userId });
    };

    const handleSetNickname = async (userId, nickname) => {
        try {
            await setNicknameMutation.mutateAsync({ groupId, userId, nickname: nickname.trim() || null });
            setNicknameEdit(null);
        } catch {}
    };

    if (!groupId || !group) return null;

    return (
        <div className="w-72 shrink-0 border-l border-[var(--theme-border)] flex flex-col bg-[var(--theme-bg-main)] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Members ({members.length})</h3>
                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/10 text-[var(--theme-accent)] transition-colors"
                        title="Add member"
                    >
                        <span className="material-symbols-outlined text-xl">person_add</span>
                    </button>
                )}
            </div>
            <div className="space-y-2">
                {members.map((member) => {
                    const isSelf = member.id === user?.id;
                    const canKick = isAdmin && !isSelf;
                    const canEditNickname = isAdmin || isSelf;

                    return (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group"
                        >
                            <Avatar src={member.profile_picture} alt={member.name} size="sm" />
                            <div className="flex-1 min-w-0">
                                {nicknameEdit === member.id ? (
                                    <div className="flex gap-1">
                                        <input
                                            ref={nicknameInputRef}
                                            type="text"
                                            defaultValue={member.pivot?.nickname || ''}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSetNickname(member.id, nicknameInputRef.current?.value || '');
                                                }
                                                if (e.key === 'Escape') setNicknameEdit(null);
                                            }}
                                            autoFocus
                                            className="flex-1 px-2 py-1 text-sm bg-[var(--theme-surface)] border border-gray-600 rounded text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSetNickname(member.id, nicknameInputRef.current?.value || '')
                                            }
                                            className="text-[var(--theme-accent)] hover:underline"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNicknameEdit(null)}
                                            className="text-gray-500 hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                        {getDisplayName(member)}
                                        {member.pivot?.nickname && (
                                            <span className="text-gray-500 font-normal"> @{member.username}</span>
                                        )}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500">
                                    {member.pivot?.role === 'admin' && 'Admin'}
                                    {isSelf && ' (you)'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEditNickname && nicknameEdit !== member.id && (
                                    <button
                                        type="button"
                                        onClick={() => setNicknameEdit(member.id)}
                                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10"
                                        title="Edit nickname"
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                    </button>
                                )}
                                {canKick && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(member.id)}
                                        disabled={removeMemberMutation.isPending}
                                        className="p-1 rounded text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                                        title="Remove member"
                                    >
                                        <span className="material-symbols-outlined text-base">person_remove</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={addModalOpen}
                onClose={() => {
                    setAddModalOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedToAdd([]);
                }}
                title="Add members"
                size="md"
            >
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search users..."
                            className="flex-1 px-4 py-2 rounded-lg bg-[var(--theme-surface)] border border-gray-700 text-white"
                        />
                        <Button onClick={handleSearch} disabled={searching}>
                            Search
                        </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {searchResults
                            .filter((u) => u.id !== user?.id && !memberIds.includes(u.id))
                            .map((u) => (
                                <label
                                    key={u.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedToAdd.includes(u.id)}
                                        onChange={() => toggleAdd(u.id)}
                                        className="rounded text-[var(--theme-accent)]"
                                    />
                                    <Avatar src={u.profile_picture} alt={u.name} size="sm" />
                                    <span className="text-[var(--text-primary)]">{u.name}</span>
                                    {u.username && (
                                        <span className="text-gray-500 text-sm">@{u.username}</span>
                                    )}
                                </label>
                            ))}
                        {searchResults.length === 0 && searchQuery && !searching && (
                            <p className="text-gray-500 text-sm">No users found</p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAddModalOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                            setSelectedToAdd([]);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddMembers}
                        disabled={
                            selectedToAdd.filter((id) => !memberIds.includes(id)).length === 0 ||
                            addMembersMutation.isPending
                        }
                        loading={addMembersMutation.isPending}
                    >
                        Add
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default GroupMembersPanel;
