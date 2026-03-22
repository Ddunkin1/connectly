import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import useAuthStore from '../../store/authStore';
import Avatar from '../../components/common/Avatar';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminDataTable, { AdminTableHead, AdminTh } from '../../components/admin/AdminDataTable';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import { AdminTableSkeleton } from '../../components/admin/AdminSkeleton';
import { SUSPEND_DURATION_OPTIONS } from '../../constants/adminModeration';

const AdminUsers = () => {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(1);
    const [suspendDuration, setSuspendDuration] = useState('7d');

    const statsQuery = useQuery({
        queryKey: ['admin-users-stats'],
        queryFn: () => adminAPI.getUserStats(),
        select: (res) => res.data,
    });

    const listQuery = useQuery({
        queryKey: ['admin-users', search, role, page],
        queryFn: () => adminAPI.getUsers({ q: search, role, page, per_page: 20 }),
        select: (res) => res.data,
    });

    const errMsg = (err) =>
        err?.response?.data?.message || err?.response?.data?.errors?.email?.[0] || err?.message || 'Request failed';

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role: r }) => adminAPI.updateUserRole(userId, r),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
            toast.success('Role updated');
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const suspendMutation = useMutation({
        mutationFn: ({ userId, duration }) => adminAPI.suspendUser(userId, { duration }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
            toast.success(res?.data?.message || 'User suspended');
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const unsuspendMutation = useMutation({
        mutationFn: (userId) => adminAPI.unsuspendUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
            toast.success('User unsuspended');
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const handleExport = async () => {
        try {
            await adminAPI.exportUsersCsv({ q: search, role });
            toast.success('Export started');
        } catch (err) {
            toast.error(errMsg(err));
        }
    };

    const users = listQuery.data?.users ?? [];
    const pagination = listQuery.data?.pagination ?? {};
    const statsData = statsQuery.data;

    if (statsQuery.isError) {
        return (
            <div>
                <AdminPageHeader
                    eyebrow="Admin · Users"
                    title="Users & community"
                    description="Search, roles, suspend, and export."
                />
                <AdminErrorState
                    title="Could not load statistics"
                    message={errMsg(statsQuery.error)}
                    onRetry={() => statsQuery.refetch()}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <AdminPageHeader
                eyebrow="Admin · Users"
                title="Users & community"
                description="Search, roles, suspend, and export."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <AdminStatCard
                    label="Total users"
                    value={statsData?.total_users?.toLocaleString()}
                    loading={statsQuery.isLoading}
                />
                <AdminStatCard
                    label="New this week"
                    value={statsData?.new_this_week?.toLocaleString()}
                    loading={statsQuery.isLoading}
                />
                <AdminStatCard
                    label="Suspended"
                    value={statsData?.suspended?.toLocaleString()}
                    loading={statsQuery.isLoading}
                    valueClassName="text-amber-500"
                    sublabel="Requires review"
                />
            </div>

            <div className="flex gap-3 mb-6 flex-wrap items-center">
                <input
                    type="search"
                    placeholder="Search name, username, email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] outline-none"
                    aria-label="Search users"
                />
                <select
                    value={role}
                    onChange={(e) => {
                        setRole(e.target.value);
                        setPage(1);
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)]"
                    aria-label="Filter by role"
                >
                    <option value="">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="user">User</option>
                </select>
                <div className="flex items-center gap-2 min-w-[200px]">
                    <label htmlFor="suspend-duration" className="text-xs text-[var(--text-secondary)] sr-only">
                        Default suspend duration
                    </label>
                    <select
                        id="suspend-duration"
                        value={suspendDuration}
                        onChange={(e) => setSuspendDuration(e.target.value)}
                        className="px-3 py-2 rounded-xl text-sm bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)]"
                        title="Suspension length when using Suspend in the table"
                    >
                        {SUSPEND_DURATION_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={handleExport}
                    className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] text-sm font-medium"
                >
                    Export CSV
                </button>
            </div>

            {listQuery.isLoading ? (
                <AdminTableSkeleton rows={6} cols={6} />
            ) : listQuery.isError ? (
                <AdminErrorState
                    title="Could not load users"
                    message={errMsg(listQuery.error)}
                    onRetry={() => listQuery.refetch()}
                />
            ) : users.length === 0 ? (
                <AdminEmptyState
                    icon="person_off"
                    title="No users in this view"
                    description="Try adjusting search or role filters."
                />
            ) : (
                <AdminDataTable>
                    <AdminTableHead>
                        <AdminTh>User</AdminTh>
                        <AdminTh>Email</AdminTh>
                        <AdminTh>Role</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh>Stats</AdminTh>
                        <AdminTh>Actions</AdminTh>
                    </AdminTableHead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-[var(--theme-surface-hover)]/50">
                                <td className="px-4 py-3">
                                    <Link
                                        to={`/profile/${u.username}`}
                                        className="flex items-center gap-3 hover:opacity-90"
                                    >
                                        <Avatar src={u.profile_picture} alt={u.name} size="sm" />
                                        <div>
                                            <p className="text-[var(--text-primary)] font-medium">{u.name}</p>
                                            <p className="text-[var(--text-secondary)] text-sm">@{u.username}</p>
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-[200px] truncate">
                                    {u.email ?? '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        value={u.role ?? 'user'}
                                        onChange={(e) =>
                                            updateRoleMutation.mutate({ userId: u.id, role: e.target.value })
                                        }
                                        disabled={u.id === user.id || updateRoleMutation.isPending}
                                        className="px-2 py-1 rounded-lg bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] text-sm"
                                        aria-label={`Role for ${u.username}`}
                                    >
                                        <option value="user">User</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    {u.suspended_at ? (
                                        <div className="text-sm">
                                            <span className="text-red-500 font-medium">Suspended</span>
                                            {u.suspended_until ? (
                                                <span className="block text-xs text-[var(--text-secondary)] mt-0.5">
                                                    Until {new Date(u.suspended_until).toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="block text-xs text-[var(--text-secondary)] mt-0.5">
                                                    No auto end date
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-emerald-600 text-sm font-medium">Active</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-[var(--text-secondary)] text-sm">
                                    {u.posts_count ?? 0} posts · {u.followers_count ?? 0} followers
                                </td>
                                <td className="px-4 py-3">
                                    {u.id !== user.id &&
                                        (u.suspended_at ? (
                                            <button
                                                type="button"
                                                onClick={() => unsuspendMutation.mutate(u.id)}
                                                disabled={unsuspendMutation.isPending}
                                                className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 text-sm"
                                            >
                                                Unsuspend
                                            </button>
                                        ) : !u.role || u.role !== 'admin' ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const label =
                                                        SUSPEND_DURATION_OPTIONS.find((o) => o.value === suspendDuration)
                                                            ?.label ?? suspendDuration;
                                                    if (
                                                        window.confirm(
                                                            `Suspend @${u.username} for "${label}"? They cannot sign in until the suspension ends or you unsuspend them.`
                                                        )
                                                    ) {
                                                        suspendMutation.mutate({
                                                            userId: u.id,
                                                            duration: suspendDuration,
                                                        });
                                                    }
                                                }}
                                                disabled={suspendMutation.isPending}
                                                className="px-3 py-1 rounded-lg bg-red-500/15 text-red-600 text-sm font-medium"
                                            >
                                                Suspend
                                            </button>
                                        ) : null)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </AdminDataTable>
            )}

            {pagination.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-4 py-2 rounded-xl bg-[var(--theme-surface-hover)] text-[var(--text-primary)] disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="self-center text-sm text-[var(--text-secondary)] px-2">
                        Page {page} of {pagination.last_page}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= pagination.last_page}
                        className="px-4 py-2 rounded-xl bg-[var(--theme-surface-hover)] text-[var(--text-primary)] disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
