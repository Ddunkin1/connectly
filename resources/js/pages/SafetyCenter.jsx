import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const SafetyCenter = () => {
    const currentUser = useAuthStore((state) => state.user);
    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-white mb-3">Safety Center</h1>
            <p className="text-sm text-gray-400 mb-6">
                Learn how to control your experience on Connectly, manage who can interact with you, and report problems.
            </p>

            <section className="theme-surface rounded-xl p-6 mb-6 border border-white/5">
                <h2 className="text-lg font-semibold text-white mb-2">Block & report</h2>
                <p className="text-sm text-gray-400 mb-4">
                    If someone is bothering you or posting harmful content, you can block them or send a report for review.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 mb-4">
                    <li>
                        <span className="font-medium">Block users</span>: Blocked users can&apos;t see your profile, message you,
                        or see your posts. Manage blocked users from{' '}
                        <Link to="/settings" className="text-primary hover:underline">
                            Settings &gt; Blocked users
                        </Link>
                        .
                    </li>
                    <li>
                        <span className="font-medium">Report content</span>: Use the &quot;Report&quot; action on posts and
                        profiles to flag harassment, spam, or other policy violations for the moderation team.
                    </li>
                </ul>
                <p className="text-xs text-gray-500">
                    Reports are reviewed by moderators. Severe violations may lead to content removal or account suspension.
                </p>
            </section>

            <section className="theme-surface rounded-xl p-6 mb-6 border border-white/5">
                <h2 className="text-lg font-semibold text-white mb-2">Muted words & topics</h2>
                <p className="text-sm text-gray-400 mb-4">
                    You can reduce unwanted content by muting specific words or phrases. Posts and notifications containing
                    these terms will be de-prioritized or hidden where possible.
                </p>
                <p className="text-sm text-gray-300 mb-3">
                    To manage muted words, go to{' '}
                    <Link to="/settings" className="text-primary hover:underline">
                        Settings
                    </Link>{' '}
                    and scroll to the &quot;Muted words & topics&quot; section.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    <li>Muted words apply to your feed and certain notification text.</li>
                    <li>You can remove or add muted terms at any time.</li>
                </ul>
            </section>

            <section className="theme-surface rounded-xl p-6 mb-6 border border-white/5">
                <h2 className="text-lg font-semibold text-white mb-2">Privacy & visibility</h2>
                <p className="text-sm text-gray-400 mb-4">
                    Control who can see your profile and posts using your privacy settings.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 mb-4">
                    <li>
                        <span className="font-medium">Public profile</span>: Anyone on Connectly can see your profile and posts.
                    </li>
                    <li>
                        <span className="font-medium">Private profile</span>: Only approved connections can see your posts. You can
                        still message and join communities as usual.
                    </li>
                </ul>
                <p className="text-sm text-gray-300">
                    You can change your privacy settings from your{' '}
                    <Link to={currentUser?.username ? `/profile/${currentUser.username}?edit=1` : '/edit-profile'} className="text-primary hover:underline">
                        profile settings
                    </Link>
                    .
                </p>
            </section>

            <section className="theme-surface rounded-xl p-6 border border-white/5">
                <h2 className="text-lg font-semibold text-white mb-2">Data & account control</h2>
                <p className="text-sm text-gray-400 mb-4">
                    Export your data or delete your account at any time from the{' '}
                    <Link to="/settings" className="text-primary hover:underline">
                        Settings &gt; Privacy &amp; Data
                    </Link>{' '}
                    section.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    <li>Export a copy of your posts, followers, and other activity.</li>
                    <li>Permanently delete your account if you no longer wish to use Connectly.</li>
                </ul>
            </section>
        </div>
    );
};

export default SafetyCenter;

