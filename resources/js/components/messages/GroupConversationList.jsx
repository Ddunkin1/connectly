import React from 'react';
import { useGroupConversations } from '../../hooks/useGroupConversations';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate } from '../../utils/formatDate';

const GroupConversationList = ({ onSelectGroup, selectedGroupId, onNewGroup }) => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        isError,
    } = useGroupConversations();

    const groups = data?.pages.flatMap((page) => page.data?.groups || []) || [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col justify-center items-center h-full p-4">
                <p className="text-red-500 text-sm mb-2">Failed to load groups</p>
                <p className="text-gray-500 text-xs text-center">
                    {error?.response?.data?.message || 'An error occurred. Please refresh the page.'}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {groups.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full p-4 gap-4">
                        <p className="text-gray-500 text-center">No groups yet.</p>
                        {onNewGroup && (
                            <button
                                type="button"
                                onClick={onNewGroup}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined">group_add</span>
                                Create your first group
                            </button>
                        )}
                    </div>
                ) : (
                    groups.map((group) => {
                        const isSelected = selectedGroupId === group.id;
                        const memberNames = group.members?.slice(0, 3).map((m) => m.name).join(', ') || '';

                        return (
                            <button
                                key={group.id}
                                onClick={() => onSelectGroup(group)}
                                className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors text-left theme-hover ${
                                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)] font-bold text-lg">
                                        {group.name?.charAt(0)?.toUpperCase() || 'G'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 theme-text truncate">
                                        {group.name}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {memberNames || `${group.members?.length || 0} members`}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
            {hasNextPage && (
                <div className="flex justify-center py-2 border-t border-gray-200">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-sm text-[var(--theme-accent)] hover:underline"
                    >
                        {isFetchingNextPage ? 'Loading...' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GroupConversationList;
