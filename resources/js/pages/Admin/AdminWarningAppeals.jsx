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

const AdminWarningAppeals = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const [respondId, setRespondId] = useState(null);
    const [reply, setReply] = useState('');
    const [dismiss, setDismiss] = useState(false);

    const q = useQuery({
        queryKey: ['admin-warning-appeals', page],
        queryFn: () => adminAPI.getWarningAppeals(page).then((r) => r.data),
    });

    const appeals = q.data?.data ?? [];
    const appealFromQuery = searchParams.get('appeal');

    useEffect(() => {
        if (appealFromQuery && appeals.length) {
            const id = Number(appealFromQuery);
            const row = appeals.find((a) => a.id === id);
            if (row) {
                setRespondId(row.id);
                const el = document.getElementById(`appeal-row-${id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [appealFromQuery, appeals]);

    const respondMutation = useMutation({
        mutationFn: ({ id, reply: text, dismiss: d }) => adminAPI.respondWarningAppeal(id, { reply: text, dismiss: d }),
        onSuccess: () => {
            toast.success('Reply sent to the user.');
            setRespondId(null);
            setReply('');
            setDismiss(false);
            queryClient.invalidateQueries({ queryKey: ['admin-warning-appeals'] });
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
        setReply('');
        setDismiss(false);
    };

    const submitRespond = (e) => {
        e.preventDefault();
        const text = reply.trim();
        if (text.length < 10) {
            toast.error('Reply must be at least 10 characters.');
            return;
        }
        respondMutation.mutate({ id: respondId, reply: text, dismiss });
    };

    const selected = appeals.find((a) => a.id === respondId);

    return (
        <div className="space-y-8 pb-8">
            <AdminPageHeader
                eyebrow="Admin · Moderation"
                title="Warning appeals"
                description="Review appeals from members who received a formal warning."
            />

            {q.isLoading && <AdminTableSkeleton rows={5} />}
            {q.isError && <AdminErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />}

            {!q.isLoading && !q.isError &&
                (appeals.length === 0 ? (
                    <AdminEmptyState
                        title="No pending appeals"
                        description="When a user appeals a warning, it will appear here."
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
                                        className={`transition-colors hover:bg-[var(--theme-surface-hover)]/80 ${
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
                                                className="inline-flex items-center justify-center rounded-lg border border-[var(--theme-accent)]/35 bg-[var(--theme-accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/18 transition-colors"
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
                    setDismiss(false);
                }}
                title="Respond to appeal"
                size="lg"
            >
                {selected && (
                    <form onSubmit={submitRespond} className="space-y-4">
                        <div className="text-sm text-[var(--text-secondary)]">
                            <p>
                                <span className="font-medium text-[var(--text-primary)]">@{selected.user?.username}</span>
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-[var(--text-primary)]">{selected.message}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Your reply (min. 10 characters)</label>
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                rows={5}
                                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm p-3"
                                placeholder="Explain the decision clearly to the user…"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                            <input type="checkbox" checked={dismiss} onChange={(e) => setDismiss(e.target.checked)} />
                            Mark as dismissed (still sends your reply)
                        </label>
                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setRespondId(null);
                                    setReply('');
                                    setDismiss(false);
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

export default AdminWarningAppeals;
