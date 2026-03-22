import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import { AdminSkeletonBlock } from '../../components/admin/AdminSkeleton';
import AdminPostPreviewModal from '../../components/admin/AdminPostPreviewModal';
import { SUSPEND_DURATION_OPTIONS } from '../../constants/adminModeration';
import useAuthStore from '../../store/authStore';
import { REPORT_REASONS } from '../../hooks/useReports';

const STATUS_LABELS = {
    pending: 'Pending',
    reviewed: 'Reviewed',
    dismissed: 'Dismissed',
    action_taken: 'Resolved',
};

const TYPE_OPTIONS = [
    { value: 'all', label: 'All types' },
    { value: 'user', label: 'Users' },
    { value: 'post', label: 'Posts' },
    { value: 'profile_comment', label: 'Profile comments' },
];

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'dismissed', label: 'Dismissed' },
    { value: 'action_taken', label: 'Resolved' },
];

const PRIORITY_OPTIONS = [
    { value: 'all', label: 'All priority' },
    { value: 'urgent', label: 'Priority queue' },
    { value: 'standard', label: 'Standard only' },
];

/** Shared styling for filter dropdowns (native select). */
/** `appearance-none` hides the native arrow so it doesn’t stack with our chevron icon. */
const filterSelectClass =
    'w-full appearance-none rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] text-sm py-2.5 pl-3 pr-10 shadow-sm cursor-pointer hover:border-[var(--theme-accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/35 focus:border-[var(--theme-accent)]/50 disabled:opacity-60 [&::-ms-expand]:hidden';

const errMsg = (err) =>
    err?.response?.data?.message || err?.response?.data?.errors?.email?.[0] || err?.message || 'Request failed';

/** @returns {{ id: number, username: string } | null} */
function getReportTarget(r) {
    const t = r.reportable?.type;
    if (t === 'user' && r.reportable?.id) {
        return { id: r.reportable.id, username: r.reportable.username };
    }
    if (t === 'post' && r.reportable?.user?.id) {
        return { id: r.reportable.user.id, username: r.reportable.user.username };
    }
    if (t === 'profile_comment' && r.reportable?.author?.id) {
        return { id: r.reportable.author.id, username: r.reportable.author.username };
    }
    return null;
}

function FilterSelect({ id, label, value, onChange, children, disabled }) {
    return (
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:min-w-[160px] xl:max-w-[260px]">
            <label htmlFor={id} className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className={filterSelectClass}
                >
                    {children}
                </select>
                <span
                    className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-[22px] leading-none"
                    aria-hidden
                >
                    expand_more
                </span>
            </div>
        </div>
    );
}

