import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getReasonLabel } from '../../hooks/useReports';
import api from '../../services/api';

const STORAGE_KEY = 'connectly_account_banned';
const APPEAL_DONE_KEY = 'connectly_ban_appeal_done';

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

    const readAppealDone = () => {
        try { return JSON.parse(localStorage.getItem(APPEAL_DONE_KEY)) ?? null; } catch { return null; }
    };
    const savedDone = readAppealDone();
    const [appealSubmitted, setAppealSubmitted] = useState(savedDone?.submitted ?? false);
    const [alreadyAppealed, setAlreadyAppealed] = useState(savedDone?.already ?? false);

    const readStored = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
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
                localStorage.setItem(
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
        if (trimmed.length < 20) {
            setAppealError('Please explain your appeal (at least 20 characters).');
            return;
        }

        setIsSubmittingAppeal(true);
        try {
            await api.post('/ban-appeals', {
                appeal_token: appealToken ?? undefined,
                moderation_event_id: moderationEventId ? Number(moderationEventId) : undefined,
                message: trimmed,
            });

            setAppealSubmitted(true);
            setAlreadyAppealed(false);
            setAppealFormOpen(false);
            setAppealText('');
            try { localStorage.setItem(APPEAL_DONE_KEY, JSON.stringify({ submitted: true, already: false })); } catch { /* ignore */ }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to submit appeal.';
            if (
                err?.response?.status === 422 &&
                msg.toLowerCase().includes('already submitted')
            ) {
                setAlreadyAppealed(true);
                setAppealSubmitted(true);
                setAppealFormOpen(false);
                try { localStorage.setItem(APPEAL_DONE_KEY, JSON.stringify({ submitted: true, already: true })); } catch { /* ignore */ }
            } else {
                setAppealError(msg);
            }
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
                                localStorage.removeItem(STORAGE_KEY);
                                localStorage.removeItem(APPEAL_DONE_KEY);
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
                        ) : alreadyAppealed ? (
                            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-4 mt-1 text-left">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-yellow-500 text-xl mt-0.5 shrink-0">info</span>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Appeal already submitted</p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            You&apos;ve already submitted an appeal for this ban. Our moderation team is reviewing it and will get back to you as soon as possible. Please be patient.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4 mt-1 text-left">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-green-500 text-xl mt-0.5 shrink-0">check_circle</span>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Appeal submitted</p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            Your appeal has been received and is now being reviewed by our moderation team. You&apos;ll be notified once a decision has been made. Thank you for your patience.
                                        </p>
                                    </div>
                                </div>
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
