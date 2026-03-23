import React from 'react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import AdminReportUserPanel from './AdminReportUserPanel';

const STATUS_LABELS = {
    pending: 'Pending',
    reviewed: 'Reviewed',
    dismissed: 'Cancelled',
    action_taken: 'Moderated',
};

/**
 * Profile comment report preview + moderation panel (mirrors AdminPostPreviewModal flow).
 *
 * @param {object} report — row from admin reports list (includes reportable with type profile_comment)
 * @param {object} [reportContext]
 */
const AdminProfileCommentPreviewModal = ({ report, isOpen, onClose, authorUserId, adminUserId, reportContext }) => {
    const rep = report?.reportable;
    const enabled = Boolean(isOpen && rep?.type === 'profile_comment' && rep?.id);
    const content = rep?.content_full ?? rep?.content ?? '';
    const profileUsername = rep?.profile_username;
    const author = rep?.author;

    const showUserPanel = Boolean(authorUserId);
    const showReportBar =
        reportContext &&
        reportContext.status === 'pending' &&
        (reportContext.onRemoveComment || reportContext.onRequestDismiss);

    const modalTitle = showUserPanel ? 'Comment & reported user' : 'Comment preview';
    const modalSize = showUserPanel ? '3xl' : 'lg';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size={modalSize}>
            {isOpen && !enabled ? (
                <p className="text-sm text-[var(--text-secondary)] py-4">This comment is no longer available.</p>
            ) : !enabled ? null : (
                <div
                    className={
                        showUserPanel
                            ? 'flex flex-col lg:flex-row gap-4 lg:gap-0 min-h-0 lg:items-stretch lg:h-[min(74vh,620px)] lg:max-h-[78vh] lg:overflow-hidden'
                            : 'space-y-4'
                    }
                >
                    <div
                        className={
                            showUserPanel
                                ? 'min-w-0 flex-1 space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2'
                                : 'space-y-4'
                        }
                    >
                        <div className="flex items-start gap-3">
                            <Avatar src={author?.profile_picture} alt={author?.name} size="md" />
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[var(--text-primary)]">{author?.name ?? '—'}</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    @{author?.username ?? '—'} · Comment #{rep.id}
                                </p>
                                {profileUsername && (
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                        On profile @{profileUsername}
                                    </p>
                                )}
                            </div>
                            {profileUsername && (
                                <Link
                                    to={`/profile/${profileUsername}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-medium text-[var(--theme-accent)] hover:underline shrink-0"
                                >
                                    Open profile
                                </Link>
                            )}
                        </div>

                        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/40 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-2">
                                Comment text
                            </p>
                            <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{content}</p>
                        </div>

                        {!showUserPanel && (
                            <p className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--theme-border)]">
                                Use this preview to decide on removal or account actions. Actions are in the report
                                card.
                            </p>
                        )}
                    </div>

                    {showUserPanel && (
                        <div className="flex flex-col min-h-0 w-full min-w-0 lg:w-[min(100%,400px)] lg:shrink-0 lg:border-l lg:border-[var(--theme-border)] lg:pl-4 lg:overflow-hidden lg:min-h-0">
                            {reportContext?.reportId != null && (
                                <p className="text-xs text-[var(--text-secondary)] mb-2 shrink-0">
                                    Report #{reportContext.reportId} ·{' '}
                                    {STATUS_LABELS[reportContext.status] ?? reportContext.status}
                                </p>
                            )}
                            {showReportBar && (
                                <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/40 p-3 mb-3 space-y-2 shrink-0">
                                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                                        This report
                                    </p>
                                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                                        Warn, suspend, or ban marks the report <strong>Moderated</strong>. Remove
                                        comment does the same. Use cancel only if no action is needed.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {reportContext.onRemoveComment && (
                                            <button
                                                type="button"
                                                disabled={reportContext.removePending}
                                                onClick={reportContext.onRemoveComment}
                                                className="w-full text-center px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-50 border border-red-500/20"
                                            >
                                                Remove comment
                                            </button>
                                        )}
                                        {reportContext.onRequestDismiss && (
                                            <button
                                                type="button"
                                                disabled={reportContext.dismissPending}
                                                onClick={reportContext.onRequestDismiss}
                                                className="w-full text-center px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--theme-border)] text-[var(--text-secondary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-50"
                                            >
                                                Cancel report (no action)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] w-full min-w-0">
                                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-3 pt-3 pb-1 border-b border-[var(--theme-border)] shrink-0">
                                    Reported user
                                </p>
                                <AdminReportUserPanel
                                    userId={authorUserId}
                                    enabled={enabled && !!authorUserId}
                                    adminUserId={adminUserId}
                                    onClose={onClose}
                                    variant="embedded"
                                    resolveReportId={
                                        reportContext?.status === 'pending' ? reportContext.reportId : undefined
                                    }
                                    onReportModerated={onClose}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default AdminProfileCommentPreviewModal;
