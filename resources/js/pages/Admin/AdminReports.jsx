import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import useAuthStore from '../../store/authStore';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminReports = () => {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const [status, setStatus] = useState('pending');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-reports', status, page],
        queryFn: () => adminAPI.getReports({ status, page, per_page: 15 }),
        select: (res) => res.data,
    });

    const dismissMutation = useMutation({
        mutationFn: (id) => adminAPI.dismissReport(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            toast.success('Report dismissed');
        },
        onError: () => toast.error('Failed to dismiss'),
    });

    const actionTakenMutation = useMutation({
        mutationFn: (id) => adminAPI.markActionTaken(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            toast.success('Marked as action taken');
        },
        onError: () => toast.error('Failed'),
    });

    const removePostMutation = useMutation({
        mutationFn: (id) => adminAPI.removePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            toast.success('Post removed');
        },
        onError: () => toast.error('Failed to remove post'),
    });

    if (!user?.role || user.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    const reports = data?.reports ?? [];
    const pagination = data?.pagination ?? {};

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/reports" className="px-4 py-2 rounded-lg font-medium bg-[var(--theme-accent)] text-white">Reports</Link>
                <Link to="/admin/users" className="px-4 py-2 rounded-lg font-medium bg-[#252538] text-gray-400 hover:text-white">Users</Link>
            </div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Reports</h1>
                <div className="flex gap-2">
                    {['pending', 'reviewed', 'dismissed', 'action_taken'].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatus(s); setPage(1); }}
                            className={`px-3 py-1 rounded text-sm ${status === s ? 'bg-[var(--theme-accent)] text-white' : 'bg-[#252538] text-gray-400'}`}
                        >
                            {s.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : reports.length === 0 ? (
                <p className="text-gray-500 py-8">No reports.</p>
            ) : (
                <div className="space-y-4">
                    {reports.map((r) => (
                        <div key={r.id} className="theme-surface rounded-lg p-4 border border-gray-700">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-400 text-sm">
                                        Reported by @{r.reporter?.username} · {r.reason} · {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                                    </p>
                                    {r.description && <p className="text-gray-300 mt-2 text-sm">{r.description}</p>}
                                    {r.reportable?.type === 'user' && (
                                        <p className="text-white mt-2">
                                            User: <Link to={`/profile/${r.reportable?.username}`} className="text-[var(--theme-accent)] hover:underline">@{r.reportable?.username}</Link>
                                        </p>
                                    )}
                                    {r.reportable?.type === 'post' && (
                                        <p className="text-white mt-2">
                                            Post by @{r.reportable?.user?.username}: <span className="text-gray-400">{r.reportable?.content}</span>
                                            {r.reportable?.id && (
                                                <Link to={`/post/${r.reportable.id}`} className="ml-2 text-[var(--theme-accent)] hover:underline">View</Link>
                                            )}
                                        </p>
                                    )}
                                </div>
                                {status === 'pending' && (
                                    <div className="flex flex-wrap gap-2 shrink-0">
                                        {r.reportable?.type === 'post' && (
                                            <button
                                                onClick={() => removePostMutation.mutate(r.id)}
                                                disabled={removePostMutation.isPending}
                                                className="px-3 py-1 rounded bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30"
                                            >
                                                Remove post
                                            </button>
                                        )}
                                        <button
                                            onClick={() => actionTakenMutation.mutate(r.id)}
                                            disabled={actionTakenMutation.isPending}
                                            className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm"
                                        >
                                            Action taken
                                        </button>
                                        <button
                                            onClick={() => dismissMutation.mutate(r.id)}
                                            disabled={dismissMutation.isPending}
                                            className="px-3 py-1 rounded bg-gray-500/20 text-gray-400 text-sm"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pagination.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-4 py-2 rounded bg-[#252538] text-white disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= pagination.last_page}
                        className="px-4 py-2 rounded bg-[#252538] text-white disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
