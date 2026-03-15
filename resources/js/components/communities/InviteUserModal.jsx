import React, { useState, useCallback, useEffect } from 'react';
import { searchAPI } from '../../services/api';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import useAuthStore from '../../store/authStore';

const DEBOUNCE_MS = 280;

const InviteUserModal = ({ isOpen, onClose, title, onSelect, loading }) => {
    const user = useAuthStore((state) => state.user);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const doSearch = useCallback(async (searchTerm) => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await searchAPI.search(searchTerm.trim(), 'users');
            const users = res.data?.users?.data ?? res.data?.users ?? [];
            const list = Array.isArray(users) ? users : [];
            setResults(list.filter((u) => u.id !== user?.id));
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, [user?.id]);

    // Realtime search: run after user stops typing (debounced)
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const timer = window.setTimeout(() => {
            doSearch(query);
        }, DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [query, doSearch]);

    const handleSelect = (u) => {
        onSelect(u.id);
        onClose();
        setQuery('');
        setResults([]);
    };

    const handleClose = () => {
        setQuery('');
        setResults([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                />
                <div className="max-h-64 overflow-y-auto space-y-1 border border-[var(--theme-border)] rounded-lg p-2">
                    {searching && (
                        <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                        </div>
                    )}
                    {!searching && results.length === 0 && query.trim() && (
                        <p className="text-sm text-[var(--text-secondary)] py-4 text-center">No users found</p>
                    )}
                    {!searching && results.map((u) => (
                        <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelect(u)}
                            disabled={loading}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--theme-surface-hover)] text-left transition-colors disabled:opacity-50"
                        >
                            <Avatar src={u.profile_picture} alt={u.name} size="md" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{u.name}</p>
                                <p className="text-xs text-[var(--text-secondary)] truncate">@{u.username}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default InviteUserModal;
