import React from 'react';
import useAuthStore from '../store/authStore';

const Invites = () => {
    const user = useAuthStore((s) => s.user);
    const baseUrl = window.location.origin;
    const referralCode = user?.username || user?.id;
    const inviteLink = `${baseUrl}/register?ref=${encodeURIComponent(referralCode)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
        } catch {
            // ignore
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-white mb-2">Invite friends</h1>
            <p className="text-sm text-gray-400 mb-6">
                Share your invite link to bring friends and collaborators to Connectly.
            </p>

            <section className="theme-surface rounded-xl p-6 mb-6 border border-white/5">
                <h2 className="text-lg font-semibold text-white mb-3">Your invite link</h2>
                <p className="text-sm text-gray-400 mb-4">
                    Anyone who signs up with this link will be connected to you automatically.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <input
                        type="text"
                        readOnly
                        value={inviteLink}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#1A1A1A] border border-gray-600 text-white text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
                    >
                        Copy link
                    </button>
                </div>
            </section>

            <section className="theme-surface rounded-xl p-6 border border-white/5">
                <h2 className="text-lg font-semibold text-white mb-3">How it works</h2>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                    <li>Share your invite link via email, chat, or social media.</li>
                    <li>When someone signs up, they&apos;ll see you as a suggested connection.</li>
                    <li>More invite and referral insights may be added in the future.</li>
                </ul>
            </section>
        </div>
    );
};

export default Invites;

