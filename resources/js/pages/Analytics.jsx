import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Analytics = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['analytics'],
        queryFn: () => userAPI.getAnalytics(),
        select: (res) => res.data?.analytics ?? {},
    });

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-white mb-4">Analytics</h1>
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
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

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-white mb-4">Analytics</h1>
            <p className="text-gray-400 text-sm mb-6">Track your post performance and engagement.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="theme-surface rounded-xl p-6">
                        <p className="text-3xl font-bold text-white">{s.value}</p>
                        <p className="text-gray-400 text-sm mt-1">{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Analytics;
