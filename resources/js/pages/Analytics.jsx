import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import { AnalyticsSkeleton } from '../components/common/skeletons';
import { Link } from 'react-router-dom';

const Analytics = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['analytics'],
        queryFn: () => userAPI.getAnalytics(),
        select: (res) => res.data?.analytics ?? {},
    });

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
                <p className="text-gray-400 text-sm mb-6">Track how your content and audience are growing over time.</p>
                <AnalyticsSkeleton />
            </div>
        );
    }

    const stats = [
        { label: 'Posts', value: data?.posts_count ?? 0 },
        { label: 'Likes received', value: data?.likes_received ?? 0 },
        { label: 'Comments received', value: data?.comments_received ?? 0 },
        { label: 'Followers', value: data?.followers_count ?? 0 },
        { label: 'Following', value: data?.following_count ?? 0 },
        { label: 'Reach (estimate)', value: data?.reach_estimate ?? 0 },
    ];

    const recentPosts = data?.recent_posts ?? [];

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-gray-400 text-sm mb-6">Track how your content and audience are growing over time.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {stats.map((s) => (
                    <div key={s.label} className="theme-surface rounded-xl p-6">
                        <p className="text-3xl font-bold text-white">{s.value}</p>
                        <p className="text-gray-400 text-sm mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <section className="theme-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Recent posts performance</h2>
                    <p className="text-xs text-gray-500">
                        Last {recentPosts.length || 0} posts
                    </p>
                </div>
                {recentPosts.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        You haven&apos;t posted yet. Share something to start seeing analytics.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400">
                                    <th className="py-2 pr-4 font-medium">Post</th>
                                    <th className="py-2 px-4 font-medium text-right">Likes</th>
                                    <th className="py-2 px-4 font-medium text-right">Comments</th>
                                    <th className="py-2 pl-4 font-medium text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPosts.map((post) => (
                                    <tr key={post.id} className="border-b border-gray-800 last:border-0">
                                        <td className="py-2 pr-4 align-top">
                                            <Link
                                                to={`/post/${post.id}`}
                                                className="text-slate-100 hover:text-primary line-clamp-2"
                                            >
                                                {post.content_preview || 'View post'}
                                            </Link>
                                        </td>
                                        <td className="py-2 px-4 text-right text-slate-100">
                                            {post.likes_count}
                                        </td>
                                        <td className="py-2 px-4 text-right text-slate-100">
                                            {post.comments_count}
                                        </td>
                                        <td className="py-2 pl-4 text-right text-gray-400">
                                            {post.created_at
                                                ? new Date(post.created_at).toLocaleDateString()
                                                : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Analytics;
