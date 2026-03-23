import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminSection from '../../components/admin/AdminSection';
import AdminErrorState from '../../components/admin/AdminErrorState';
import { AdminSkeletonBlock } from '../../components/admin/AdminSkeleton';

const CopyBtn = ({ value, label = 'Copy' }) => {
    const [done, setDone] = useState(false);
    if (value == null || value === '') return null;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(String(value));
            setDone(true);
            toast.success('Copied');
            setTimeout(() => setDone(false), 2000);
        } catch {
            toast.error('Could not copy');
        }
    };
    return (
        <button
            type="button"
            onClick={copy}
            className="text-xs font-medium text-[var(--theme-accent)] hover:underline shrink-0"
            aria-label={label}
        >
            {done ? 'Copied' : 'Copy'}
        </button>
    );
};

const Row = ({ label, value, copyable = false }) => (
    <div className="flex justify-between gap-4 py-2.5 border-b border-[var(--theme-border)]/50 last:border-0 items-start">
        <span className="text-[var(--text-secondary)] shrink-0">{label}</span>
        <div className="flex items-start gap-2 justify-end min-w-0">
            <span className="text-[var(--text-primary)] font-mono text-xs break-all text-right">{value ?? '—'}</span>
            {copyable && <CopyBtn value={value} />}
        </div>
    </div>
);

const SettingsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
            <div
                key={i}
                className="rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 space-y-3 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.5)]"
            >
                <AdminSkeletonBlock className="h-5 w-32" />
                <AdminSkeletonBlock className="h-4 w-full" />
                <AdminSkeletonBlock className="h-4 w-4/5" />
            </div>
        ))}
    </div>
);

const AdminSettings = () => {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-system-settings'],
        queryFn: () => adminAPI.getSystemSettings(),
        select: (res) => res.data,
    });

    if (isLoading) {
        return (
            <div>
                <AdminPageHeader
                    eyebrow="Admin · System"
                    title="System settings"
                    description="Read-only diagnostics. Secrets are never shown. Change configuration via .env and deploy."
                />
                <SettingsSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <AdminPageHeader
                    eyebrow="Admin · System"
                    title="System settings"
                    description="Read-only diagnostics."
                />
                <AdminErrorState
                    title="Could not load system settings"
                    message={
                        error?.response?.data?.message ||
                        error?.message ||
                        'Ensure you are logged in as admin.'
                    }
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const g = data?.general ?? {};
    const sys = data?.system ?? {};
    const infra = data?.infrastructure ?? {};
    const bc = data?.broadcasting ?? {};
    const st = data?.storage ?? {};
    const oauth = data?.oauth ?? {};

    return (
        <div className="space-y-8 admin-fade-up">
            <AdminPageHeader
                eyebrow="Admin · System"
                title="System settings"
                description="Read-only diagnostics. Secrets are never shown. Change configuration via .env and deploy."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminSection title="General">
                    <Row label="App name" value={g.app_name} />
                    <Row label="App URL" value={g.app_url} copyable />
                    <Row label="Environment" value={g.app_env} />
                </AdminSection>

                <AdminSection title="System health">
                    <Row label="PHP" value={sys.php_version} />
                    <Row label="Laravel" value={sys.laravel_version} />
                    <Row
                        label="Database"
                        value={sys.database_connected ? 'Connected' : 'Unreachable'}
                    />
                </AdminSection>

                <AdminSection title="Infrastructure">
                    <Row label="Queue" value={infra.queue_default} />
                    <Row label="Cache" value={infra.cache_default} />
                    <Row label="Session" value={infra.session_driver} />
                    <Row label="Mail" value={infra.mail_mailer} />
                </AdminSection>

                <AdminSection title="Realtime">
                    <Row label="Broadcast driver" value={bc.default} />
                </AdminSection>

                <AdminSection title="Storage / media" className="md:col-span-2">
                    <Row label="Supabase host" value={st.supabase_host} copyable />
                    <Row label="Bucket" value={st.supabase_bucket} />
                    <Row
                        label="Service role key configured"
                        value={st.supabase_service_role_configured ? 'Yes' : 'No'}
                    />
                    <Row
                        label="Image redirect-only mode"
                        value={st.supabase_image_redirect_only ? 'Yes' : 'No'}
                    />
                </AdminSection>

                <AdminSection title="OAuth">
                    <Row label="Google" value={oauth.google_configured ? 'Configured' : 'Not set'} />
                    <Row label="Facebook" value={oauth.facebook_configured ? 'Configured' : 'Not set'} />
                </AdminSection>

                <AdminSection
                    title="What system settings usually include"
                    description="Common admin panels add toggles and policies here over time. Below is a roadmap-style checklist (not wired yet)—based on typical SaaS / community products."
                    className="md:col-span-2"
                >
                    <ul className="text-sm text-[var(--text-secondary)] space-y-2.5 list-disc pl-5 leading-relaxed">
                        <li>
                            <span className="text-[var(--text-primary)] font-medium">Maintenance mode</span> — show a
                            banner or block signups/posts for everyone except admins; optional custom message.
                        </li>
                        <li>
                            <span className="text-[var(--text-primary)] font-medium">Branding &amp; legal</span> — app
                            name, support email, terms/privacy URLs, logo (often stored in DB or config).
                        </li>
                        <li>
                            <span className="text-[var(--text-primary)] font-medium">Localization</span> — default
                            locale, timezone, and date format for dashboards and emails.
                        </li>
                        <li>
                            <span className="text-[var(--text-primary)] font-medium">Accounts &amp; safety</span> — allow
                            public registration, email verification required, min password rules, session lifetime.
                        </li>
                        <li>
                            <span className="text-[var(--text-primary)] font-medium">Email &amp; notifications</span> —
                            test send, digest toggles, rate limits for transactional mail (SMTP is usually still env-based).
                        </li>
                        <li>
                            <span className="text-[var(--text-primary)] font-medium">Content &amp; moderation</span> —
                            default report reasons, auto-hide thresholds, media upload limits (aligns with your Reports
                            queue).
                        </li>
                        <li>
                            <span className="text-[var(--text-primary)] font-medium">Feature flags</span> — gradual rollout
                            of communities, DMs, or experiments without redeploying.
                        </li>
                        <li>
                            <span className="text-[var(--text-primary)] font-medium">Integrations health</span> — what you
                            already show (DB, queue, storage, OAuth); later add “test connection” buttons.
                        </li>
                    </ul>
                    <p className="text-xs text-[var(--text-secondary)] mt-4 pt-4 border-t border-[var(--theme-border)]">
                        Secrets (API keys, DB passwords) stay in <code className="font-mono text-[11px]">.env</code> and
                        deployment — expose only non-sensitive flags and hostnames in this UI.
                    </p>
                </AdminSection>
            </div>
        </div>
    );
};

export default AdminSettings;
