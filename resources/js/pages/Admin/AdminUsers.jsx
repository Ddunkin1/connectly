import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import AdminReportUserModal from '../../components/admin/AdminReportUserModal';

const AdminUsers = () => {
    const user = useAuthStore((state) => state.user);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [viewUserId, setViewUserId] = useState(null);

    const statsQuery = useQuery({
        queryKey: ['admin-users-stats'],
        queryFn: () => adminAPI.getUserStats(),
        select: (res) => res.data,
    });

    const listQuery = useQuery({
        queryKey: ['admin-users', search, page],
        queryFn: () => adminAPI.getUsers({ q: search, page, per_page: 20 }),
        select: (res) => res.data,
    });

    const errMsg = (err) =>
        err?.response?.data?.message || err?.response?.data?.errors?.email?.[0] || err?.message || 'Request failed';

    const handleExport = async () => {
        try {
            await adminAPI.exportUsersCsv({ q: search });
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
                    description="Search and export. Use View to moderate (suspend, warn, ban) with context."
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
        <div className="space-y-8 admin-fade-up">
            <AdminPageHeader
                eyebrow="Admin · Users"
                title="Users & community"
                description="Search and export. Use View to moderate (suspend, warn, ban) with context."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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
                <AdminStatCard
                    label="Banned"
                    value={statsData?.banned?.toLocaleString()}
                    loading={statsQuery.isLoading}
                    valueClassName="text-red-500"
                    sublabel="Cannot sign in"
                    icon="gavel"
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
                    className="flex-1 min-w-[200px] px-4 py-2.5 rounded-2xl bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--theme-accent)]/40 focus:border-[var(--theme-accent)] outline-none transition-all duration-300"
                    aria-label="Search users"
                />
                <button
                    type="button"
                    onClick={handleExport}
                    className="px-4 py-2.5 rounded-2xl border border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] text-sm font-medium transition-all duration-300 hover:-translate-y-[1px]"
                >
                    Export CSV
                </button>
            </div>

            {listQuery.isLoading ? (
                <AdminTableSkeleton rows={6} cols={5} />
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
                    description="Try adjusting your search."
                />
            ) : (
                <AdminDataTable>
                    <AdminTableHead>
                        <AdminTh>User</AdminTh>
                        <AdminTh>Email</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh>Stats</AdminTh>
                        <AdminTh>Actions</AdminTh>
                    </AdminTableHead>
                    <tbody className="divide-y divide-[var(--theme-border)]">
                        {users.map((u) => (
                            <tr key={u.id} className="transition-colors duration-300 hover:bg-[var(--theme-surface-hover)]/55">
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
                                    {u.banned_at ? (
                                        <div className="text-sm">
                                            <span className="text-red-600 dark:text-red-400 font-medium">Banned</span>
                                            <span className="block text-xs text-[var(--text-secondary)] mt-0.5">
                                                {new Date(u.banned_at).toLocaleString()}
                                            </span>
                                        </div>
                                    ) : u.suspended_at ? (
                                        <div className="text-sm">
                                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                                                Suspended
                                            </span>
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
                                        <span className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-[var(--text-secondary)] text-sm">
                                    {u.posts_count ?? 0} posts · {u.followers_count ?? 0} followers
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => setViewUserId(u.id)}
                                        className="px-3 py-1.5 rounded-xl text-sm font-medium border border-[var(--theme-accent)] text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/15 transition-all duration-300 hover:-translate-y-[1px]"
                                    >
                                        View
                                    </button>
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
                        className="px-4 py-2 rounded-xl bg-[var(--theme-surface-hover)] text-[var(--text-primary)] disabled:opacity-50 transition-all duration-300 hover:-translate-y-[1px]"
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
                        className="px-4 py-2 rounded-xl bg-[var(--theme-surface-hover)] text-[var(--text-primary)] disabled:opacity-50 transition-all duration-300 hover:-translate-y-[1px]"
                    >
                        Next
                    </button>
                </div>
            )}

            <AdminReportUserModal
                userId={viewUserId}
                open={viewUserId !== null}
                onClose={() => setViewUserId(null)}
                adminUserId={user?.id}
            />
        </div>
    );
};

export default AdminUsers;
