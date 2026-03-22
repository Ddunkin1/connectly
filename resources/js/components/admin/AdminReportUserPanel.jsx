import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import {
    REPORT_REASONS,
    getModerationWarningMessageTemplate,
    getBanMessageTemplate,
} from '../../hooks/useReports';
import { SUSPEND_DURATION_OPTIONS } from '../../constants/adminModeration';
import toast from 'react-hot-toast';
import Avatar from '../common/Avatar';

const errMsg = (err) =>
    err?.response?.data?.message || err?.response?.data?.errors?.email?.[0] || err?.message || 'Request failed';

function initialsFromName(name) {
    if (!name || !String(name).trim()) return '?';
    const parts = String(name).trim().split(/\s+/);
    const a = parts[0][0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase().slice(0, 2);
}

function formatAgo(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 0) return 'Just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

const selectClass =
    'w-full appearance-none rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] text-sm py-2.5 pl-3 pr-10 [&::-ms-expand]:hidden';

const tabBtn = (active) =>
    `pb-2 px-1 text-sm font-semibold border-b-2 transition-colors ${
        active
            ? 'text-[var(--theme-accent)] border-[var(--theme-accent)]'
            : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
    }`;

/**
 * Shared user moderation UI (violations / reports / activity + warn / suspend / ban).
 * Use inside AdminReportUserModal or embedded beside a post preview.
 *
 * @param {'modal'|'embedded'} variant — modal: use parent header to close; embedded has no close control here.
 * @param {number} [resolveReportId] — pending queue report id: after warn/suspend/ban, marks report moderated (action taken).
 * @param {() => void} [onReportModerated] — e.g. close the post preview modal after the report is marked moderated.
 * @param {number} [warnPostId] — when warning from a post context, links the warning to this post for the member.
 */
export default function AdminReportUserPanel({
    userId,
    enabled,
    adminUserId,
    onClose,
    variant = 'modal',
    resolveReportId,
    onReportModerated,
    warnPostId,
}) {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('violations');
    const [warnOpen, setWarnOpen] = useState(false);
    const [suspendOpen, setSuspendOpen] = useState(false);
    const [banOpen, setBanOpen] = useState(false);
    const [suspendDuration, setSuspendDuration] = useState('7d');
    const [warnReason, setWarnReason] = useState('spam');
    const [warnMessage, setWarnMessage] = useState('');
    const [banReason, setBanReason] = useState('other');
    const [banMessage, setBanMessage] = useState('');

    const detailQuery = useQuery({
        queryKey: ['admin-user-moderation', userId],
        queryFn: () => adminAPI.getUserModeration(userId).then((r) => r.data),
        enabled: enabled && !!userId,
    });

    useEffect(() => {
        if (enabled) {
            setTab('violations');
            setWarnOpen(false);
            setSuspendOpen(false);
            setBanOpen(false);
            setWarnMessage('');
            setBanMessage('');
            setBanReason('other');
        }
    }, [enabled, userId]);

    useEffect(() => {
        if (warnOpen) {
            setWarnMessage(getModerationWarningMessageTemplate(warnReason));
        }
    }, [warnOpen, warnReason]);

    useEffect(() => {
        if (banOpen) {
            setBanMessage(getBanMessageTemplate(banReason));
        }
    }, [banOpen, banReason]);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-user-moderation', userId] });
        queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
    };

    const warnMutation = useMutation({
        mutationFn: () => {
            const body = { reason: warnReason, message: warnMessage.trim() };
            if (warnPostId) body.post_id = warnPostId;
            return adminAPI.warnUser(userId, body);
        },
        onSuccess: async () => {
            setWarnOpen(false);
            setWarnMessage('');
            invalidate();
            if (resolveReportId) {
                try {
                    await adminAPI.markActionTaken(resolveReportId);
                    await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
                    await queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
                    toast.success('Warning sent — report marked moderated');
                    onReportModerated?.();
                } catch (e) {
                    toast.error(errMsg(e));
                    toast.success('Warning sent');
                }
            } else {
                toast.success('Warning sent');
            }
        },
        onError: (e) => toast.error(errMsg(e)),
    });

    const suspendMutation = useMutation({
        mutationFn: () => adminAPI.suspendUser(userId, { duration: suspendDuration }),
        onSuccess: async (res) => {
            setSuspendOpen(false);
            invalidate();
            if (resolveReportId) {
                try {
                    await adminAPI.markActionTaken(resolveReportId);
                    await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
                    await queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
                    toast.success('User suspended — report marked moderated');
                    onReportModerated?.();
                } catch (e) {
                    toast.error(errMsg(e));
                    toast.success(res?.data?.message || 'User suspended');
                }
            } else {
                toast.success(res?.data?.message || 'User suspended');
            }
        },
        onError: (e) => toast.error(errMsg(e)),
    });

    const banMutation = useMutation({
        mutationFn: () =>
            adminAPI.banUser(userId, { reason: banReason, message: banMessage.trim() }),
        onSuccess: async () => {
            setBanOpen(false);
            setBanMessage('');
            setBanReason('other');
            invalidate();
            if (resolveReportId) {
                try {
                    await adminAPI.markActionTaken(resolveReportId);
                    await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
                    await queryClient.invalidateQueries({ queryKey: ['admin-reports-stats'] });
                    toast.success('User banned — report marked moderated');
                } catch (e) {
                    toast.error(errMsg(e));
                    toast.success('User banned');
                }
            } else {
                toast.success('User banned');
            }
            onClose?.();
        },
        onError: (e) => toast.error(errMsg(e)),
    });

    const unsuspendMutation = useMutation({
        mutationFn: () => adminAPI.unsuspendUser(userId),
        onSuccess: () => {
            toast.success('User unsuspended');
            invalidate();
        },
        onError: (e) => toast.error(errMsg(e)),
    });

    if (!enabled || !userId) return null;

    const u = detailQuery.data?.user;
    const activity = detailQuery.data?.activity;
    const violations = detailQuery.data?.violations ?? [];
    const reports = detailQuery.data?.reports ?? [];
    const isSelf = adminUserId && u?.id === adminUserId;
    const canModerate = !isSelf && u?.role !== 'admin';

    const handleBanClick = () => {
        if (!canModerate) return;
        setBanOpen(true);
    };

    const overlayZ = 'z-[200]';

    return (
        <>
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden w-full min-w-0">
                {/* Fixed header: identity + tabs stay visible; only the section below scrolls */}
                <div className="shrink-0 px-5 pt-4 pb-0 bg-[var(--theme-surface)] border-b border-[var(--theme-border)]">
                    {detailQuery.isLoading && (
                        <p className="text-sm text-[var(--text-secondary)] pb-4">Loading…</p>
                    )}
                    {detailQuery.isError && (
                        <p className="text-sm text-red-600 pb-4">{errMsg(detailQuery.error)}</p>
                    )}
                    {u && (
                        <>
                            <div className="flex gap-4 pb-3">
                                <div className="shrink-0">
                                    {u.profile_picture ? (
                                        <Avatar src={u.profile_picture} alt={u.name} size="xl" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                                            {initialsFromName(u.name)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <p className="font-semibold text-[var(--text-primary)] truncate">{u.name}</p>
                                    <p className="text-sm text-[var(--text-secondary)]">@{u.username}</p>
                                    <p className="text-sm text-[var(--text-secondary)] truncate">{u.email}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Joined{' '}
                                        {u.created_at
                                            ? new Date(u.created_at).toLocaleDateString(undefined, {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric',
                                              })
                                            : '—'}
                                    </p>
                                    {u.banned_at && (
                                        <p className="text-xs font-semibold text-red-600">Banned</p>
                                    )}
                                    {u.suspended_at && !u.banned_at && (
                                        <p className="text-xs font-semibold text-amber-700">Suspended</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-6 pt-1 pb-2 border-b border-[var(--theme-border)]">
                                {['violations', 'reports', 'activity'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        className={tabBtn(tab === t)}
                                        onClick={() => setTab(t)}
                                    >
                                        {t === 'violations' && 'Violations'}
                                        {t === 'reports' && 'Reports'}
                                        {t === 'activity' && 'Activity'}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Scrollable: Violations / Reports / Activity — parent modal must have explicit height so flex-1 gets space */}
                <div className="min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden px-5 py-4 overscroll-contain">
                    {u && (
                        <div>
                            {tab === 'violations' && (
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-1 mb-2">
                                        <span className="text-amber-500">⚠️</span> Violation history
                                    </p>
                                    {violations.length === 0 ? (
                                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-[var(--text-primary)]">
                                            No violations yet.
                                        </div>
                                    ) : (
                                        <ul className="space-y-2 text-sm">
                                            {violations.map((v) => (
                                                <li
                                                    key={v.id}
                                                    className="rounded-lg border border-[var(--theme-border)] p-3"
                                                >
                                                    <div className="flex justify-between gap-2 text-xs text-[var(--text-secondary)]">
                                                        <span className="font-semibold uppercase text-[var(--text-primary)]">
                                                            {v.action}
                                                        </span>
                                                        <span>
                                                            {v.created_at
                                                                ? new Date(v.created_at).toLocaleString()
                                                                : ''}
                                                        </span>
                                                    </div>
                                                    {v.reason_code && (
                                                        <p className="mt-1 text-[var(--text-primary)]">
                                                            Reason:{' '}
                                                            <span className="capitalize">
                                                                {v.reason_code.replace(/_/g, ' ')}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {v.message && (
                                                        <p className="mt-1 text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                                                            {v.message}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {tab === 'reports' && (
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-1 mb-2">
                                        <span className="text-red-500">🚩</span> Current reports
                                    </p>
                                    {reports.length === 0 ? (
                                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-[var(--text-primary)]">
                                            No reports filed against this user.
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {reports.map((r) => (
                                                <li
                                                    key={r.id}
                                                    className="rounded-lg border border-[var(--theme-border)] p-2 text-xs"
                                                >
                                                    <span className="font-semibold capitalize">
                                                        {r.reason?.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[var(--text-secondary)] mx-1">·</span>
                                                    <span>{r.status}</span>
                                                    <p className="text-[var(--text-secondary)] mt-0.5">
                                                        @{r.reporter?.username} ·{' '}
                                                        {r.created_at
                                                            ? new Date(r.created_at).toLocaleString()
                                                            : ''}
                                                    </p>
                                                    {r.description && (
                                                        <p className="text-[var(--text-primary)] mt-1 line-clamp-2">
                                                            {r.description}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {tab === 'activity' && activity && (
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-1 mb-2">
                                        <span>📊</span> User activity
                                    </p>
                                    <div className="rounded-xl bg-[var(--theme-surface-hover)]/80 border border-[var(--theme-border)] p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Posts</span>
                                            <span className="font-semibold tabular-nums">
                                                {activity.posts_count ?? 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Comments</span>
                                            <span className="font-semibold tabular-nums">
                                                {activity.comments_count ?? 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Followers</span>
                                            <span className="font-semibold tabular-nums">
                                                {activity.followers_count ?? 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-secondary)]">Last active</span>
                                            <span className="font-medium text-right">
                                                {formatAgo(activity.last_active_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div
                    className={`relative z-[1] border-t border-[var(--theme-border)] shrink-0 bg-[var(--theme-surface)] ${
                        variant === 'modal' ? 'px-6 py-4 space-y-3' : 'px-5 py-3 space-y-3'
                    }`}
                >
                    {variant === 'modal' && canModerate && u?.suspended_at && !u?.banned_at && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={unsuspendMutation.isPending}
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            `Unsuspend @${u.username}? They will be able to sign in again.`
                                        )
                                    ) {
                                        unsuspendMutation.mutate();
                                    }
                                }}
                                className="px-4 py-2 rounded-xl text-sm font-medium border border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                            >
                                Unsuspend
                            </button>
                        </div>
                    )}
                    {canModerate && u?.suspended_at && !u?.banned_at && variant === 'embedded' && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={unsuspendMutation.isPending}
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            `Unsuspend @${u.username}? They will be able to sign in again.`
                                        )
                                    ) {
                                        unsuspendMutation.mutate();
                                    }
                                }}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Unsuspend user
                            </button>
                        </div>
                    )}
                    {/* Modal: compact horizontal actions; embedded: stacked (sidebar space) */}
                    <div
                        className={
                            variant === 'modal'
                                ? 'grid grid-cols-1 sm:grid-cols-3 gap-2'
                                : 'grid grid-cols-1 gap-2'
                        }
                    >
                        <button
                            type="button"
                            disabled={!canModerate || warnMutation.isPending}
                            onClick={() => setWarnOpen(true)}
                            className={
                                variant === 'modal'
                                    ? 'w-full px-3 py-2 rounded-xl text-sm font-medium border border-amber-500/45 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/18 disabled:opacity-50 transition-colors'
                                    : 'w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 shadow-sm'
                            }
                        >
                            Send warning
                        </button>
                        <button
                            type="button"
                            disabled={!canModerate || suspendMutation.isPending}
                            onClick={() => setSuspendOpen(true)}
                            className={
                                variant === 'modal'
                                    ? 'w-full px-3 py-2 rounded-xl text-sm font-medium border border-rose-500/45 bg-rose-500/10 text-rose-900 dark:text-rose-200 hover:bg-rose-500/18 disabled:opacity-50 transition-colors'
                                    : 'w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 shadow-sm'
                            }
                        >
                            Suspend user
                        </button>
                        <button
                            type="button"
                            disabled={!canModerate || !!u?.banned_at || banMutation.isPending}
                            onClick={handleBanClick}
                            className={
                                variant === 'modal'
                                    ? 'w-full px-3 py-2 rounded-xl text-sm font-medium border border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-200 hover:bg-red-500/18 disabled:opacity-50 transition-colors'
                                    : 'w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-red-900 text-white hover:bg-red-950 disabled:opacity-50 shadow-sm'
                            }
                        >
                            Ban user
                        </button>
                    </div>
                </div>
                {isSelf && (
                    <p className="px-5 pb-3 text-xs text-amber-700 text-center border-t border-[var(--theme-border)]">
                        You can’t moderate your own account.
                    </p>
                )}
            </div>

            {suspendOpen &&
                createPortal(
                    <div className={`fixed inset-0 ${overlayZ} flex items-center justify-center p-4`}>
                        <div className="absolute inset-0 bg-black/40" onClick={() => setSuspendOpen(false)} />
                        <div className="relative w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] shadow-xl p-5">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-[var(--text-primary)]">Suspend user</h3>
                                <button type="button" onClick={() => setSuspendOpen(false)} aria-label="Close">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mb-3">
                                Choose how long <span className="font-medium text-[var(--text-primary)]">@{u?.username}</span>{' '}
                                cannot sign in.
                            </p>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                Duration
                            </label>
                            <select
                                value={suspendDuration}
                                onChange={(e) => setSuspendDuration(e.target.value)}
                                className={`${selectClass} w-full max-w-none mb-4`}
                            >
                                {SUSPEND_DURATION_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSuspendOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={suspendMutation.isPending}
                                    onClick={() => suspendMutation.mutate()}
                                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50"
                                >
                                    Suspend user
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {warnOpen &&
                createPortal(
                    <div className={`fixed inset-0 ${overlayZ} flex items-center justify-center p-4`}>
                        <div className="absolute inset-0 bg-black/40" onClick={() => setWarnOpen(false)} />
                        <div className="relative w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] shadow-xl p-5">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-[var(--text-primary)]">Send warning to user</h3>
                                <button type="button" onClick={() => setWarnOpen(false)} aria-label="Close">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 px-3 py-2 text-sm text-[var(--text-primary)] mb-4">
                                <strong>User:</strong> {u?.name}
                            </div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                Reason for action
                            </label>
                            <select
                                value={warnReason}
                                onChange={(e) => setWarnReason(e.target.value)}
                                className={`${selectClass} mb-1`}
                            >
                                {REPORT_REASONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-[var(--text-secondary)] mb-3">
                                {REPORT_REASONS.find((x) => x.value === warnReason)?.description}
                            </p>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                Message to user (prefilled — edit as needed)
                            </label>
                            <textarea
                                value={warnMessage}
                                onChange={(e) => setWarnMessage(e.target.value)}
                                rows={6}
                                minLength={10}
                                placeholder="Explain what they need to change…"
                                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm p-3 mb-1"
                            />
                            <p className="text-[11px] text-[var(--text-secondary)] mb-4">
                                {warnMessage.trim().length}/5000 · minimum 10 characters
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWarnOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={warnMutation.isPending || warnMessage.trim().length < 10}
                                    onClick={() => warnMutation.mutate()}
                                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium disabled:opacity-50"
                                >
                                    Send warning
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {banOpen &&
                createPortal(
                    <div className={`fixed inset-0 ${overlayZ} flex items-center justify-center p-4`}>
                        <div className="absolute inset-0 bg-black/40" onClick={() => setBanOpen(false)} />
                        <div className="relative w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--text-primary)] shadow-xl p-5 max-h-[90vh] overflow-y-auto">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Ban @{u?.username}?</h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-3">
                                They won’t be able to sign in. Choose the violation category and edit the message — it
                                matches what they see if they try to log in.
                            </p>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                Reason (same options as member reports)
                            </label>
                            <select
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                className={`${selectClass} mb-3`}
                            >
                                {REPORT_REASONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                Message to user (prefilled — edit as needed)
                            </label>
                            <textarea
                                value={banMessage}
                                onChange={(e) => setBanMessage(e.target.value)}
                                rows={8}
                                minLength={10}
                                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm p-3 mb-1"
                            />
                            <p className="text-[11px] text-[var(--text-secondary)] mb-4">
                                {banMessage.trim().length}/2000 · minimum 10 characters
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setBanOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-[var(--theme-border)] text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={banMutation.isPending || banMessage.trim().length < 10}
                                    onClick={() => banMutation.mutate()}
                                    className="px-4 py-2 rounded-xl bg-red-900 text-white text-sm font-medium disabled:opacity-50"
                                >
                                    Confirm ban
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
