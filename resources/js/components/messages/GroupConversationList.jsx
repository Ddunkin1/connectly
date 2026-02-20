import React from 'react';
import { useGroupConversations } from '../../hooks/useGroupConversations';
import LoadingSpinner from '../common/LoadingSpinner';

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
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
                {groups.length === 0 ? (
                    <div className="flex flex-col justify-center items-center py-12 px-4 gap-4">
                        <p className="text-slate-500 text-sm text-center">No groups yet.</p>
                        {onNewGroup && (
                            <button
                                type="button"
                                onClick={onNewGroup}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined">group_add</span>
                                Create your first group
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {groups.map((group) => {
                            const isSelected = selectedGroupId === group.id;
                            const memberNames = group.members?.slice(0, 3).map((m) => m.name).join(', ') || '';

                            return (
                                <button
                                    key={group.id}
                                    onClick={() => onSelectGroup(group)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                                        isSelected ? 'bg-[#2C2C2C]' : 'hover:bg-[#252525]'
                                    }`}
                                >
                                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                        {group.name?.charAt(0)?.toUpperCase() || 'G'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{group.name}</p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {memberNames || `${group.members?.length || 0} members`}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            {hasNextPage && (
                <div className="flex justify-center py-2 border-t border-[#3A3A3A]">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                        {isFetchingNextPage ? 'Loading...' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GroupConversationList;
