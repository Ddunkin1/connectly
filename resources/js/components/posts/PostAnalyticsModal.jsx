import React from 'react';
import { usePostAnalytics } from '../../hooks/usePostAnalytics';
import { SkeletonBlock } from '../common/skeletons';
import { formatDateUppercase } from '../../utils/formatDate';

function StatCard({ label, value, icon, color }) {
    return (
        <div className="bg-[var(--theme-surface-hover)] rounded-xl p-3 flex flex-col gap-1">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <span className="material-symbols-outlined text-white" style={{ fontSize: 15 }}>{icon}</span>
            </div>
            <p className="text-[19px] font-bold text-[var(--text-primary)] leading-none mt-1 tabular-nums">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
        </div>
    );
}

function BarChart({ daily }) {
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxViews = Math.max(...daily.map((d) => d.views), 1);

    return (
        <div>
            <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-widest">
                Views — last 7 days
            </p>
            <div className="flex items-end gap-1.5" style={{ height: 88 }}>
                {daily.map((d) => {
                    const pct = (d.views / maxViews) * 100;
                    const dayLabel = DAY_LABELS[new Date(d.date + 'T12:00:00').getDay()];
                    return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] text-[var(--text-secondary)] leading-none h-3">
                                {d.views > 0 ? d.views : ''}
                            </span>
                            <div className="w-full rounded-t-md bg-[var(--theme-accent)]/15 relative overflow-hidden flex-1">
                                <div
                                    className="absolute bottom-0 left-0 right-0 rounded-t-md bg-[var(--theme-accent)] transition-all duration-500"
                                    style={{ height: `${pct}%` }}
                                />
                            </div>
                            <span className="text-[9px] text-[var(--text-secondary)] leading-none">{dayLabel}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function PostAnalyticsModal({ postId, isOpen, onClose }) {
    const { data, isLoading } = usePostAnalytics(postId, isOpen);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[900] flex items-end sm:items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full sm:max-w-md bg-[var(--theme-surface)] rounded-t-3xl sm:rounded-2xl border border-[var(--theme-border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Drag handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-[var(--theme-border)]" />
                </div>

                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--theme-border)] shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[var(--theme-accent)]" style={{ fontSize: 20 }}>bar_chart</span>
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Post analytics</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-[var(--text-secondary)]" style={{ fontSize: 18 }}>close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-5 pb-8 pt-4 space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            <SkeletonBlock className="h-14 rounded-xl" />
                            <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonBlock key={i} className="h-20 rounded-xl" />
                                ))}
                            </div>
                            <SkeletonBlock className="h-32 rounded-xl" />
                        </div>
                    ) : data ? (
                        <>
                            {/* Post preview */}
                            {data.post?.content_preview && (
                                <div className="bg-[var(--theme-surface-hover)] rounded-xl px-4 py-3 flex gap-3 items-start">
                                    {data.post.media_url && data.post.media_type === 'image' && (
                                        <img
                                            src={data.post.media_url}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs text-[var(--text-primary)] line-clamp-2">
                                            {data.post.content_preview}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                                            {formatDateUppercase(data.post.created_at)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Stats grid */}
                            <div className="grid grid-cols-3 gap-2">
                                <StatCard label="Views"    value={data.summary.views}          icon="visibility"  color="bg-violet-500" />
                                <StatCard label="Reach"    value={data.summary.unique_viewers}  icon="groups"      color="bg-sky-500"    />
                                <StatCard label="Likes"    value={data.summary.likes}           icon="favorite"    color="bg-rose-500"   />
                                <StatCard label="Comments" value={data.summary.comments}        icon="chat_bubble" color="bg-blue-500"   />
                                <StatCard label="Shares"   value={data.summary.shares}          icon="ios_share"   color="bg-teal-500"   />
                                <div className="bg-[var(--theme-surface-hover)] rounded-xl p-3 flex flex-col justify-center items-center gap-0.5">
                                    <p className="text-[19px] font-bold text-[var(--theme-accent)] leading-none tabular-nums">
                                        {data.summary.engagement_rate}%
                                    </p>
                                    <p className="text-[11px] text-[var(--text-secondary)] text-center">Engagement</p>
                                </div>
                            </div>

                            {/* 7-day chart */}
                            <div className="bg-[var(--theme-surface-hover)] rounded-xl px-4 pt-4 pb-3">
                                <BarChart daily={data.daily} />
                            </div>

                            {/* Peak day */}
                            {data.peak_day && data.peak_day.views > 0 && (
                                <div className="flex items-center gap-3 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 rounded-xl px-4 py-3">
                                    <span className="material-symbols-outlined text-[var(--theme-accent)] shrink-0" style={{ fontSize: 20 }}>trending_up</span>
                                    <div>
                                        <p className="text-xs font-semibold text-[var(--text-primary)]">Peak day</p>
                                        <p className="text-[11px] text-[var(--text-secondary)]">
                                            {new Date(data.peak_day.date + 'T12:00:00').toLocaleDateString('en-US', {
                                                weekday: 'long', month: 'short', day: 'numeric',
                                            })}
                                            {' · '}
                                            {data.peak_day.views.toLocaleString()} view{data.peak_day.views !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Zero state */}
                            {data.summary.views === 0 && (
                                <div className="flex flex-col items-center gap-2 py-4 text-center">
                                    <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/30">visibility_off</span>
                                    <p className="text-xs text-[var(--text-secondary)]">No views recorded yet. Views are tracked when others see your post in their feed.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-[var(--text-secondary)] text-center py-8">Could not load analytics.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
