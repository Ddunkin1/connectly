import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import { AdminTableSkeleton } from '../../components/admin/AdminSkeleton';
import AdminDataTable, { AdminTableHead, AdminTh } from '../../components/admin/AdminDataTable';
import { getReasonLabel } from '../../hooks/useReports';
import Modal from '../../components/common/Modal';

const errMsg = (err) =>
    err?.response?.data?.message || err?.response?.data?.errors?.reply?.[0] || err?.message || 'Request failed';

const BAN_APPEAL_REPLY_TEMPLATE = {
    spam: 'Thanks for your appeal. We reviewed your account activity under our spam or scams policy. Our initial enforcement was based on repeated or severe behavior that violated this policy.\n\nIf you believe this assessment is incorrect, please reply with specific examples, context, and timeline details so we can perform a second review.',
    harassment:
        'Thanks for your appeal. We reviewed your case under our harassment or bullying policy. Our initial enforcement was based on behavior that violated this policy.\n\nIf you believe this assessment is incorrect, please share specific context (who, when, and what happened) so we can perform a second review.',
    hate_speech:
        'Thanks for your appeal. We reviewed your case under our hate speech policy. Our initial enforcement was based on content that violated this policy.\n\nIf you believe this assessment is incorrect, please provide additional context so we can perform a second review.',
    violence:
        'Thanks for your appeal. We reviewed your case under our violence or threats policy. Our initial enforcement was based on content or behavior that violated this policy.\n\nIf you believe this assessment is incorrect, please provide clarifying details so we can perform a second review.',
    sexual_content:
        'Thanks for your appeal. We reviewed your case under our sexual content policy. Our initial enforcement was based on content that violated this policy.\n\nIf you believe this assessment is incorrect, please provide relevant context so we can perform a second review.',
    misinformation:
        'Thanks for your appeal. We reviewed your case under our misinformation policy. Our initial enforcement was based on repeated or severe misleading content.\n\nIf you believe this assessment is incorrect, please provide sources or context so we can perform a second review.',
    impersonation:
        'Thanks for your appeal. We reviewed your case under our impersonation policy. Our initial enforcement was based on behavior that appeared to misrepresent identity.\n\nIf you believe this assessment is incorrect, please provide additional context so we can perform a second review.',
    intellectual_property:
        'Thanks for your appeal. We reviewed your case under our intellectual property policy. Our initial enforcement was based on reported copyright or trademark violations.\n\nIf you believe this assessment is incorrect, please provide relevant rights/ownership details so we can perform a second review.',
    self_harm:
        'Thanks for your appeal. We reviewed your case under our self-harm and safety policy. Our initial enforcement was based on content that violated this policy.\n\nIf you believe this assessment is incorrect, please provide additional context so we can perform a second review.',
    inappropriate:
        'Thanks for your appeal. We reviewed your case under our sensitive or disturbing content policy. Our initial enforcement was based on content that violated this policy.\n\nIf you believe this assessment is incorrect, please provide additional context so we can perform a second review.',
    other:
        'Thanks for your appeal. We reviewed your account under our community standards. Our initial enforcement was based on serious or repeated violations.\n\nIf you believe this assessment is incorrect, please provide additional context so we can perform a second review.',
};

const getBanAppealReplyTemplate = (reasonCode) => {
    return BAN_APPEAL_REPLY_TEMPLATE[reasonCode] ?? BAN_APPEAL_REPLY_TEMPLATE.other;
};

