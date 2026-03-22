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
        className="flex items-start gap-3 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-hover)]/50 hover:bg-[var(--theme-surface-hover)] transition-colors group"
    >
        <span className="material-symbols-outlined text-[var(--theme-accent)] text-2xl shrink-0 group-hover:scale-105 transition-transform">
            {icon}
        </span>
        <div>
            <p className="font-semibold text-[var(--text-primary)]">{label}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
        </div>
        <span className="material-symbols-outlined text-[var(--text-secondary)] text-lg ml-auto shrink-0">
            chevron_right
        </span>
    </Link>
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
        <div className="space-y-8">
            <AdminPageHeader
                eyebrow="Admin · Overview"
                title="Dashboard"
                description="Monitor community health, moderation queue, and system tools at a glance."
            />

            {loading ? (
                <AdminStatsRowSkeleton count={4} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
                    <AdminStatCard
                        label="Total users"
                        value={us?.total_users?.toLocaleString()}
                        accent={false}
                    />
                    <AdminStatCard
                        label="New this week"
                        value={us?.new_this_week?.toLocaleString()}
                    />
                    <AdminStatCard
                        label="Suspended accounts"
                        value={us?.suspended?.toLocaleString()}
                        sublabel="Review in Users"
                    />
                    <AdminStatCard
                        label="Pending reports"
                        value={pendingReports.toLocaleString()}
                        accent
                        sublabel="Awaiting moderator review"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Quick actions
                    </h2>
                    <div className="grid sm:grid-cols-1 gap-3">
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

                <div>
                    <AdminSection title="Reports overview" description="All-time counts by type">
                        {loading ? (
                            <div className="space-y-2 py-2">
                                <div className="h-4 bg-[var(--theme-surface-hover)] rounded animate-pulse" />
                                <div className="h-4 bg-[var(--theme-surface-hover)] rounded animate-pulse w-4/5" />
                            </div>
                        ) : (
                            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                                <li className="flex justify-between">
                                    <span>Total reports</span>
                                    <span className="text-[var(--text-primary)] font-medium tabular-nums">
                                        {rs?.total?.toLocaleString() ?? '—'}
                                    </span>
                                </li>
                                <li className="flex justify-between">
                                    <span>User targets</span>
                                    <span className="text-[var(--text-primary)] font-medium tabular-nums">
                                        {rs?.by_reportable_type?.user ?? 0}
                                    </span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Post targets</span>
                                    <span className="text-[var(--text-primary)] font-medium tabular-nums">
                                        {rs?.by_reportable_type?.post ?? 0}
                                    </span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Profile comments</span>
                                    <span className="text-[var(--text-primary)] font-medium tabular-nums">
                                        {rs?.by_reportable_type?.profile_comment ?? 0}
                                    </span>
                                </li>
                            </ul>
                        )}
                    </AdminSection>
                </div>
            </div>

            <div className="mt-10">
                <AdminSection title="Activity" description="Timeline charts require a dedicated analytics API">
                    <AdminEmptyState
                        icon="timeline"
                        title="No activity feed yet"
                        description="When analytics endpoints are available, recent sign-ups, reports, and moderator actions can appear here."
                    />
                </AdminSection>
            </div>
        </div>
    );
};

export default AdminDashboard;
