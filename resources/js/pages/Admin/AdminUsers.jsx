import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import useAuthStore from '../../store/authStore';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminUsers = () => {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search, role, page],
        queryFn: () => adminAPI.getUsers({ q: search, role, page, per_page: 20 }),
        select: (res) => res.data,
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role: r }) => adminAPI.updateUserRole(userId, r),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Role updated');
        },
        onError: () => toast.error('Failed to update role'),
    });

    const suspendMutation = useMutation({
        mutationFn: (userId) => adminAPI.suspendUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User suspended');
        },
        onError: () => toast.error('Failed to suspend'),
    });

    const unsuspendMutation = useMutation({
        mutationFn: (userId) => adminAPI.unsuspendUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('User unsuspended');
        },
        onError: () => toast.error('Failed to unsuspend'),
    });

    if (!user?.role || user.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    const users = data?.users ?? [];
    const pagination = data?.pagination ?? {};

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/reports" className="px-4 py-2 rounded-lg font-medium bg-[#252538] text-gray-400 hover:text-white">Reports</Link>
                <Link to="/admin/users" className="px-4 py-2 rounded-lg font-medium bg-[var(--theme-accent)] text-white">Users</Link>
            </div>
            <h1 className="text-2xl font-bold text-white mb-6">Users</h1>

            <div className="flex gap-4 mb-6 flex-wrap">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="px-4 py-2 rounded-lg bg-[#252538] border border-gray-600 text-white placeholder-gray-500"
                />
                <select
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setPage(1); }}
                    className="px-4 py-2 rounded-lg bg-[#252538] border border-gray-600 text-white"
                >
                    <option value="">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="user">User</option>
                </select>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : users.length === 0 ? (
                <p className="text-gray-500 py-8">No users found.</p>
            ) : (
                <div className="theme-surface rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-[#1A1A2E]">
                            <tr>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Stats</th>
                                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5">
                                    <td className="px-4 py-3">
                                        <Link to={`/profile/${u.username}`} className="flex items-center gap-3 hover:opacity-80">
                                            <Avatar src={u.profile_picture} alt={u.name} size="sm" />
                                            <div>
                                                <p className="text-white font-medium">{u.name}</p>
                                                <p className="text-gray-400 text-sm">@{u.username}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={u.role ?? 'user'}
                                            onChange={(e) => updateRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                                            disabled={u.id === user.id || updateRoleMutation.isPending}
                                            className="px-2 py-1 rounded bg-[#252538] border border-gray-600 text-white text-sm"
                                        >
                                            <option value="user">User</option>
                                            <option value="moderator">Moderator</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.suspended_at ? (
                                            <span className="text-red-400">Suspended</span>
                                        ) : (
                                            <span className="text-green-400">Active</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {u.posts_count ?? 0} posts · {u.followers_count ?? 0} followers
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.id !== user.id && (
                                            u.suspended_at ? (
                                                <button
                                                    onClick={() => unsuspendMutation.mutate(u.id)}
                                                    disabled={unsuspendMutation.isPending}
                                                    className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm"
                                                >
                                                    Unsuspend
                                                </button>
                                            ) : !u.role || u.role !== 'admin' ? (
                                                <button
                                                    onClick={() => suspendMutation.mutate(u.id)}
                                                    disabled={suspendMutation.isPending}
                                                    className="px-3 py-1 rounded bg-red-500/20 text-red-400 text-sm"
                                                >
                                                    Suspend
                                                </button>
                                            ) : null
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default AdminUsers;