const AdminReports = () => {
    const queryClient = useQueryClient();
    const adminUser = useAuthStore((s) => s.user);
    const [status, setStatus] = useState('pending');
    const [reportableType, setReportableType] = useState('all');
    const [reason, setReason] = useState('all');
    const [priority, setPriority] = useState('all');
    const [page, setPage] = useState(1);
    const [previewPostId, setPreviewPostId] = useState(null);
    const [suspendDuration, setSuspendDuration] = useState('7d');

    const statsQuery = useQuery({
        queryKey: ['admin-reports-stats'],
        queryFn: () => adminAPI.getReportStats(),
        select: (res) => res.data,
    });

    const listQuery = useQuery({
        queryKey: ['admin-reports', status, reportableType, reason, priority, page],
        queryFn: () =>
            adminAPI.getReports({
                status,
                reportable_type: reportableType,
                reason,
                priority,
                page,
                per_page: 15,
            }),
        select: (res) => res.data,
    });

    const dismissMutation = useMutation({
        mutationFn: (id) => adminAPI.dismissReport(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
            toast.success('Report dismissed');
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const actionTakenMutation = useMutation({
        mutationFn: (id) => adminAPI.markActionTaken(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
            toast.success('Marked as resolved');
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const removePostMutation = useMutation({
        mutationFn: (id) => adminAPI.removePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
            toast.success('Post removed');
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const suspendUserMutation = useMutation({
        mutationFn: ({ userId, duration }) => adminAPI.suspendUser(userId, { duration }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
            toast.success(res?.data?.message || 'User suspended');
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const reports = listQuery.data?.reports ?? [];
    const pagination = listQuery.data?.pagination ?? {};
    const stats = statsQuery.data;
    const pendingTotal = stats?.by_status?.pending ?? 0;

    const durationLabel = useMemo(() => {
        return SUSPEND_DURATION_OPTIONS.find((o) => o.value === suspendDuration)?.label ?? suspendDuration;
    }, [suspendDuration]);

    const clearFilters = () => {
        setReportableType('all');
        setStatus('pending');
        setReason('all');
        setPriority('all');
        setPage(1);
    };

    const handleSuspendTarget = (target) => {
        if (!target) return;
        if (target.id === adminUser?.id) {
            toast.error('You cannot suspend your own account.');
            return;
        }
        if (
            !window.confirm(
                `Suspend @${target.username} for "${durationLabel}"? They will be blocked from signing in until the suspension ends or is lifted.`
            )
        ) {
            return;
        }
        suspendUserMutation.mutate({ userId: target.id, duration: suspendDuration });
    };

    if (statsQuery.isError) {
        return (
            <div>
                <AdminPageHeader
                    eyebrow="Admin · Content moderation"
                    title="Content reports"
                    description="Review reports by users, posts, and profile comments."
                />
                <AdminErrorState
                    title="Could not load report statistics"
                    message={errMsg(statsQuery.error)}
                    onRetry={() => statsQuery.refetch()}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <AdminPageHeader
                eyebrow="Admin · Content moderation"
                title="Content reports"
                description="Triage the queue, preview reported posts in a modal, and apply suspensions with a defined duration when needed."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <AdminStatCard
                    label="Pending"
                    value={pendingTotal.toLocaleString()}
                    loading={statsQuery.isLoading}
                    accent
                />
                <AdminStatCard
                    label="Total reports"
                    value={stats?.total?.toLocaleString()}
                    loading={statsQuery.isLoading}
                />
                <AdminStatCard
                    label="By type (all)"
                    value={
                        statsQuery.isLoading
                            ? undefined
                            : `U ${stats?.by_reportable_type?.user ?? 0} · P ${stats?.by_reportable_type?.post ?? 0} · C ${stats?.by_reportable_type?.profile_comment ?? 0}`
                    }
                    loading={statsQuery.isLoading}
                    sublabel="Users · Posts · Profile comments"
                />
                <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm flex flex-col justify-center min-h-[112px]">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                        Workflow
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                        Preview the post, then remove content or suspend the author. Use{' '}
                        <strong className="text-[var(--text-primary)]">Pending</strong> first.
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
                        role="group"
                        aria-label="Report filters"
                    >
                        <FilterSelect
                            id="admin-report-type"
                            label="Type"
                            value={reportableType}
                            disabled={listQuery.isLoading}
                            onChange={(v) => {
                                setReportableType(v);
                                setPage(1);
                            }}
                        >
                            {TYPE_OPTIONS.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </FilterSelect>
                        <FilterSelect
                            id="admin-report-status"
                            label="Status"
                            value={status}
                            disabled={listQuery.isLoading}
                            onChange={(v) => {
                                setStatus(v);
                                setPage(1);
                            }}
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </FilterSelect>
                        <FilterSelect
                            id="admin-report-reason"
                            label="Reason"
                            value={reason}
                            disabled={listQuery.isLoading}
                            onChange={(v) => {
                                setReason(v);
                                setPage(1);
                            }}
                        >
                            <option value="all">All reasons</option>
                            {REPORT_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </FilterSelect>
                        <FilterSelect
                            id="admin-report-priority"
                            label="Priority"
                            value={priority}
                            disabled={listQuery.isLoading}
                            onChange={(v) => {
                                setPriority(v);
                                setPage(1);
                            }}
                        >
                            {PRIORITY_OPTIONS.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </FilterSelect>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-sm font-semibold text-[var(--theme-accent)] hover:underline text-left sm:text-center"
                        >
                            Clear filters
                        </button>
                        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide sm:text-right">
                            {listQuery.isFetching ? (
                                'Updating…'
                            ) : (
                                <>
                                    Showing{' '}
                                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                                        {reports.length}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                                        {(pagination.total ?? 0).toLocaleString()}
                                    </span>{' '}
                                    results
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {listQuery.isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 space-y-3"
                        >
                            <AdminSkeletonBlock className="h-4 w-2/3" />
                            <AdminSkeletonBlock className="h-3 w-full" />
                            <AdminSkeletonBlock className="h-20 w-full" />
                        </div>
                    ))}
                </div>
            ) : listQuery.isError ? (
                <AdminErrorState
                    title="Could not load reports"
                    message={errMsg(listQuery.error)}
                    onRetry={() => listQuery.refetch()}
                />
            ) : reports.length === 0 ? (
                <AdminEmptyState
                    icon="flag"
                    title="No reports in this view"
                    description="Change filters or check another status tab."
                />
            ) : (
                <ul className="space-y-4 list-none p-0 m-0">
                    {reports.map((r) => {
                        const target = getReportTarget(r);
                        const canSuspend = target && target.id !== adminUser?.id;

                        return (
                            <li
                                key={r.id}
                                className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-sm overflow-hidden"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(220px,280px)] gap-0 lg:gap-6">
                                    <div className="p-5 border-b lg:border-b-0 lg:border-r border-[var(--theme-border)] min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                                    r.urgent
                                                        ? 'bg-red-500/15 text-red-500'
                                                        : 'bg-[var(--theme-surface-hover)] text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                {r.urgent ? 'Priority' : 'Standard'}
                                            </span>
                                            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                                                {r.reportable?.type?.replace('_', ' ') ?? 'Unknown'}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] font-medium">
                                                {STATUS_LABELS[r.status] ?? r.status}
                                            </span>
                                        </div>

                                        <dl className="space-y-2 text-sm">
                                            <div>
                                                <dt className="text-[var(--text-secondary)] text-xs uppercase tracking-wide">
                                                    Reporter
                                                </dt>
                                                <dd className="text-[var(--text-primary)] font-medium">
                                                    @{r.reporter?.username}{' '}
                                                    <span className="text-[var(--text-secondary)] font-normal">
                                                        · {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                                                    </span>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-[var(--text-secondary)] text-xs uppercase tracking-wide">
                                                    Reason
                                                </dt>
                                                <dd className="text-[var(--text-primary)] capitalize">
                                                    {r.reason?.replace(/_/g, ' ') ?? '—'}
                                                </dd>
                                            </div>
                                            {r.description && (
                                                <div>
                                                    <dt className="text-[var(--text-secondary)] text-xs uppercase tracking-wide">
                                                        Details
                                                    </dt>
                                                    <dd className="text-[var(--text-primary)] whitespace-pre-wrap">
                                                        {r.description}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>

                                        {r.reportable?.type === 'user' && (
                                            <p className="mt-4 text-sm">
                                                <span className="text-[var(--text-secondary)]">Profile: </span>
                                                <Link
                                                    to={`/profile/${r.reportable?.username}`}
                                                    className="text-[var(--theme-accent)] font-medium hover:underline"
                                                >
                                                    @{r.reportable?.username}
                                                </Link>
                                            </p>
                                        )}

                                        {r.reportable?.type === 'post' && r.reportable?.id && (
                                            <div className="mt-4 space-y-2">
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    Author:{' '}
                                                    <span className="text-[var(--text-primary)] font-medium">
                                                        @{r.reportable?.user?.username}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-[var(--text-primary)] line-clamp-4 whitespace-pre-wrap">
                                                    {r.reportable?.content}
                                                </p>
                                                {r.reportable?.media_url && (
                                                    <div className="rounded-lg overflow-hidden border border-[var(--theme-border)] max-w-md bg-black/5">
                                                        {r.reportable?.media_type === 'image' ? (
                                                            <img
                                                                src={r.reportable.media_url}
                                                                alt=""
                                                                className="w-full max-h-40 object-cover"
                                                            />
                                                        ) : (
                                                            <p className="p-2 text-xs text-[var(--text-secondary)]">
                                                                Video attached — open preview for full player.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewPostId(r.reportable.id)}
                                                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--theme-accent)] hover:underline"
                                                >
                                                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                                                    Preview full post
                                                </button>
                                            </div>
                                        )}

                                        {r.reportable?.type === 'deleted' && (
                                            <p className="mt-4 text-amber-600 text-sm">{r.reportable?.message}</p>
                                        )}

                                        {r.reportable?.type === 'profile_comment' && (
                                            <div className="mt-4 space-y-2 text-sm">
                                                <p>
                                                    On{' '}
                                                    <Link
                                                        to={`/profile/${r.reportable?.profile_username}`}
                                                        className="text-[var(--theme-accent)] font-medium hover:underline"
                                                    >
                                                        @{r.reportable?.profile_username}
                                                    </Link>
                                                </p>
                                                <p className="text-[var(--text-secondary)]">
                                                    Comment by{' '}
                                                    {r.reportable?.author ? (
                                                        <Link
                                                            to={`/profile/${r.reportable.author.username}`}
                                                            className="text-[var(--text-primary)] hover:underline"
                                                        >
                                                            @{r.reportable.author.username}
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </p>
                                                <p className="text-[var(--text-primary)] line-clamp-4">{r.reportable?.content}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 bg-[var(--theme-surface-hover)]/30 lg:bg-transparent flex flex-col gap-3">
                                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                                            Moderation
                                        </p>
                                        {status === 'pending' && (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs text-[var(--text-secondary)]">
                                                        Suspension length
                                                    </label>
                                                    <select
                                                        value={suspendDuration}
                                                        onChange={(e) => setSuspendDuration(e.target.value)}
                                                        className="w-full text-sm rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] px-3 py-2 focus:ring-2 focus:ring-[var(--theme-accent)]/30 outline-none"
                                                    >
                                                        {SUSPEND_DURATION_OPTIONS.map((o) => (
                                                            <option key={o.value} value={o.value}>
                                                                {o.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        disabled={!canSuspend || suspendUserMutation.isPending}
                                                        onClick={() => handleSuspendTarget(target)}
                                                        className="w-full px-3 py-2 rounded-xl text-sm font-medium border border-amber-500/40 text-amber-800 bg-amber-500/10 hover:bg-amber-500/15 disabled:opacity-50"
                                                    >
                                                        Suspend account
                                                        {target ? ` @${target.username}` : ''}
                                                    </button>
                                                    {!target && (
                                                        <p className="text-xs text-[var(--text-secondary)]">
                                                            No account target for this report type.
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--theme-border)]">
                                                    {r.reportable?.type === 'post' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        'Remove this post from the platform? This cannot be undone from here.'
                                                                    )
                                                                ) {
                                                                    removePostMutation.mutate(r.id);
                                                                }
                                                            }}
                                                            disabled={removePostMutation.isPending}
                                                            className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-red-500/15 text-red-600 hover:bg-red-500/20"
                                                        >
                                                            Remove post
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    'Mark this report as resolved (action taken)?'
                                                                )
                                                            ) {
                                                                actionTakenMutation.mutate(r.id);
                                                            }
                                                        }}
                                                        disabled={actionTakenMutation.isPending}
                                                        className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/20"
                                                    >
                                                        Mark resolved
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    'Dismiss this report without further action?'
                                                                )
                                                            ) {
                                                                dismissMutation.mutate(r.id);
                                                            }
                                                        }}
                                                        disabled={dismissMutation.isPending}
                                                        className="w-full px-3 py-2 rounded-xl text-sm font-medium border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)]"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                        {status !== 'pending' && (
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                This report is closed. Change status filter to Pending for open items.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {pagination.last_page > 1 && (
                <div className="flex justify-center gap-3 mt-8 items-center flex-wrap">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-4 py-2 rounded-xl bg-[var(--theme-surface-hover)] text-[var(--text-primary)] disabled:opacity-50 text-sm font-medium"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-[var(--text-secondary)] tabular-nums">
                        Page {page} / {pagination.last_page}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= pagination.last_page}
                        className="px-4 py-2 rounded-xl bg-[var(--theme-surface-hover)] text-[var(--text-primary)] disabled:opacity-50 text-sm font-medium"
                    >
                        Next
                    </button>
                </div>
            )}

            <AdminPostPreviewModal
                postId={previewPostId}
                isOpen={!!previewPostId}
                onClose={() => setPreviewPostId(null)}
            />
        </div>
    );
};

export default AdminReports;