const AdminBanAppeals = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;

    const [respondId, setRespondId] = useState(null);
    const [reply, setReply] = useState('');
    const [unban, setUnban] = useState(false);

    const q = useQuery({
        queryKey: ['admin-ban-appeals', page],
        queryFn: () => adminAPI.getBanAppeals(page).then((r) => r.data),
    });

    const appeals = q.data?.data ?? [];
    const appealFromQuery = searchParams.get('appeal');

    const respondMutation = useMutation({
        mutationFn: ({ id, reply: text, unban: shouldUnban }) => adminAPI.respondBanAppeal(id, { reply: text, unban: shouldUnban }),
        onSuccess: () => {
            toast.success('Ban appeal responded.');
            setRespondId(null);
            setReply('');
            setUnban(false);
            queryClient.invalidateQueries({ queryKey: ['admin-ban-appeals'] });
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('appeal');
                return next;
            });
        },
        onError: (e) => toast.error(errMsg(e)),
    });

    const openRespond = (row) => {
        setRespondId(row.id);
        setReply(getBanAppealReplyTemplate(row?.moderation_event?.reason_code));
        setUnban(false);
    };

    useEffect(() => {
        if (appealFromQuery && appeals.length) {
            const id = Number(appealFromQuery);
            const row = appeals.find((a) => a.id === id);
            if (row) {
                openRespond(row);
                const el = document.getElementById(`appeal-row-${id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [appealFromQuery, appeals]);

    const submitRespond = (e) => {
        e.preventDefault();
        const text = reply.trim();
        if (text.length < 10) {
            toast.error('Reply must be at least 10 characters.');
            return;
        }
        respondMutation.mutate({ id: respondId, reply: text, unban });
    };

    const selected = appeals.find((a) => a.id === respondId);

    return (
        <div className="space-y-8 pb-8 admin-fade-up">
            <AdminPageHeader
                eyebrow="Admin · Moderation"
                title="Ban appeals"
                description="Review account ban appeals from members."
            />

            {q.isLoading && <AdminTableSkeleton rows={5} />}
            {q.isError && <AdminErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />}

            {!q.isLoading && !q.isError &&
                (appeals.length === 0 ? (
                    <AdminEmptyState
                        title="No pending ban appeals"
                        description="When a user submits an appeal for an account ban, it will appear here."
                    />
                ) : (
                    <AdminDataTable>
                        <AdminTableHead>
                            <AdminTh>User</AdminTh>
                            <AdminTh>Reason</AdminTh>
                            <AdminTh>Appeal</AdminTh>
                            <AdminTh>Submitted</AdminTh>
                            <AdminTh className="text-right">Actions</AdminTh>
                        </AdminTableHead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {appeals.map((row) => {
                                const u = row.user;
                                const ev = row.moderation_event;
                                return (
                                    <tr
                                        key={row.id}
                                        id={`appeal-row-${row.id}`}
                                        className={`transition-all duration-300 hover:bg-[var(--theme-surface-hover)]/80 ${
                                            Number(appealFromQuery) === row.id ? 'bg-[var(--theme-accent)]/10' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-sm">
                                            {u ? (
                                                <>
                                                    <span className="font-medium text-[var(--text-primary)]">
                                                        @{u.username}
                                                    </span>
                                                    <span className="block text-xs text-[var(--text-secondary)] truncate max-w-[200px]">
                                                        {u.email}
                                                    </span>
                                                </>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                                            {getReasonLabel(ev?.reason_code)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-md">
                                            <p className="line-clamp-3 whitespace-pre-wrap">{row.message}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                            {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => openRespond(row)}
                                                className="inline-flex items-center justify-center rounded-xl border border-[var(--theme-accent)]/35 bg-[var(--theme-accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/18 transition-all duration-300 hover:-translate-y-[1px]"
                                            >
                                                Respond
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </AdminDataTable>
                ))}

            {q.data?.last_page > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setSearchParams({ page: String(page - 1) })}
                        className="px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-50 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-[var(--text-secondary)] tabular-nums">
                        Page {q.data?.current_page} / {q.data?.last_page}
                    </span>
                    <button
                        type="button"
                        disabled={page >= (q.data?.last_page || 1)}
                        onClick={() => setSearchParams({ page: String(page + 1) })}
                        className="px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] disabled:opacity-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            <Modal
                isOpen={Boolean(selected && respondId)}
                onClose={() => {
                    setRespondId(null);
                    setReply('');
                    setUnban(false);
                }}
                title="Respond to ban appeal"
                size="lg"
            >
                {selected && (
                    <form onSubmit={submitRespond} className="space-y-4">
                        <div className="text-sm text-[var(--text-secondary)]">
                            <p>
                                <span className="font-medium text-[var(--text-primary)]">@{selected.user?.username}</span>
                            </p>
                            <p className="mt-2">
                                Reason: <span className="font-medium text-[var(--text-primary)]">{getReasonLabel(selected.moderation_event?.reason_code)}</span>
                            </p>
                            {selected.moderation_event?.message && (
                                <p className="mt-2 whitespace-pre-wrap text-[var(--text-primary)]">{selected.moderation_event.message}</p>
                            )}
                            <p className="mt-3 whitespace-pre-wrap text-[var(--text-primary)]">{selected.message}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                                Your reply (min. 10 characters)
                            </label>
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={5}
                                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm p-3"
                                placeholder="Explain the decision clearly to the user…"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                            <input type="checkbox" checked={unban} onChange={(e) => setUnban(e.target.checked)} />
                            Unban user (approve appeal)
                        </label>

                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setRespondId(null);
                                    setReply('');
                                    setUnban(false);
                                }}
                                className="px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={respondMutation.isPending}
                                className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white text-sm font-semibold disabled:opacity-50 shadow-md hover:opacity-95 transition-opacity"
                            >
                                {respondMutation.isPending ? 'Sending…' : 'Send reply'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default AdminBanAppeals;

