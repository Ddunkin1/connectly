import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getReasonLabel } from '../../hooks/useReports';
import api from '../../services/api';

const STORAGE_KEY = 'connectly_account_banned';

/**
 * Shown when login API returns 403 account_banned — user cannot access the app.
 */
const AccountBanned = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const fromNav = location.state;
    const reasonFromQuery = searchParams.get('reason_code');
    const [reasonCode, setReasonCode] = useState(fromNav?.reasonCode ?? reasonFromQuery ?? null);
    const [banMessage, setBanMessage] = useState(fromNav?.banMessage ?? null);
    const [moderationEventId, setModerationEventId] = useState(fromNav?.moderationEventId ?? null);
    const [appealToken, setAppealToken] = useState(fromNav?.appealToken ?? null);

    const [appealFormOpen, setAppealFormOpen] = useState(false);
    const [appealText, setAppealText] = useState('');
    const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
    const [appealError, setAppealError] = useState(null);
    const [appealSubmitted, setAppealSubmitted] = useState(false);

    const readStored = () => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        if (
            fromNav?.reasonCode != null ||
            fromNav?.banMessage != null ||
            fromNav?.appealToken != null ||
            fromNav?.moderationEventId != null
        ) {
            try {
                sessionStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        reasonCode: fromNav.reasonCode ?? null,
                        banMessage: fromNav.banMessage ?? null,
                        moderationEventId: fromNav.moderationEventId ?? null,
                        appealToken: fromNav.appealToken ?? null,
                    })
                );
            } catch {
                /* ignore */
            }
        }
        const stored = readStored();
        setReasonCode(fromNav?.reasonCode ?? reasonFromQuery ?? stored?.reasonCode ?? null);
        setBanMessage(fromNav?.banMessage ?? stored?.banMessage ?? null);
        setModerationEventId(fromNav?.moderationEventId ?? stored?.moderationEventId ?? null);
        setAppealToken(fromNav?.appealToken ?? stored?.appealToken ?? null);
    }, [fromNav, reasonFromQuery]);

    const reasonLabel = reasonCode ? getReasonLabel(reasonCode) : null;

    const submitBanAppeal = async (e) => {
        e.preventDefault();
        setAppealError(null);

        const trimmed = appealText.trim();
        if (!appealToken) {
            setAppealError('Appeals are not available for this account right now. Please contact support.');
            return;
        }
        if (trimmed.length < 20) {
            setAppealError('Please explain your appeal (min. 20 characters).');
            return;
        }

        setIsSubmittingAppeal(true);
        try {
            await api.post('/ban-appeals', {
                    appeal_token: appealToken,
                    moderation_event_id: moderationEventId ? Number(moderationEventId) : undefined,
                    message: trimmed,
            });

            setAppealSubmitted(true);
            setAppealFormOpen(false);
            setAppealText('');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to submit appeal.';
            setAppealError(msg);
        } finally {
            setIsSubmittingAppeal(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-[var(--bg-primary)]">
            <div className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg p-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/15 text-red-600 mb-4">
                    <span className="material-symbols-outlined text-3xl" aria-hidden>
                        block
                    </span>
                </div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Account banned</h1>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    This account can&apos;t be used on Connectly. Sign-in is disabled until any appeal is reviewed.
                </p>

                {reasonLabel && (
                    <div className="text-left rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/50 px-4 py-3 mb-4">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">
                            Category
                        </p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{reasonLabel}</p>
                    </div>
                )}

                {banMessage && (
                    <div className="text-left rounded-xl border border-[var(--theme-border)] bg-[var(--bg-primary)] px-4 py-3 mb-6">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                            Message from moderation
                        </p>
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{banMessage}</p>
                    </div>
                )}

                {!reasonLabel && !banMessage && (
                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                        No additional details are available. If you need help, use the appeal option below.
                    </p>
                )}

                <div className="flex flex-col gap-3">
                    <Link
                        to="/login"
                        replace
                        className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-semibold bg-[var(--theme-accent)] text-white hover:brightness-105 transition"
                        onClick={() => {
                            try {
                                sessionStorage.removeItem(STORAGE_KEY);
                            } catch {
                                /* ignore */
                            }
                        }}
                    >
                        Back to login
                    </Link>
                    <div className="text-left">
                        {!appealSubmitted ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setAppealFormOpen((v) => !v)}
                                    className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-medium border border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition"
                                >
                                    Appeal this decision
                                </button>

                                {appealFormOpen && (
                                    <form onSubmit={submitBanAppeal} className="mt-3 space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                                                Your appeal
                                            </label>
                                            <textarea
                                                value={appealText}
                                                onChange={(e) => setAppealText(e.target.value)}
                                                rows={5}
                                                className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm p-3"
                                                placeholder="Explain why you think this decision is a mistake…"
                                            />
                                        </div>

                                        {appealError && (
                                            <p className="text-sm text-red-500 leading-snug">{appealError}</p>
                                        )}

                                        <div className="flex flex-wrap justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAppealFormOpen(false);
                                                    setAppealError(null);
                                                }}
                                                className="px-4 py-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmittingAppeal}
                                                className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] text-white text-sm font-semibold disabled:opacity-50 shadow-md hover:opacity-95 transition-opacity"
                                            >
                                                {isSubmittingAppeal ? 'Submitting…' : 'Submit appeal'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-[var(--text-primary)] bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/30 rounded-xl px-4 py-3 mt-1">
                                Your appeal was submitted. You can try signing in again after our team reviews it.
                            </div>
                        )}
                    </div>
                    <Link to="/" className="text-sm text-[var(--theme-accent)] hover:underline">
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AccountBanned;
