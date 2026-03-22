import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/adminApi';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminSection from '../../components/admin/AdminSection';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminErrorState from '../../components/admin/AdminErrorState';
import { AdminStatsRowSkeleton } from '../../components/admin/AdminSkeleton';

const QuickLink = ({ to, icon, label, description }) => (
    <Link
        to={to}
        className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--theme-accent)]/35 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)]"
    >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--theme-accent)]/25 to-indigo-600/15 text-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]/20 transition-transform duration-300 group-hover:scale-105">
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-semibold text-[var(--text-primary)] tracking-tight">{label}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{description}</p>
        </div>
        <span className="material-symbols-outlined text-[var(--text-secondary)] text-xl shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--theme-accent)]">
            arrow_forward
        </span>
    </Link>
);

const ReportRow = ({ label, value }) => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-[var(--theme-border)] last:border-0">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{value}</span>
    </div>
);

const AdminDashboard = () => {
    const userStatsQuery = useQuery({
        queryKey: ['admin-users-stats'],
        queryFn: () => adminAPI.getUserStats(),
        select: (res) => res.data,
    });

    const reportStatsQuery = useQuery({
        queryKey: ['admin-reports-stats'],
        queryFn: () => adminAPI.getReportStats(),
        select: (res) => res.data,
    });

    const loading = userStatsQuery.isLoading || reportStatsQuery.isLoading;
    const error = userStatsQuery.error || reportStatsQuery.error;

    if (error) {
        return (
            <div>
                <AdminPageHeader
                    eyebrow="Admin · Overview"
                    title="Dashboard"
                    description="High-level metrics and shortcuts to moderation tools."
                />
                <AdminErrorState
                    title="Could not load dashboard"
                    message={
                        error?.response?.data?.message ||
                        error?.message ||
                        'Check your connection and try again.'
                    }
                    onRetry={() => {
                        userStatsQuery.refetch();
                        reportStatsQuery.refetch();
                    }}
                />
            </div>
        );
    }

    const us = userStatsQuery.data;
    const rs = reportStatsQuery.data;
    const pendingReports = rs?.by_status?.pending ?? 0;

    return (
        <div className="space-y-10 pb-8">
            <AdminPageHeader
                eyebrow="Admin · Overview"
                title="Dashboard"
                description="Monitor community health, moderation queue, and system tools at a glance."
            />

            {loading ? (
                <AdminStatsRowSkeleton count={4} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <AdminStatCard
                        label="Total users"
                        value={us?.total_users?.toLocaleString()}
                        accent={false}
                        icon="groups"
                    />
                    <AdminStatCard
                        label="New this week"
                        value={us?.new_this_week?.toLocaleString()}
                        icon="person_add"
                    />
                    <AdminStatCard
                        label="Suspended accounts"
                        value={us?.suspended?.toLocaleString()}
                        sublabel="Review in Users"
                        icon="block"
                    />
                    <AdminStatCard
                        label="Pending reports"
                        value={pendingReports.toLocaleString()}
                        accent
                        sublabel="Awaiting moderator review"
                        icon="flag"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                        Quick actions
                    </h2>
                    <div className="grid gap-3">
                        <QuickLink
                            to="/admin/users"
                            icon="group"
                            label="Users & community"
                            description="Search members, change roles, suspend accounts, export CSV."
                        />
                        <QuickLink
                            to="/admin/reports"
                            icon="flag"
                            label="Content reports"
                            description="Review flagged users, posts, and profile comments."
                        />
                        <QuickLink
                            to="/admin/settings"
                            icon="settings"
                            label="System settings"
                            description="Read-only diagnostics for environment and integrations."
                        />
                    </div>
                </div>

                <div className="lg:pt-7">
                    <AdminSection title="Reports overview" description="All-time counts by type">
                        {loading ? (
                            <div className="space-y-2 py-2">
                                <div className="h-4 bg-[var(--theme-surface-hover)] rounded animate-pulse" />
                                <div className="h-4 bg-[var(--theme-surface-hover)] rounded animate-pulse w-4/5" />
                            </div>
                        ) : (
                            <div className="-mx-1">
                                <ReportRow
                                    label="Total reports"
                                    value={rs?.total?.toLocaleString() ?? '—'}
                                />
                                <ReportRow label="User targets" value={rs?.by_reportable_type?.user ?? 0} />
                                <ReportRow label="Post targets" value={rs?.by_reportable_type?.post ?? 0} />
                                <ReportRow
                                    label="Profile comments"
                                    value={rs?.by_reportable_type?.profile_comment ?? 0}
                                />
                            </div>
                        )}
                    </AdminSection>
                </div>
            </div>

            <AdminSection title="Activity" description="Timeline charts require a dedicated analytics API">
                <AdminEmptyState
                    icon="insights"
                    title="No activity feed yet"
                    description="When analytics endpoints are available, recent sign-ups, reports, and moderator actions can appear here."
                />
            </AdminSection>
        </div>
    );
};

export default AdminDashboard;
