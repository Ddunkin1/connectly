import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import { AdminTableSkeleton } from '../../components/admin/AdminSkeleton';
import AdminDataTable, { AdminTableHead, AdminTh } from '../../components/admin/AdminDataTable';
import AdminPostPreviewModal from '../../components/admin/AdminPostPreviewModal';
import AdminProfileCommentPreviewModal from '../../components/admin/AdminProfileCommentPreviewModal';
import AdminReportUserModal from '../../components/admin/AdminReportUserModal';
import AdminDismissReportModal from '../../components/admin/AdminDismissReportModal';
import useAuthStore from '../../store/authStore';
import { REPORT_REASONS } from '../../hooks/useReports';

// action_taken = moderation action (warn / suspend / ban / remove post); displayed as "Moderated"
const STATUS_LABELS = {
    pending: 'Pending',
    reviewed: 'Reviewed',
    dismissed: 'Cancelled',
    action_taken: 'Moderated',
};

const TYPE_OPTIONS = [
    { value: 'all', label: 'All types' },
    { value: 'user', label: 'Users' },
    { value: 'post', label: 'Posts' },
    { value: 'profile_comment', label: 'Profile comments' },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'All status' },
    { value: 'pending', label: 'Pending' },
    { value: 'dismissed', label: 'Cancelled' },
    { value: 'action_taken', label: 'Moderated' },
];

const PRIORITY_OPTIONS = [
    { value: 'all', label: 'All priority' },
    { value: 'urgent', label: 'Priority queue' },
    { value: 'standard', label: 'Standard only' },
];

/** Compact actions — w-fit + text-sm so labels aren’t tiny in oversized pills */
const ACTIONS_BTN_PRIMARY =
    'inline-flex items-center justify-center w-fit max-w-full py-1.5 px-3.5 rounded-lg text-sm font-medium text-white shadow-sm border border-black/10 bg-[var(--theme-accent)] hover:brightness-[1.05] active:brightness-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]/40 transition';
const ACTIONS_BTN_SECONDARY =
    'inline-flex items-center justify-center w-fit max-w-full py-1.5 px-3.5 rounded-lg text-sm font-medium border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] hover:border-[var(--theme-accent)]/45 hover:bg-[var(--theme-accent)]/10 hover:text-[var(--theme-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]/25 transition';

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

function getTargetLabel(r) {
    const t = r.reportable?.type;
    if (t === 'user' && r.reportable?.username) return `@${r.reportable.username}`;
    if (t === 'post' && r.reportable?.user?.username) return `@${r.reportable.user.username}`;
    if (t === 'profile_comment' && r.reportable?.author?.username) return `@${r.reportable.author.username}`;
    if (t === 'deleted') return '—';
    return '—';
}

function getTypeLabel(r) {
    const t = r.reportable?.type;
    if (t === 'post') return 'Post';
    if (t === 'user') return 'Profile';
    if (t === 'profile_comment') return 'Comment';
    if (t === 'deleted') return 'Removed';
    return '—';
}

function truncateText(str, max = 72) {
    if (!str) return '';
    const s = String(str).trim();
    return s.length > max ? `${s.slice(0, max)}…` : s;
}

function statusBadgeClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-amber-500/15 text-amber-950 border-amber-500/40 dark:bg-amber-400/15 dark:text-amber-100 dark:border-amber-400/40';
        case 'action_taken':
            return 'bg-emerald-500/15 text-emerald-950 border-emerald-500/40 dark:bg-emerald-400/18 dark:text-emerald-50 dark:border-emerald-400/45';
        case 'dismissed':
            return 'bg-slate-500/12 text-slate-800 border-slate-400/35 dark:bg-slate-400/14 dark:text-slate-100 dark:border-slate-400/35';
        case 'reviewed':
            return 'bg-[var(--theme-accent)]/12 text-[var(--theme-accent)] border-[var(--theme-accent)]/35 dark:bg-[var(--theme-accent)]/22';
        default:
            return 'bg-[var(--theme-surface-hover)] text-[var(--text-primary)] border-[var(--theme-border)]';
    }
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
    const [status, setStatus] = useState('all');
    const [reportableType, setReportableType] = useState('all');
    const [reason, setReason] = useState('all');
    const [priority, setPriority] = useState('all');
    const [page, setPage] = useState(1);
    /** @type {null | { postId: number, authorUserId: number | null, reportId: number, status: string, reportReason?: string }} */
    const [postPreview, setPostPreview] = useState(null);
    /** Full report row for profile-comment preview (same flow as post preview). */
    const [commentPreview, setCommentPreview] = useState(null);
    const [moderateUserId, setModerateUserId] = useState(null);
    const [dismissModalReportId, setDismissModalReportId] = useState(null);

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
        mutationFn: ({ reportId, reason, message }) =>
            adminAPI.dismissReport(reportId, { reason, message }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
            toast.success('Report cancelled — reporter notified');
            setDismissModalReportId(null);
            setPostPreview(null);
            setCommentPreview(null);
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const actionTakenMutation = useMutation({
        mutationFn: (id) => adminAPI.markActionTaken(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
            toast.success('Marked as moderated');
            setPostPreview(null);
            setCommentPreview(null);
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const removePostMutation = useMutation({
        mutationFn: (id) => adminAPI.removePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
            toast.success('Post removed');
            setPostPreview(null);
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const removeProfileCommentMutation = useMutation({
        mutationFn: (id) => adminAPI.removeProfileComment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
            toast.success('Comment removed');
            setCommentPreview(null);
        },
        onError: (err) => toast.error(errMsg(err)),
    });

    const reports = listQuery.data?.reports ?? [];
    const pagination = listQuery.data?.pagination ?? {};
    const stats = statsQuery.data;
    const pendingTotal = stats?.by_status?.pending ?? 0;

    const clearFilters = () => {
        setReportableType('all');
        setStatus('all');
        setReason('all');
        setPriority('all');
        setPage(1);
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
        <div className="space-y-8 admin-fade-up">
            <AdminPageHeader
                eyebrow="Admin · Content moderation"
                title="Content reports"
                description="Triage the queue: use Preview post or Preview comment to review content, the reported user, and report actions in one place."
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
                    sublabel="All status · all time"
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
                <div className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.5)] flex flex-col justify-center min-h-[112px] transition-all duration-300 hover:border-[var(--theme-accent)]/25">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                        Workflow
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                        Use <strong className="text-[var(--text-primary)]">Status</strong> for Pending, Moderated, or
                        Cancelled. Total above counts every report; the list follows your filters.
                    </p>
                </div>
            </div>

            <div className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 sm:p-5 shadow-[0_12px_34px_-18px_rgba(0,0,0,0.55)]">
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
                        <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide sm:text-right max-w-md sm:max-w-none">
                            {listQuery.isFetching ? (
                                'Updating…'
                            ) : (
                                <>
                                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                                        {(pagination.total ?? 0).toLocaleString()}
                                    </span>{' '}
                                    report{(pagination.total ?? 0) === 1 ? '' : 's'} match filters
                                    {stats?.total != null && (
                                        <>
                                            {' '}
                                            · Total in system:{' '}
                                            <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                                                {stats.total.toLocaleString()}
                                            </span>{' '}
                                            (all status)
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {listQuery.isLoading ? (
                <AdminTableSkeleton rows={6} cols={7} />
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
                    description="Try Status → All status, or filter by Pending / Moderated / Cancelled. Total above counts every report in the system."
                />
            ) : (
                <div className="space-y-4">
                    <AdminDataTable className="min-w-[920px]">
                        <AdminTableHead>
                            <AdminTh>Target</AdminTh>
                            <AdminTh>Type</AdminTh>
                            <AdminTh>Reporter</AdminTh>
                            <AdminTh>Reason</AdminTh>
                            <AdminTh>Status</AdminTh>
                            <AdminTh>Reported</AdminTh>
                            <AdminTh className="min-w-[220px]">Actions</AdminTh>
                        </AdminTableHead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {reports.map((r) => {
                                const target = getReportTarget(r);
                                const isPostReport = r.reportable?.type === 'post' && r.reportable?.id;
                                const isProfileCommentReport =
                                    r.reportable?.type === 'profile_comment' && r.reportable?.id;
                                const isContentPreviewReport = isPostReport || isProfileCommentReport;
                                const summary =
                                    r.description ||
                                    (r.reportable?.type === 'post' ? r.reportable?.content : '') ||
                                    (r.reportable?.type === 'profile_comment' ? r.reportable?.content : '') ||
                                    '';
                                return (
                                    <tr key={r.id} className="hover:bg-[var(--theme-surface-hover)]/50 align-top">
                                        <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">
                                            {getTargetLabel(r)}
                                            {r.urgent && (
                                                <span className="ml-1 text-[10px] font-bold uppercase text-red-500">
                                                    Prio
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                            {getTypeLabel(r)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                                            @{r.reporter?.username ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm max-w-[220px]">
                                            <span className="font-medium capitalize text-[var(--text-primary)]">
                                                {r.reason?.replace(/_/g, ' ') ?? '—'}
                                            </span>
                                            {summary ? (
                                                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                                                    {truncateText(summary, 120)}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-md border ${statusBadgeClass(r.status)}`}
                                            >
                                                {STATUS_LABELS[r.status] ?? r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                            {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                                                {isPostReport && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPostPreview({
                                                                postId: r.reportable.id,
                                                                authorUserId:
                                                                    target?.id ?? r.reportable?.user?.id ?? null,
                                                                reportId: r.id,
                                                                status: r.status,
                                                                reportReason: r.reason,
                                                            })
                                                        }
                                                        className={
                                                            r.status === 'pending'
                                                                ? ACTIONS_BTN_PRIMARY
                                                                : ACTIONS_BTN_SECONDARY
                                                        }
                                                    >
                                                        Preview post
                                                    </button>
                                                )}
                                                {isProfileCommentReport && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCommentPreview(r)}
                                                        className={
                                                            r.status === 'pending'
                                                                ? ACTIONS_BTN_PRIMARY
                                                                : ACTIONS_BTN_SECONDARY
                                                        }
                                                    >
                                                        Preview comment
                                                    </button>
                                                )}
                                                {!isContentPreviewReport && target && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setModerateUserId(target.id)}
                                                        className={
                                                            r.status === 'pending'
                                                                ? ACTIONS_BTN_PRIMARY
                                                                : ACTIONS_BTN_SECONDARY
                                                        }
                                                    >
                                                        Moderate user
                                                    </button>
                                                )}
                                                {r.status === 'pending' && isContentPreviewReport && (
                                                    <span className="text-[11px] text-[var(--text-secondary)] leading-snug max-w-[220px]">
                                                        Preview: moderation actions update report status automatically
                                                        (moderated or cancelled).
                                                    </span>
                                                )}
                                                {r.status === 'pending' && !isContentPreviewReport && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    window.confirm(
                                                                        'Mark this report as moderated (you took action: warning, suspension, etc.)?'
                                                                    )
                                                                ) {
                                                                    actionTakenMutation.mutate(r.id);
                                                                }
                                                            }}
                                                            disabled={actionTakenMutation.isPending}
                                                            className="inline-flex items-center justify-center w-fit py-1.5 px-3 rounded-lg text-sm font-medium bg-emerald-600/12 text-emerald-950 border border-emerald-600/30 hover:bg-emerald-600/18 dark:bg-emerald-400/16 dark:text-emerald-50 dark:border-emerald-400/40 dark:hover:bg-emerald-400/24"
                                                        >
                                                            Mark moderated
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDismissModalReportId(r.id)}
                                                            disabled={dismissMutation.isPending}
                                                            className="inline-flex items-center justify-center w-fit py-1.5 px-3 rounded-lg text-sm font-medium border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)]"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {r.status !== 'pending' && (
                                                    <span className="text-[11px] text-[var(--text-secondary)] leading-snug max-w-[220px]">
                                                        Closed — only Pending rows can be moderated here.
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </AdminDataTable>
                </div>
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
                postId={postPreview?.postId}
                isOpen={!!postPreview}
                onClose={() => setPostPreview(null)}
                authorUserId={postPreview?.authorUserId ?? undefined}
                adminUserId={adminUser?.id}
                reportContext={
                    postPreview
                        ? {
                              reportId: postPreview.reportId,
                              status: postPreview.status,
                              removePending: removePostMutation.isPending,
                              dismissPending: dismissMutation.isPending,
                              onRequestDismiss: () => setDismissModalReportId(postPreview.reportId),
                              onRemovePost:
                                  postPreview.status === 'pending'
                                      ? () => {
                                            if (
                                                window.confirm(
                                                    'Remove this post from the platform? This cannot be undone from here.'
                                                )
                                            ) {
                                                removePostMutation.mutate(postPreview.reportId);
                                            }
                                        }
                                      : undefined,
                          }
                        : undefined
                }
            />

            <AdminProfileCommentPreviewModal
                report={commentPreview}
                isOpen={!!commentPreview}
                onClose={() => setCommentPreview(null)}
                authorUserId={
                    commentPreview?.reportable?.author?.id != null
                        ? commentPreview.reportable.author.id
                        : undefined
                }
                adminUserId={adminUser?.id}
                reportContext={
                    commentPreview
                        ? {
                              reportId: commentPreview.id,
                              status: commentPreview.status,
                              removePending: removeProfileCommentMutation.isPending,
                              dismissPending: dismissMutation.isPending,
                              onRequestDismiss: () => setDismissModalReportId(commentPreview.id),
                              onRemoveComment:
                                  commentPreview.status === 'pending'
                                      ? () => {
                                            if (
                                                window.confirm(
                                                    'Remove this comment from the platform? This cannot be undone from here.'
                                                )
                                            ) {
                                                removeProfileCommentMutation.mutate(commentPreview.id);
                                            }
                                        }
                                      : undefined,
                          }
                        : undefined
                }
            />

            <AdminReportUserModal
                userId={moderateUserId}
                open={moderateUserId !== null}
                onClose={() => setModerateUserId(null)}
                adminUserId={adminUser?.id}
            />

            <AdminDismissReportModal
                isOpen={dismissModalReportId !== null}
                onClose={() => setDismissModalReportId(null)}
                initialReason={
                    reports.find((r) => r.id === dismissModalReportId)?.reason ??
                    (postPreview?.reportId === dismissModalReportId ? postPreview.reportReason : undefined) ??
                    (commentPreview?.id === dismissModalReportId ? commentPreview.reason : undefined)
                }
                onConfirm={(payload) => {
                    if (dismissModalReportId == null) return;
                    dismissMutation.mutate({ reportId: dismissModalReportId, ...payload });
                }}
                isPending={dismissMutation.isPending}
            />
        </div>
    );
};

export default AdminReports;
