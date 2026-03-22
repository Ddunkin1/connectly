import React, { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getReasonLabel } from '../../hooks/useReports';

const STORAGE_KEY = 'connectly_account_banned';

/**
 * Shown when login API returns 403 account_banned — user cannot access the app.
 */
const AccountBanned = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const fromNav = location.state;
    const reasonFromQuery = searchParams.get('reason_code');

    useEffect(() => {
        if (fromNav?.reasonCode != null || fromNav?.banMessage) {
            try {
                sessionStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        reasonCode: fromNav.reasonCode ?? null,
                        banMessage: fromNav.banMessage ?? null,
                    })
                );
            } catch {
                /* ignore */
            }
        }
    }, [fromNav]);

    let reasonCode = fromNav?.reasonCode ?? reasonFromQuery ?? null;
    let banMessage = fromNav?.banMessage ?? null;
    if (reasonCode == null && banMessage == null) {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                reasonCode = parsed.reasonCode ?? null;
                banMessage = parsed.banMessage ?? null;
            }
        } catch {
            /* ignore */
        }
    }

    const reasonLabel = reasonCode ? getReasonLabel(reasonCode) : null;

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
                    <a
                        href="mailto:support@connectly.com?subject=Ban%20appeal%20-%20Connectly%20account"
                        className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-medium border border-[var(--theme-border)] text-[var(--text-primary)] hover:bg-[var(--theme-surface-hover)] transition"
                    >
                        Appeal this decision
                    </a>
                    <Link to="/" className="text-sm text-[var(--theme-accent)] hover:underline">
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AccountBanned;
