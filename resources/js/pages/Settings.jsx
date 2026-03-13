import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, twoFactorAPI, pushAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { useBlockedUsers, useUnblockUser } from '../hooks/useBlocks';
import toast from 'react-hot-toast';

const DEFAULT_PREFS = {
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    messages: true,
};

const PUSH_STORAGE_KEY = 'connectly_push_endpoint';

const LABELS = {
    likes: 'Likes on your posts',
    comments: 'Comments on your posts',
    follows: 'New followers',
    mentions: 'When someone mentions you',
    messages: 'Direct messages',
};

const Settings = () => {
    const queryClient = useQueryClient();
    const [prefs, setPrefs] = useState(DEFAULT_PREFS);
    const [mutedTopics, setMutedTopics] = useState([]);
    const [mutedUsers, setMutedUsers] = useState([]);
    const [mutedCommunities, setMutedCommunities] = useState([]);
    const [newMutedTopic, setNewMutedTopic] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['notification-preferences'],
        queryFn: () => userAPI.getNotificationPreferences(),
        select: (res) => res.data ?? {},
    });

    const { data: twoFactorStatus } = useQuery({
        queryKey: ['two-factor-status'],
        queryFn: () => twoFactorAPI.getStatus(),
        select: (res) => res.data?.enabled ?? false,
    });

    const [blockedPage, setBlockedPage] = useState(1);
    const { data: blockedData, isLoading: blockedLoading } = useBlockedUsers(blockedPage);
    const unblockMutation = useUnblockUser();
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const logout = useAuthStore((s) => s.logout);

    const exportMutation = useMutation({
        mutationFn: () => userAPI.exportData(),
        onSuccess: (res) => {
            const blob = new Blob([JSON.stringify(res.data?.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `connectly-data-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Data exported');
        },
        onError: () => toast.error('Export failed'),
    });

    const deleteAccountMutation = useMutation({
        mutationFn: (data) => userAPI.deleteAccount(data),
        onSuccess: () => {
            logout();
            window.location.href = '/';
        },
        onError: () => toast.error('Failed to delete account. Check your password.'),
    });

    const [twoFactorSetup, setTwoFactorSetup] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorQrUrl, setTwoFactorQrUrl] = useState('');
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [disablePassword, setDisablePassword] = useState('');
    const [pushEndpoint, setPushEndpoint] = useState(() => localStorage.getItem(PUSH_STORAGE_KEY) || '');
    const [pushPermission, setPushPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'denied'));

    const setup2FAMutation = useMutation({
        mutationFn: () => twoFactorAPI.setup(),
        onSuccess: (res) => {
            setTwoFactorQrUrl(res.data?.qr_code_url || '');
            setTwoFactorSetup(true);
        },
        onError: () => toast.error('Failed to start 2FA setup'),
    });

    const confirm2FAMutation = useMutation({
        mutationFn: (code) => twoFactorAPI.confirm(code),
        onSuccess: (res) => {
            setRecoveryCodes(res.data?.recovery_codes || []);
            setTwoFactorSetup(false);
            setTwoFactorCode('');
            setShowRecoveryCodes(true);
            queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
            toast.success('Two-factor authentication enabled');
        },
        onError: () => toast.error('Invalid code. Try again.'),
    });

    const disable2FAMutation = useMutation({
        mutationFn: (password) => twoFactorAPI.disable(password),
        onSuccess: () => {
            setDisablePassword('');
            queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
            toast.success('Two-factor authentication disabled');
        },
        onError: () => toast.error('Invalid password'),
    });

    const updateMutation = useMutation({
        mutationFn: (data) => userAPI.updateNotificationPreferences(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
            toast.success('Notification settings saved');
        },
        onError: () => toast.error('Failed to save settings'),
    });

    const subscribePushMutation = useMutation({
        mutationFn: ({ subscription }) => pushAPI.subscribe(subscription),
        onSuccess: (_, vars) => {
            if (vars?.endpoint) {
                localStorage.setItem(PUSH_STORAGE_KEY, vars.endpoint);
                setPushEndpoint(vars.endpoint);
            }
            setPushPermission(Notification.permission);
            toast.success('Push notifications enabled');
        },
        onError: (e) => toast.error(e?.response?.data?.message || 'Failed to enable push'),
    });

    const unsubscribePushMutation = useMutation({
        mutationFn: (endpoint) => pushAPI.unsubscribe(endpoint),
        onSuccess: () => {
            localStorage.removeItem(PUSH_STORAGE_KEY);
            setPushEndpoint('');
            toast.success('Push notifications disabled');
        },
        onError: (e) => toast.error(e?.response?.data?.message || 'Failed to disable push'),
    });

    useEffect(() => {
        if (!data) return;
        const np = data.notification_preferences ?? DEFAULT_PREFS;
        setPrefs({ ...DEFAULT_PREFS, ...np });
        setMutedTopics(Array.isArray(data.muted_topics) ? data.muted_topics : []);
        setMutedUsers(Array.isArray(data.muted_users) ? data.muted_users : []);
        setMutedCommunities(Array.isArray(data.muted_communities) ? data.muted_communities : []);
    }, [data]);

    const handleToggle = (key) => {
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        updateMutation.mutate({
            notification_preferences: next,
            muted_topics: mutedTopics,
            muted_users: mutedUsers,
            muted_communities: mutedCommunities,
        });
    };

    const handleAddMutedTopic = (e) => {
        e.preventDefault();
        const value = newMutedTopic.trim();
        if (!value) return;
        if (mutedTopics.includes(value)) {
            setNewMutedTopic('');
            return;
        }
        const next = [...mutedTopics, value];
        setMutedTopics(next);
        setNewMutedTopic('');
        updateMutation.mutate({
            notification_preferences: prefs,
            muted_topics: next,
            muted_users: mutedUsers,
            muted_communities: mutedCommunities,
        });
    };

    const handleRemoveMutedTopic = (topic) => {
        const next = mutedTopics.filter((t) => t !== topic);
        setMutedTopics(next);
        updateMutation.mutate({
            notification_preferences: prefs,
            muted_topics: next,
            muted_users: mutedUsers,
            muted_communities: mutedCommunities,
        });
    };

    const handleEnablePush = async () => {
        if (typeof Notification === 'undefined') {
            toast.error('Push notifications are not supported in this browser');
            return;
        }
        if (Notification.permission === 'denied') {
            toast.error('Push notifications are blocked. Please allow them in your browser settings.');
            return;
        }
        if (Notification.permission === 'default') {
            const perm = await Notification.requestPermission();
            setPushPermission(perm);
            if (perm !== 'granted') {
                toast.error('Permission denied');
                return;
            }
        }
        if (!('serviceWorker' in navigator)) {
            toast.error('Service worker is required for push notifications');
            return;
        }
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
            toast.error('Push notifications are not configured. Contact support.');
            return;
        }
        try {
            const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;
            const key = vapidKey.replace(/-/g, '+').replace(/_/g, '/');
            const keyBytes = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: keyBytes,
            });
            const endpoint = sub.endpoint;
            const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh'))));
            const auth = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))));
            subscribePushMutation.mutate({
                subscription: { endpoint, keys: { p256dh, auth } },
                endpoint,
            });
        } catch (err) {
            toast.error(err?.message || 'Failed to subscribe to push');
        }
    };

    const handleDisablePush = () => {
        if (!pushEndpoint) return;
        unsubscribePushMutation.mutate(pushEndpoint);
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Settings</h1>
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Settings</h1>

            <section className="theme-surface rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Notification preferences
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    Choose which notifications you want to receive.
                </p>
                <div className="space-y-4">
                    {Object.entries(LABELS).map(([key, label]) => (
                        <div
                            key={key}
                            className="flex items-center justify-between py-2 border-b border-[var(--theme-border)]/60 last:border-0"
                        >
                            <span className="text-[var(--text-primary)]">{label}</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={!!prefs[key]}
                                onClick={() => handleToggle(key)}
                                disabled={updateMutation.isPending}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2 focus:ring-offset-[#1A1A1A] disabled:opacity-60 ${
                                    prefs[key] ? 'bg-[var(--theme-accent)]' : 'bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                                        prefs[key] ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="theme-surface rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                    Muted words & topics
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Hide posts and notifications that contain specific words or phrases. This only affects what you see.
                </p>
                <form onSubmit={handleAddMutedTopic} className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input
                        type="text"
                        value={newMutedTopic}
                        onChange={(e) => setNewMutedTopic(e.target.value)}
                        placeholder="Add word or phrase to mute"
                        className="flex-1 px-4 py-2 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/70 text-sm"
                    />
                    <Button type="submit" disabled={updateMutation.isPending || !newMutedTopic.trim()}>
                        Add
                    </Button>
                </form>
                {mutedTopics.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                        You haven&apos;t muted any words yet.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {mutedTopics.map((topic) => (
                            <span
                                key={topic}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--theme-surface-hover)] text-xs text-[var(--text-primary)]"
                            >
                                {topic}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMutedTopic(topic)}
                                    className="ml-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </section>

            <section className="theme-surface rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Push notifications
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    Receive notifications in your browser when you're not on the site.
                </p>
                {typeof Notification === 'undefined' ? (
                    <p className="text-[var(--text-secondary)] text-sm">
                        Push notifications are not supported in this browser.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Status: {pushEndpoint ? 'Enabled' : pushPermission === 'granted' ? 'Permission granted (click Enable to finish)' : pushPermission === 'denied' ? 'Blocked' : 'Not enabled'}
                        </p>
                        <div className="flex gap-2">
                            {pushEndpoint ? (
                                <Button
                                    variant="outline"
                                    onClick={handleDisablePush}
                                    disabled={unsubscribePushMutation.isPending}
                                >
                                    {unsubscribePushMutation.isPending ? 'Disabling...' : 'Disable push notifications'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleEnablePush}
                                    disabled={subscribePushMutation.isPending}
                                >
                                    {subscribePushMutation.isPending ? 'Enabling...' : 'Enable push notifications'}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </section>

            <section className="theme-surface rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Two-factor authentication
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    Add an extra layer of security to your account.
                </p>
                {twoFactorStatus ? (
                    <div>
                        <p className="text-green-500 text-sm mb-4">Two-factor authentication is enabled.</p>
                        <div className="flex items-center gap-4">
                            <input
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Enter your password to disable"
                                className="flex-1 px-4 py-2 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/70"
                            />
                            <Button
                                onClick={() => disable2FAMutation.mutate(disablePassword)}
                                disabled={!disablePassword || disable2FAMutation.isPending}
                            >
                                {disable2FAMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
                            </Button>
                        </div>
                    </div>
                ) : twoFactorSetup ? (
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Scan this QR code with your authenticator app:
                        </p>
                        {twoFactorQrUrl && (
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorQrUrl)}`}
                                alt="QR Code"
                                className="w-48 h-48 bg-white p-2 rounded"
                            />
                        )}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                Enter the 6-digit code to confirm:
                            </label>
                            <input
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full max-w-xs px-4 py-2 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--text-primary)] text-center tracking-widest"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => confirm2FAMutation.mutate(twoFactorCode)}
                                disabled={twoFactorCode.length !== 6 || confirm2FAMutation.isPending}
                            >
                                {confirm2FAMutation.isPending ? 'Verifying...' : 'Confirm'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setTwoFactorSetup(false); setTwoFactorCode(''); }}
                                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : showRecoveryCodes && recoveryCodes.length > 0 ? (
                    <div className="p-4 bg-[var(--theme-surface)] rounded-lg">
                        <p className="text-sm text-amber-400 mb-2">
                            Save these recovery codes in a secure place. You can use them to access your account if you lose your authenticator device.
                        </p>
                        <div className="flex flex-wrap gap-2 font-mono text-sm mb-4">
                            {recoveryCodes.map((code) => (
                                <span key={code} className="px-2 py-1 bg-[#252538] rounded">{code}</span>
                            ))}
                        </div>
                        <Button onClick={() => { setShowRecoveryCodes(false); setRecoveryCodes([]); }}>
                            I've saved my recovery codes
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => setup2FAMutation.mutate()}
                        disabled={setup2FAMutation.isPending}
                    >
                        {setup2FAMutation.isPending ? 'Setting up...' : 'Enable two-factor authentication'}
                    </Button>
                )}
            </section>

            <section className="theme-surface rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Blocked users</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">
                    Users you have blocked cannot see your profile, message you, or see your posts.
                </p>
                {blockedLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : !blockedData?.blocked_users?.length ? (
                    <p className="text-gray-500 text-sm">You have not blocked any users.</p>
                ) : (
                    <div className="space-y-3">
                        {blockedData.blocked_users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar src={user.profile_picture} alt={user.name} size="md" />
                                    <div>
                                        <p className="text-[var(--text-primary)] font-medium">{user.name}</p>
                                        <p className="text-[var(--text-secondary)] text-sm">@{user.username}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => unblockMutation.mutate(user.id)}
                                    disabled={unblockMutation.isPending}
                                    className="!border-red-500/50 !text-red-400 hover:!bg-red-500/10"
                                >
                                    {unblockMutation.isPending ? 'Unblocking...' : 'Unblock'}
                                </Button>
                            </div>
                        ))}
                        {blockedData.pagination?.last_page > 1 && (
                            <div className="flex justify-center gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setBlockedPage((p) => Math.max(1, p - 1))}
                                    disabled={blockedPage <= 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setBlockedPage((p) => p + 1)}
                                    disabled={blockedPage >= blockedData.pagination.last_page}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="theme-surface rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    Privacy & Data
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                    Export your data or permanently delete your account (GDPR/CCPA).
                </p>
                <div className="space-y-4">
                    <div>
                        <Button
                            variant="outline"
                            onClick={() => exportMutation.mutate()}
                            disabled={exportMutation.isPending}
                        >
                            {exportMutation.isPending ? 'Exporting...' : 'Export my data'}
                        </Button>
                    </div>
                    <div className="pt-4 border-t border-gray-700/50">
                        <p className="text-sm text-red-400 mb-2">Delete account (permanent)</p>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Your password"
                            className="w-full max-w-xs px-4 py-2 rounded-lg bg-[#1A1A1A] border border-gray-600 text-white mb-2"
                        />
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder='Type DELETE to confirm'
                            className="w-full max-w-xs px-4 py-2 rounded-lg bg-[#1A1A1A] border border-gray-600 text-white mb-2"
                        />
                        <Button
                            variant="danger"
                            onClick={() => deleteAccountMutation.mutate({ password: deletePassword, confirmation: deleteConfirm })}
                            disabled={!deletePassword || deleteConfirm !== 'DELETE' || deleteAccountMutation.isPending}
                        >
                            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete my account'}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
